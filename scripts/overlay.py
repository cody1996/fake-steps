#!/usr/bin/env python3
"""生成红/青叠加图：红色是参考图的墨迹，青色是渲染图的墨迹，重合处接近黑色。

用来定位几个像素的偏移（哪条边偏了、偏多少）。

用法:
    python scripts/overlay.py history
    python scripts/overlay.py today

输出: .dev/shots/overlay-<name>.png
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
REF_DIR = ROOT / "ref"
SHOT_DIR = ROOT / ".dev" / "shots"


def main() -> None:
    name = sys.argv[1] if len(sys.argv) > 1 else "history"
    ref_path = REF_DIR / f"{name}.jpg"
    our_path = SHOT_DIR / f"{name}.png"
    if not ref_path.exists():
        raise SystemExit(f"缺少参考图: {ref_path}")
    if not our_path.exists():
        raise SystemExit(f"缺少渲染图: {our_path}")

    ref = Image.open(ref_path).convert("L").resize((1179, 2560))
    our = Image.open(our_path).convert("L").resize((1179, 2560))
    r = 255 - np.asarray(ref).astype(np.int16)
    o = 255 - np.asarray(our).astype(np.int16)

    out = np.zeros((2560, 1179, 3), dtype=np.uint8)
    out[:, :, 0] = np.clip(255 - o * 0.85, 0, 255)
    out[:, :, 1] = np.clip(255 - r * 0.85, 0, 255)
    out[:, :, 2] = np.clip(255 - r * 0.85, 0, 255)

    target = SHOT_DIR / f"overlay-{name}.png"
    Image.fromarray(out).save(target)
    print(target)


if __name__ == "__main__":
    main()
