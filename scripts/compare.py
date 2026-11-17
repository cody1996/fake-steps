#!/usr/bin/env python3
"""把「参考图」和「本地渲染图」并排成一张对比图。

用法:
    python scripts/compare.py history          # 对比 ref/history.jpg 与 .dev/shots/history.png
    python scripts/compare.py today

输出: .dev/shots/compare-<name>.png
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
REF_DIR = ROOT / "ref"
SHOT_DIR = ROOT / ".dev" / "shots"

W, H = 560, 1216


def main() -> None:
    name = sys.argv[1] if len(sys.argv) > 1 else "history"
    ref_path = REF_DIR / f"{name}.jpg"
    our_path = SHOT_DIR / f"{name}.png"
    if not ref_path.exists():
        raise SystemExit(f"缺少参考图: {ref_path}")
    if not our_path.exists():
        raise SystemExit(f"缺少渲染图: {our_path}（先用 scripts/shot-daemon.mjs 截图）")

    ref = Image.open(ref_path).convert("RGB").resize((W, H), Image.LANCZOS)
    our = Image.open(our_path).convert("RGB").resize((W, H), Image.LANCZOS)

    pad, top = 24, 44
    canvas = Image.new("RGB", (pad * 3 + W * 2, H + top + pad), "#eef0f3")
    canvas.paste(ref, (pad, top))
    canvas.paste(our, (pad * 2 + W, top))

    draw = ImageDraw.Draw(canvas)
    draw.text((pad, 14), "REFERENCE", fill="#6b7280")
    draw.text((pad * 2 + W, 14), "RENDER", fill="#6b7280")

    out = SHOT_DIR / f"compare-{name}.png"
    canvas.save(out)
    print(out)


if __name__ == "__main__":
    main()
