"""
evaluate_ensemble.py
Evalua el ensemble WBF (nano+small+medium) en el test set
y calcula mAP50 comparado contra los modelos individuales.
Uso: python evaluate_ensemble.py
"""

import os, sys, json
from pathlib import Path
import numpy as np
import yaml
from tqdm import tqdm
from ensemble_boxes import weighted_boxes_fusion
from ultralytics import YOLO
def box_iou(box1: np.ndarray, box2: np.ndarray) -> np.ndarray:
    """IoU entre box1 (N,4) y box2 (M,4) — devuelve (N,M)."""
    x1 = np.maximum(box1[:, None, 0], box2[None, :, 0])
    y1 = np.maximum(box1[:, None, 1], box2[None, :, 1])
    x2 = np.minimum(box1[:, None, 2], box2[None, :, 2])
    y2 = np.minimum(box1[:, None, 3], box2[None, :, 3])
    inter = np.maximum(0, x2 - x1) * np.maximum(0, y2 - y1)
    a1 = (box1[:, 2] - box1[:, 0]) * (box1[:, 3] - box1[:, 1])
    a2 = (box2[:, 2] - box2[:, 0]) * (box2[:, 3] - box2[:, 1])
    union = a1[:, None] + a2[None, :] - inter
    return inter / (union + 1e-9)

# ── Config ────────────────────────────────────────────────────────────────────
MODEL_PATHS = [
    "models/yolov8n_aitex/best.pt",
    "models/yolov8s_aitex/best.pt",
    "models/yolov8m_aitex/best.pt",
]
WBF_WEIGHTS  = [0.30, 0.35, 0.35]
WBF_IOU_THR  = 0.55
WBF_SKIP_THR = 0.001
CONF_THR     = 0.25
IOU_MATCH    = 0.50
DATA_YAML    = "fabric-defects-split/data.yaml"
NC           = 20
# ─────────────────────────────────────────────────────────────────────────────


def load_labels(label_path: Path, img_w: int, img_h: int):
    """Lee etiquetas YOLO y devuelve (boxes_xyxy, classes)."""
    boxes, classes = [], []
    if not label_path.exists():
        return np.zeros((0, 4)), np.zeros(0, dtype=int)
    for line in label_path.read_text().splitlines():
        parts = line.strip().split()
        if len(parts) < 5:
            continue
        cls = int(parts[0])
        cx, cy, w, h = map(float, parts[1:5])
        x1 = (cx - w / 2) * img_w
        y1 = (cy - h / 2) * img_h
        x2 = (cx + w / 2) * img_w
        y2 = (cy + h / 2) * img_h
        boxes.append([x1, y1, x2, y2])
        classes.append(cls)
    return np.array(boxes, dtype=float), np.array(classes, dtype=int)


def compute_ap(recall: np.ndarray, precision: np.ndarray) -> float:
    """Area bajo la curva precision-recall (metodo interpolacion 101 puntos)."""
    mrec = np.concatenate(([0.0], recall, [1.0]))
    mpre = np.concatenate(([1.0], precision, [0.0]))
    for i in range(mpre.size - 1, 0, -1):
        mpre[i - 1] = max(mpre[i - 1], mpre[i])
    idx = np.where(mrec[1:] != mrec[:-1])[0]
    return float(np.sum((mrec[idx + 1] - mrec[idx]) * mpre[idx + 1]))


