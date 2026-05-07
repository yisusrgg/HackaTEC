"""
verify_models.py
Verifica que los 3 modelos best.pt existen y funcionan correctamente.
Ejecutar antes del hackathon: python verify_models.py
"""

import sys
import numpy as np
from pathlib import Path

MODELS = {
    "nano":   "models/yolov8n_aitex/best.pt",
    "small":  "models/yolov8s_aitex/best.pt",
    "medium": "models/yolov8m_aitex/best.pt",
}

EXPECTED_CLASSES = 20

def check_model(name: str, path: str) -> bool:
    p = Path(path)
    if not p.exists():
        print(f"  [ERROR] {name}: no encontrado en {path}")
        return False

    size_mb = p.stat().st_size / 1024 / 1024
    if size_mb < 1:
        print(f"  [ERROR] {name}: archivo demasiado pequeño ({size_mb:.1f} MB) — posiblemente corrupto")
        return False

    try:
        from ultralytics import YOLO
        model = YOLO(str(p))

        # Inferencia de prueba con imagen negra 640x640
        dummy = np.zeros((640, 640, 3), dtype=np.uint8)
        results = model(dummy, verbose=False)

        nc = model.model.nc if hasattr(model.model, 'nc') else len(model.names)
        if nc != EXPECTED_CLASSES:
            print(f"  [WARN] {name}: {nc} clases (esperado {EXPECTED_CLASSES})")

        print(f"  [OK] {name}: {size_mb:.1f} MB | {nc} clases | inferencia OK")
        return True

    except Exception as e:
        print(f"  [ERROR] {name}: fallo al cargar — {e}")
        return False


def main():
    print("=" * 55)
    print("  Verificacion de modelos — Inspector AR de Tela")
    print("=" * 55)

    results = {}
    for name, path in MODELS.items():
        results[name] = check_model(name, path)

    ok = sum(results.values())
    total = len(results)

    print("-" * 55)
    if ok == total:
        print(f"[OK] {ok}/{total} modelos listos para el hackathon")
        print("")
        print("  Uso rapido:")
        print("    from predict_ensemble import load_models, predict_ensemble, draw_overlay")
        print("    load_models()")
        print("    detections = predict_ensemble(frame)")
        print("    frame_out  = draw_overlay(frame, detections)")
    elif ok > 0:
        print(f"[WARN] {ok}/{total} modelos disponibles — ensemble parcial activo")
        missing = [n for n, v in results.items() if not v]
        print(f"  Faltantes: {', '.join(missing)}")
        print("  El ensemble funcionara con los modelos disponibles.")
    else:
        print("[ERROR] Ningun modelo encontrado.")
        print("  Ejecuta el entrenamiento primero:")
        print("    python run_training.py")
        sys.exit(1)

    print("=" * 55)


if __name__ == "__main__":
    main()
