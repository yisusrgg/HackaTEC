"""
Redistribuye el dataset de Fabric Defects de 92/8/0 -> 75/15/10
Entrada:  "Fabric Defects.v4i.yolov8/"  (train + valid originales)
Salida:   "fabric-defects-split/"        (train / valid / test nuevos)
Uso:      python split_dataset.py
"""

import os
import shutil
import random
import yaml
from pathlib import Path
from collections import Counter

# -- Configuracion ------------------------------------------------------------
SEED = 42
TRAIN_RATIO = 0.75
VALID_RATIO = 0.15
TEST_RATIO  = 0.10

SRC_DIR = Path("Fabric Defects.v4i.yolov8")
OUT_DIR = Path("fabric-defects-split")

SPLITS = ["train", "valid", "test"]
# -----------------------------------------------------------------------------


def collect_samples(src: Path) -> list:
    """Devuelve lista de (imagen, etiqueta) de todos los splits existentes."""
    samples = []
    for split in ["train", "valid", "test"]:
        img_dir = src / split / "images"
        lbl_dir = src / split / "labels"
        if not img_dir.exists():
            continue
        for img_path in sorted(img_dir.glob("*.jpg")):
            lbl_path = lbl_dir / img_path.with_suffix(".txt").name
            if lbl_path.exists():
                samples.append((img_path, lbl_path))
            else:
                samples.append((img_path, None))
    return samples


def create_dirs(out: Path) -> None:
    for split in SPLITS:
        (out / split / "images").mkdir(parents=True, exist_ok=True)
        (out / split / "labels").mkdir(parents=True, exist_ok=True)


def distribute(samples: list, ratios: tuple) -> tuple:
    n = len(samples)
    n_train = int(n * ratios[0])
    n_valid = int(n * ratios[1])
    return (
        samples[:n_train],
        samples[n_train : n_train + n_valid],
        samples[n_train + n_valid :],
    )


def copy_split(pairs: list, out: Path, split_name: str) -> int:
    img_out = out / split_name / "images"
    lbl_out = out / split_name / "labels"
    for img_src, lbl_src in pairs:
        shutil.copy2(img_src, img_out / img_src.name)
        if lbl_src and lbl_src.exists():
            shutil.copy2(lbl_src, lbl_out / lbl_src.name)
        else:
            (lbl_out / img_src.with_suffix(".txt").name).touch()
    return len(pairs)


def write_yaml(src_yaml: Path, out: Path) -> None:
    with open(src_yaml, encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    cfg["path"]  = str(out.resolve())
    cfg["train"] = "train/images"
    cfg["val"]   = "valid/images"
    cfg["test"]  = "test/images"

    out_yaml = out / "data.yaml"
    with open(out_yaml, "w", encoding="utf-8") as f:
        yaml.dump(cfg, f, allow_unicode=True, default_flow_style=False, sort_keys=False)

    print(f"\n[OK] data.yaml escrito en: {out_yaml}")
    print(f"   path  -> {cfg['path']}")
    print(f"   nc    -> {cfg['nc']}")
    print(f"   names -> {cfg['names']}")


def count_classes(pairs: list) -> Counter:
    c: Counter = Counter()
    for _, lbl in pairs:
        if lbl and lbl.exists():
            for line in lbl.read_text(encoding="utf-8").splitlines():
                if line.strip():
                    c[int(line.split()[0])] += 1
    return c


# -- Main ---------------------------------------------------------------------
def main() -> None:
    if not SRC_DIR.exists():
        print(f"[ERROR] No se encontro: {SRC_DIR}")
        print("   Asegurate de ejecutar este script desde la raiz del proyecto.")
        raise SystemExit(1)

    print("[...] Recopilando muestras...")
    samples = collect_samples(SRC_DIR)
    print(f"   Total encontrado: {len(samples)} pares imagen/etiqueta")

    random.seed(SEED)
    random.shuffle(samples)

    train_s, valid_s, test_s = distribute(samples, (TRAIN_RATIO, VALID_RATIO, TEST_RATIO))

    print(f"\n[INFO] Distribucion nueva (SEED={SEED}):")
    print(f"   train : {len(train_s):>5}  ({len(train_s)/len(samples)*100:.1f}%)")
    print(f"   valid : {len(valid_s):>5}  ({len(valid_s)/len(samples)*100:.1f}%)")
    print(f"   test  : {len(test_s):>5}  ({len(test_s)/len(samples)*100:.1f}%)")
    print(f"   TOTAL : {len(samples):>5}")

    if OUT_DIR.exists():
        print(f"\n[WARN] '{OUT_DIR}' ya existe -- eliminando para regenerar limpio...")
        shutil.rmtree(OUT_DIR)

    create_dirs(OUT_DIR)

    print("\n[...] Copiando archivos...")
    copy_split(train_s, OUT_DIR, "train")
    print("   train  OK")
    copy_split(valid_s, OUT_DIR, "valid")
    print("   valid  OK")
    copy_split(test_s,  OUT_DIR, "test")
    print("   test   OK")

    src_yaml = SRC_DIR / "data.yaml"
    write_yaml(src_yaml, OUT_DIR)

    # -- Verificacion final ---------------------------------------------------
    print("\n[CHECK] Verificacion:")
    total_copied = 0
    for split_name, pairs in [("train", train_s), ("valid", valid_s), ("test", test_s)]:
        imgs = list((OUT_DIR / split_name / "images").glob("*.jpg"))
        lbls = list((OUT_DIR / split_name / "labels").glob("*.txt"))
        status = "[OK]" if len(imgs) == len(pairs) else "[ERROR]"
        print(f"   {status} {split_name}: {len(imgs)} imagenes, {len(lbls)} etiquetas")
        total_copied += len(imgs)

    if total_copied == len(samples):
        print(f"\n[OK] Split completado sin perdidas: {total_copied}/{len(samples)} imagenes")
    else:
        print(f"\n[ERROR] {total_copied} copiadas vs {len(samples)} originales")

    print("\n[INFO] Clases en test set:")
    test_classes = count_classes(test_s)
    if test_classes:
        for cls_id, count in sorted(test_classes.items()):
            print(f"   clase {cls_id:>2}: {count:>4} instancias")
    else:
        print("   (sin anotaciones -- solo imagenes background)")

    print("\n[LISTO] Proximo paso:")
    print("   venv\\Scripts\\yolo train model=yolov8n.pt "
          "data=fabric-defects-split/data.yaml "
          "epochs=50 imgsz=640 batch=16 device=cpu patience=20")


if __name__ == "__main__":
    main()