def evaluate_predictions(all_preds, all_gts, nc: int, iou_thr: float = 0.50):
    """
    all_preds: list of (boxes_xyxy, scores, classes) por imagen
    all_gts:   list of (boxes_xyxy, classes) por imagen
    Devuelve mAP50 global y AP por clase.
    """
    # Acumular TP/FP/scores por clase
    class_tp   = {c: [] for c in range(nc)}
    class_fp   = {c: [] for c in range(nc)}
    class_sc   = {c: [] for c in range(nc)}
    class_ngt  = {c: 0  for c in range(nc)}

    for (pred_boxes, pred_scores, pred_cls), (gt_boxes, gt_cls) in zip(all_preds, all_gts):
        for c in np.unique(gt_cls):
            class_ngt[int(c)] += int(np.sum(gt_cls == c))

        if len(pred_boxes) == 0:
            continue

        gt_matched = np.zeros(len(gt_boxes), dtype=bool)

        # Ordenar preds por confianza descendente
        order = np.argsort(-pred_scores)
        pred_boxes  = pred_boxes[order]
        pred_scores = pred_scores[order]
        pred_cls    = pred_cls[order]

        for pb, ps, pc in zip(pred_boxes, pred_scores, pred_cls):
            pc = int(pc)
            class_sc[pc].append(ps)
            gt_same = np.where(gt_cls == pc)[0]
            if len(gt_same) == 0 or len(gt_boxes) == 0:
                class_tp[pc].append(0); class_fp[pc].append(1); continue

            ious = box_iou(
                np.array([pb]),
                gt_boxes[gt_same]
            ).flatten()
            best_i = int(np.argmax(ious))
            if ious[best_i] >= iou_thr and not gt_matched[gt_same[best_i]]:
                gt_matched[gt_same[best_i]] = True
                class_tp[pc].append(1); class_fp[pc].append(0)
            else:
                class_tp[pc].append(0); class_fp[pc].append(1)

    aps = {}
    for c in range(nc):
        ngt = class_ngt[c]
        if ngt == 0:
            continue
        sc = np.array(class_sc[c])
        tp = np.array(class_tp[c])
        fp = np.array(class_fp[c])
        if len(sc) == 0:
            aps[c] = 0.0; continue
        order = np.argsort(-sc)
        tp = tp[order]; fp = fp[order]
        tp_cum = np.cumsum(tp)
        fp_cum = np.cumsum(fp)
        rec = tp_cum / ngt
        pre = tp_cum / (tp_cum + fp_cum + 1e-9)
        aps[c] = compute_ap(rec, pre)

    map50 = float(np.mean(list(aps.values()))) if aps else 0.0
    return map50, aps


def run_single_model(model, img_paths, conf=CONF_THR):
    preds = []
    for p in tqdm(img_paths, desc=f"  {Path(model.model_name if hasattr(model,'model_name') else 'model').stem}", leave=False):
        res = model(str(p), conf=conf, verbose=False)[0]
        if res.boxes is not None and len(res.boxes):
            boxes  = res.boxes.xyxy.cpu().numpy()
            scores = res.boxes.conf.cpu().numpy()
            clss   = res.boxes.cls.cpu().numpy().astype(int)
        else:
            boxes, scores, clss = np.zeros((0,4)), np.zeros(0), np.zeros(0,dtype=int)
        preds.append((boxes, scores, clss))
    return preds


def run_ensemble(models_preds, img_sizes):
    """Aplica WBF sobre las predicciones de los 3 modelos."""
    ensemble_preds = []
    weights = WBF_WEIGHTS[:len(models_preds)]
    total_w = sum(weights)
    weights = [w / total_w for w in weights]

    for i, (h, w) in enumerate(img_sizes):
        all_boxes, all_scores, all_labels = [], [], []
        for m_preds in models_preds:
            boxes, scores, clss = m_preds[i]
            if len(boxes):
                norm = boxes / np.array([w, h, w, h])
                norm = np.clip(norm, 0, 1)
                all_boxes.append(norm.tolist())
                all_scores.append(scores.tolist())
                all_labels.append(clss.tolist())
            else:
                all_boxes.append([])
                all_scores.append([])
                all_labels.append([])

        if not any(all_boxes):
            ensemble_preds.append((np.zeros((0,4)), np.zeros(0), np.zeros(0,dtype=int)))
            continue

        fb, fs, fl = weighted_boxes_fusion(
            all_boxes, all_scores, all_labels,
            weights=weights, iou_thr=WBF_IOU_THR, skip_box_thr=WBF_SKIP_THR,
        )
        # Desnormalizar
        if len(fb):
            fb = (np.array(fb) * np.array([w, h, w, h])).astype(float)
            fs = np.array(fs)
            fl = np.array(fl).astype(int)
            # Filtrar por conf
            mask = fs >= CONF_THR
            fb, fs, fl = fb[mask], fs[mask], fl[mask]
        else:
            fb, fs, fl = np.zeros((0,4)), np.zeros(0), np.zeros(0,dtype=int)

        ensemble_preds.append((fb, fs, fl))
    return ensemble_preds


