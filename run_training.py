"""
run_training.py
Orquesta el entrenamiento de los 3 modelos YOLOv8 de forma secuencial
y al finalizar cada uno copia el best.pt a models/ y evalua en test set.

Uso: python run_training.py
     python run_training.py --skip-nano   (si nano ya esta entrenado)
     python run_training.py --only medium (solo entrena medium)
"""

import argparse
import shutil
import subprocess
import sys
import time
from pathlib import Path

import yaml

# ── Configuracion ─────────────────────────────────────────────────────────────
DATA_YAML = "fabric-defects-split/data.yaml"

MODELS_CFG = [
    {
        "name":       "nano",
        "base":       "yolov8n.pt",
        "run_name":   "nano",
        "dest":       "models/yolov8n_aitex/best.pt",
        "train_path": "runs/detect/nano/weights/best.pt",
        "batch":      8,
        "epochs":     50,   # nano ya entrenado con 50 — no re-entrenar si existe
    },
    {
        "name":       "small",
        "base":       "yolov8s.pt",
        "run_name":   "small",
        "dest":       "models/yolov8s_aitex/best.pt",
        "train_path": "runs/detect/small/weights/best.pt",
        "batch":      8,
        "epochs":     75,   # mas epochs para mejor convergencia
    },
    {
        "name":       "medium",
        "base":       "yolov8m.pt",
        "run_name":   "medium",
        "dest":       "models/yolov8m_aitex/best.pt",
        "train_path": "runs/detect/medium/weights/best.pt",
        "batch":      4,
        "epochs":     75,
    },
]

YOLO = str(Path("venv/Scripts/yolo"))
# ─────────────────────────────────────────────────────────────────────────────


def log(msg: str) -> None:
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def run_cmd(cmd: list[str], desc: str) -> bool:
    log(f"Iniciando: {desc}")
    log(f"Comando: {' '.join(cmd)}")
    t0 = time.time()
    result = subprocess.run(cmd, capture_output=False)
    elapsed = (time.time() - t0) / 60
    if result.returncode != 0:
        log(f"[ERROR] {desc} fallo (codigo {result.returncode}) — {elapsed:.1f} min")
        return False
    log(f"[OK] {desc} completado en {elapsed:.1f} min")
    return True


def copy_best(src: str, dst: str, model_name: str) -> bool:
    src_path = Path(src)
    dst_path = Path(dst)
    if not src_path.exists():
        log(f"[ERROR] best.pt no encontrado en {src}")
        return False
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src_path, dst_path)
    size_mb = dst_path.stat().st_size / 1024 / 1024
    log(f"[OK] {model_name} best.pt copiado a {dst} ({size_mb:.1f} MB)")
    return True


def validate_model(model_path: str, model_name: str) -> None:
    log(f"Evaluando {model_name} en test set...")
    cmd = [
        YOLO, "val",
        f"model={model_path}",
        f"data={DATA_YAML}",
        "split=test",
        "imgsz=640",
        "device=0",
        f"name=val_{model_name}",
        "exist_ok=True",
    ]
    run_cmd(cmd, f"val {model_name}")


def train_model(cfg: dict) -> bool:
    cmd = [
        YOLO, "train",
        f"model={cfg['base']}",
        f"data={DATA_YAML}",
        f"epochs={cfg['epochs']}",
        "imgsz=640",
        f"batch={cfg['batch']}",
        "device=0",
        "patience=20",
        f"name={cfg['run_name']}",
        "workers=0",
        "exist_ok=True",
        # Augmentacion extra para mejor rendimiento en camara real
        "hsv_v=0.5",         # variacion de brillo (iluminacion variable en camara)
        "degrees=10.0",      # rotacion leve (angulo de camara)
        "perspective=0.001", # perspectiva (camara no siempre perpendicular)
        "flipud=0.3",        # volteo vertical
        "fliplr=0.5",        # volteo horizontal
    ]
    ok = run_cmd(cmd, f"train {cfg['name']} ({cfg['epochs']} epochs, batch={cfg['batch']})")
    if not ok:
        return False

    if not copy_best(cfg["train_path"], cfg["dest"], cfg["name"]):
        return False

    validate_model(cfg["dest"], cfg["name"])
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-nano", action="store_true",
                        help="Omite nano (ya entrenado)")
    parser.add_argument("--only", choices=["nano", "small", "medium"],
                        help="Entrena solo este modelo")
    args = parser.parse_args()

    models_to_run = MODELS_CFG.copy()

    if args.only:
        models_to_run = [c for c in models_to_run if c["name"] == args.only]
    elif args.skip_nano:
        # Nano ya corrio manualmente — solo copiar si existe
        nano_cfg = models_to_run[0]
        nano_src = Path(nano_cfg["train_path"])
        if nano_src.exists():
            copy_best(nano_cfg["train_path"], nano_cfg["dest"], "nano")
            validate_model(nano_cfg["dest"], "nano")
        else:
            log("[WARN] --skip-nano pero best.pt de nano no encontrado")
        models_to_run = models_to_run[1:]  # small + medium

    log("=" * 60)
    log("  Entrenamiento secuencial: Inspector AR de Tela")
    log(f"  Modelos a entrenar: {[c['name'] for c in models_to_run]}")
    log("=" * 60)

    results = {}
    for cfg in models_to_run:
        # Si ya existe el best.pt final, saltar
        if Path(cfg["dest"]).exists() and cfg["name"] != args.only:
            size = Path(cfg["dest"]).stat().st_size / 1024 / 1024
            log(f"[SKIP] {cfg['name']}: ya existe models/ ({size:.1f} MB) — omitiendo")
            results[cfg["name"]] = True
            continue
        results[cfg["name"]] = train_model(cfg)

    log("=" * 60)
    log("  RESUMEN FINAL")
    log("=" * 60)
    for name, ok in results.items():
        status = "[OK]" if ok else "[ERROR]"
        print(f"  {status} {name}")

    if all(results.values()):
        log("Todos los modelos listos. Ejecuta: python verify_models.py")
    else:
        log("[WARN] Algunos modelos fallaron. Revisa los logs arriba.")


if __name__ == "__main__":
    main()
