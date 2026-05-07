"""
predict_ensemble.py
Ensemble de 3 modelos YOLOv8 con Weighted Boxes Fusion (WBF).
Listo para importar desde Django o usar standalone.

Uso standalone:
    python predict_ensemble.py --source 0          # webcam
    python predict_ensemble.py --source imagen.jpg # imagen
"""

import cv2
import numpy as np
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from ensemble_boxes import weighted_boxes_fusion

# ── Rutas de modelos ──────────────────────────────────────────────────────────
MODEL_PATHS = {
    "nano":   "models/yolov8n_aitex/best.pt",
    "small":  "models/yolov8s_aitex/best.pt",
    "medium": "models/yolov8m_aitex/best.pt",
}

# Pesos WBF basados en mAP50 real del test set:
# nano=12.6%, small=23.3%, medium=15.8% (evaluacion YOLO val oficial)
# -> small recibe peso proporcional a su mejor desempeno
WBF_WEIGHTS = [0.20, 0.50, 0.30]
WBF_IOU_THR  = 0.55
WBF_SKIP_THR = 0.10   # bajo para que clases débiles entren al WBF
IOU_NMS      = 0.45

# Umbral de confianza por clase — basado en mAP50 real del test set (YOLO val).
# Regla: clase fuerte (mAP>30%) → umbral alto (menos falsos positivos).
#        clase débil  (mAP<10%) → umbral bajo (ser más permisivo, no perder detecciones).
CONF_THR_DEFAULT = 0.25
CONF_THR_BY_CLASS = {
    # clase_id: umbral   # nombre — mAP50 en test set
    0:  0.15,  # Abrasion-marks-discolouration — débil
    1:  0.35,  # Crease           — 49.7%  bueno
    2:  0.45,  # Damaged-Selvedge — 99.5%  muy bueno (solo 1 muestra, precaución)
    3:  0.12,  # Fly yarn         —  9.1%  muy débil
    4:  0.15,  # Looseness-of-leather — sin datos suficientes
    5:  0.12,  # MissPick         —  5.8%  muy débil
    6:  0.38,  # Open-seam        — 47.8%  bueno
    7:  0.13,  # Skip-stitch      —  6.8%  débil
    8:  0.20,  # Snag             — 17.7%  moderado
    9:  0.20,  # Weft-bar-Warp-bar— 20.3%  moderado
    10: 0.20,  # hole             — 17.8%  moderado
    11: 0.25,  # knots            — 22.0%  moderado
    12: 0.22,  # loose-thread     — 21.3%  moderado
    13: 0.15,  # misplaced-mis-threaded — débil
    14: 0.13,  # misprinting      —  8.6%  débil
    15: 0.28,  # piling           — 26.2%  bueno
    16: 0.23,  # press-off        — 21.5%  moderado
    17: 0.10,  # seam-puckering   —  0.9%  muy débil
    18: 0.25,  # slub             — 23.8%  moderado
    19: 0.20,  # spot             — 19.9%  moderado
}

CLASSES = [
    "Abrasion-marks-discolouration", "Crease", "Damaged-Selvedge", "Fly yarn",
    "Looseness-of-leather.", "MissPick", "Open-seam", "Skip-stitch", "Snag",
    "Weft-bar-Warp-bar", "hole", "knots", "loose-thread", "misplaced-mis-threaded",
    "misprinting", "piling", "press-off", "seam-puckering", "slub", "spot",
]

# Colores por severidad (BGR): rojo=alta, naranja=media, amarillo=baja
SEVERITY_COLORS = {
    "hole":                         (0, 0, 255),    # rojo — critico
    "Open-seam":                    (0, 0, 255),
    "press-off":                    (0, 0, 255),
    "broken_thread":                (0, 0, 255),
    "Snag":                         (0, 100, 255),  # naranja
    "loose-thread":                 (0, 100, 255),
    "Skip-stitch":                  (0, 100, 255),
    "seam-puckering":               (0, 100, 255),
    "Crease":                       (0, 200, 255),  # amarillo
    "spot":                         (0, 200, 255),
    "Abrasion-marks-discolouration":(0, 200, 255),
}
DEFAULT_COLOR = (0, 255, 100)  # verde — defecto menor

# ── Carga de modelos ──────────────────────────────────────────────────────────
_models = {}

def load_models():
    """Carga los 3 modelos. Llama una vez al arrancar."""
    from ultralytics import YOLO
    global _models
    for name, path in MODEL_PATHS.items():
        p = Path(path)
        if not p.exists():
            print(f"[WARN] Modelo no encontrado: {path} — omitido del ensemble")
            continue
        _models[name] = YOLO(str(p))
        print(f"[OK] Modelo cargado: {name} ({path})")
    if not _models:
        raise RuntimeError("Ningún modelo encontrado. Ejecuta verify_models.py primero.")
    return _models