def main():
    # Cargar config
    with open(DATA_YAML) as f:
        cfg = yaml.safe_load(f)
    class_names = cfg["names"]

    test_img_dir = Path(cfg["path"]) / "test" / "images"
    test_lbl_dir = Path(cfg["path"]) / "test" / "labels"
    img_paths = sorted(test_img_dir.glob("*.jpg"))
    print(f"Test set: {len(img_paths)} imagenes")

    # Cargar ground truth
    from PIL import Image
    gts, img_sizes = [], []
    for p in img_paths:
        with Image.open(p) as im:
            w, h = im.size
        img_sizes.append((h, w))
        lbl = test_lbl_dir / p.with_suffix(".txt").name
        boxes, classes = load_labels(lbl, w, h)
        gts.append((boxes, classes))

    # Cargar modelos
    print("\nCargando modelos...")
    models = [YOLO(mp) for mp in MODEL_PATHS if Path(mp).exists()]
    model_names = [Path(mp).parts[-2] for mp in MODEL_PATHS if Path(mp).exists()]

    # Evaluar modelos individuales
    results = {}
    all_model_preds = []
    for model, name in zip(models, model_names):
        print(f"\nEvaluando {name}...")
        preds = run_single_model(model, img_paths)
        all_model_preds.append(preds)
        map50, aps = evaluate_predictions(preds, gts, NC)
        results[name] = {"mAP50": map50, "aps": aps}
        print(f"  mAP50 = {map50*100:.1f}%")

    # Evaluar ensemble WBF
    print("\nCalculando ensemble WBF...")
    ens_preds = run_ensemble(all_model_preds, img_sizes)
    map50_ens, aps_ens = evaluate_predictions(ens_preds, gts, NC)
    results["ensemble_WBF"] = {"mAP50": map50_ens, "aps": aps_ens}

    # Imprimir tabla
    print("\n" + "="*60)
    print("  TABLA COMPARATIVA — mAP50 en Test Set")
    print("="*60)
    print(f"  {'Modelo':<25} {'mAP50':>8}  {'Ganancia':>10}")
    print("-"*60)
    nano_map = results.get("yolov8n_aitex", {}).get("mAP50", 0)
    for name, res in results.items():
        m = res["mAP50"]
        gain = ""
        if name == "ensemble_WBF" and nano_map:
            gain = f"+{(m - nano_map)*100:.1f}% vs nano"
        print(f"  {name:<25} {m*100:>7.1f}%  {gain}")
    print("="*60)

    # AP por clase para el ensemble
    print("\n  AP por clase (Ensemble WBF):")
    print(f"  {'Clase':<35} {'AP50':>7}  {'#GT':>5}")
    print("-"*55)
    gt_counts = {}
    for _, gt_cls in gts:
        for c in gt_cls:
            gt_counts[int(c)] = gt_counts.get(int(c), 0) + 1
    for c in range(NC):
        ap = aps_ens.get(c, None)
        if ap is None:
            continue
        cname = class_names[c] if c < len(class_names) else f"class_{c}"
        ngt = gt_counts.get(c, 0)
        bar = "#" * int(ap * 20)
        print(f"  {cname:<35} {ap*100:>6.1f}%  {ngt:>5}  {bar}")

    # Guardar JSON
    out = {k: {"mAP50": round(v["mAP50"]*100, 2)} for k, v in results.items()}
    Path("results_comparison.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False)
    )
    print(f"\n[OK] Resultados guardados en results_comparison.json")
    print(f"\nEnsemble WBF final: {map50_ens*100:.1f}% mAP50")


if __name__ == "__main__":
    main()
