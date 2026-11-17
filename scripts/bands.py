#!/usr/bin/env python3
"""逐行对比「参考图」和「渲染图」的文字位置，打印每行文字的 y/x 区间。

用于快速看某个文字块整体偏了多少像素。

用法:
    python scripts/bands.py history
    python scripts/bands.py today
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
REF_DIR = ROOT / "ref"
SHOT_DIR = ROOT / ".dev" / "shots"


def lines(img: Image.Image, thr: int = 140, min_px: int = 40, gap: int = 10):
    a = np.asarray(img.convert("L")).astype(np.int16)
    dark = a < thr
    rows = dark.sum(axis=1)
    ys = np.where(rows > 2)[0]
    if len(ys) == 0:
        return []

    bands = []
    start = prev = ys[0]
    for y in ys[1:]:
        if y - prev <= gap:
            prev = y
            continue
        bands.append((start, prev))
        start = prev = y
    bands.append((start, prev))

    out = []
    for y0, y1 in bands:
        band = dark[y0 : y1 + 1]
        xs = np.where(band.sum(axis=0) > 0)[0]
        if len(xs) == 0 or band.sum() < min_px:
            continue
        out.append((int(y0), int(y1), int(xs.min()), int(xs.max())))
    return out


def main() -> None:
    name = sys.argv[1] if len(sys.argv) > 1 else "history"
    ref_path = REF_DIR / f"{name}.jpg"
    our_path = SHOT_DIR / f"{name}.png"
    if not ref_path.exists():
        raise SystemExit(f"缺少参考图: {ref_path}")
    if not our_path.exists():
        raise SystemExit(f"缺少渲染图: {our_path}")

    ref = lines(Image.open(ref_path))
    our = lines(Image.open(our_path))
    print(f"=== {name}: ref({len(ref)}) vs render({len(our)}) ===")
    for i in range(max(len(ref), len(our))):
        left = f"ref y{ref[i][0]:>4}-{ref[i][1]:<4} x{ref[i][2]:>4}-{ref[i][3]:<4}" if i < len(ref) else ""
        right = f"our y{our[i][0]:>4}-{our[i][1]:<4} x{our[i][2]:>4}-{our[i][3]:<4}" if i < len(our) else ""
        print(f"  {left:<34} | {right}")


if __name__ == "__main__":
    main()