def _preprocess(frame: np.ndarray) -> np.ndarray:
    """
    Convierte frame de cámara al espacio de color del dataset de entrenamiento.
    El dataset fue entrenado con imágenes en escala de grises (CRT phosphor).
    Convirtiendo a gris + CLAHE mejora contraste de defectos sutiles.
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    return cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)


def _run_model(args):
    """Corre un modelo y devuelve boxes normalizadas para WBF."""
    name, model, frame, h, w = args
    results = model(frame, conf=WBF_SKIP_THR, iou=IOU_NMS, verbose=False)[0]
    boxes, scores, labels = [], [], []
    if results.boxes is not None and len(results.boxes):
        for box in results.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            boxes.append([x1/w, y1/h, x2/w, y2/h])
            scores.append(float(box.conf[0]))
            labels.append(int(box.cls[0]))
    return boxes, scores, labels


def predict_ensemble(frame: np.ndarray) -> list[dict]:
    """
    Recibe un frame BGR de OpenCV, devuelve lista de detecciones fusionadas.

    Cada detección es un dict:
        {
          "class_id":   int,
          "class_name": str,
          "confidence": float,
          "bbox":       [x1, y1, x2, y2]  # píxeles absolutos
        }
    """
    if not _models:
        load_models()

    h, w = frame.shape[:2]
    preprocessed = _preprocess(frame)

    model_list = list(_models.items())
    args = [(name, model, preprocessed, h, w) for name, model in model_list]

    with ThreadPoolExecutor(max_workers=len(args)) as ex:
        outputs = list(ex.map(_run_model, args))

    all_boxes   = [o[0] for o in outputs]
    all_scores  = [o[1] for o in outputs]
    all_labels  = [o[2] for o in outputs]

    # Ajustar pesos al número real de modelos cargados
    weights = WBF_WEIGHTS[: len(model_list)]
    total = sum(weights)
    weights = [w / total for w in weights]

    if not any(all_boxes):
        return []

    fused_boxes, fused_scores, fused_labels = weighted_boxes_fusion(
        all_boxes, all_scores, all_labels,
        weights=weights,
        iou_thr=WBF_IOU_THR,
        skip_box_thr=WBF_SKIP_THR,
    )

    detections = []
    for box, score, label in zip(fused_boxes, fused_scores, fused_labels):
        cls_id = int(label)
        thr = CONF_THR_BY_CLASS.get(cls_id, CONF_THR_DEFAULT)
        if score < thr:
            continue
        x1 = int(box[0] * w)
        y1 = int(box[1] * h)
        x2 = int(box[2] * w)
        y2 = int(box[3] * h)
        cls_name = CLASSES[cls_id] if cls_id < len(CLASSES) else f"class_{cls_id}"
        detections.append({
            "class_id":   cls_id,
            "class_name": cls_name,
            "confidence": round(float(score), 3),
            "bbox":       [x1, y1, x2, y2],
        })

    return detections


def draw_overlay(frame: np.ndarray, detections: list[dict]) -> np.ndarray:
    """
    Dibuja bounding boxes y etiquetas sobre el frame.
    Devuelve frame con overlay (no modifica el original).
    """
    out = frame.copy()
    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        cls_name = det["class_name"]
        conf = det["confidence"]
        color = SEVERITY_COLORS.get(cls_name, DEFAULT_COLOR)

        cv2.rectangle(out, (x1, y1), (x2, y2), color, 2)

        label = f"{cls_name} {conf:.0%}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
        cv2.rectangle(out, (x1, y1 - th - 6), (x1 + tw + 4, y1), color, -1)
        cv2.putText(out, label, (x1 + 2, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 1, cv2.LINE_AA)

    # HUD: contador de defectos
    n = len(detections)
    status = f"Defectos: {n}" if n else "OK — Sin defectos"
    hud_color = (0, 0, 200) if n else (0, 200, 0)
    cv2.putText(out, status, (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, hud_color, 2, cv2.LINE_AA)
    return out


# ── Modo standalone (webcam o imagen) ────────────────────────────────────────
if __name__ == "__main__":
    import argparse, time

    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default="1",
                        help="0=webcam, ruta a imagen o video")
    parser.add_argument("--conf", type=float, default=None,
                        help="Umbral global (sobreescribe umbrales por clase)")
    args_cli = parser.parse_args()
    if args_cli.conf is not None:
        # Sobreescribir todos los umbrales por clase con el valor dado
        for k in CONF_THR_BY_CLASS:
            CONF_THR_BY_CLASS[k] = args_cli.conf

    load_models()

    src = args_cli.source
    if src.isdigit():
        cap = cv2.VideoCapture(int(src))
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        print("[INFO] Presiona 'q' para salir, 's' para captura.")

        fps_times = []
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            t0 = time.perf_counter()
            dets = predict_ensemble(frame)
            dt = time.perf_counter() - t0
            fps_times.append(dt)
            if len(fps_times) > 30:
                fps_times.pop(0)
            fps = 1.0 / (sum(fps_times) / len(fps_times))

            out_frame = draw_overlay(frame, dets)
            cv2.putText(out_frame, f"{fps:.1f} FPS | {dt*1000:.0f}ms",
                        (10, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                        (200, 200, 200), 1, cv2.LINE_AA)

            cv2.imshow("Inspector de Calidad AR", out_frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break
            if key == ord("s"):
                fname = f"captura_{int(time.time())}.jpg"
                cv2.imwrite(fname, out_frame)
                print(f"[OK] Guardado: {fname}")

        cap.release()
        cv2.destroyAllWindows()
    else:
        img = cv2.imread(src)
        if img is None:
            print(f"[ERROR] No se pudo abrir: {src}")
        else:
            dets = predict_ensemble(img)
            out_img = draw_overlay(img, dets)
            print(f"Detecciones: {len(dets)}")
            for d in dets:
                print(f"  {d['class_name']} — {d['confidence']:.1%} @ {d['bbox']}")
            cv2.imshow("Resultado", out_img)
            cv2.waitKey(0)
            cv2.destroyAllWindows()
