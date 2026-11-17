#!/usr/bin/env python3
"""把 HarmonyOS Sans SC 裁剪成只包含页面实际用到的字符，减小体积。

依赖: pip install fonttools

用法:
    python scripts/subset_font.py /path/to/HarmonyOS_Sans_SC

目录下应包含 HarmonyOS_Sans_SC_Regular.ttf / _Medium.ttf / _Bold.ttf 三个文件，
输出到 src/assets/fonts/HarmonyOS-SC-{Regular,Medium,Bold}-subset.ttf。
"""

import sys
from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT_DIR = SRC / "assets" / "fonts"
WEIGHTS = [("Regular", 400), ("Medium", 500), ("Bold", 700)]

# 模板里出现的固定字符 + 常用符号，配合扫描源码补全
BASE_CHARS = set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz")
BASE_CHARS |= set(" .,:;%+-/*()[]<>↑↓←→·、。，：；？！“”‘’…—~$¥")
BASE_CHARS |= set("年月日周一二三四五六七八九十点分秒步公里千卡厘米小时钟今日昨天本周")


def collect_chars() -> str:
    chars = set(BASE_CHARS)
    for path in SRC.rglob("*"):
        if path.suffix not in {".vue", ".ts", ".css"}:
            continue
        for ch in path.read_text(encoding="utf-8"):
            code = ord(ch)
            if code > 0x2E00 or 0x3000 <= code <= 0x303F or 0xFF00 <= code <= 0xFFEF:
                chars.add(ch)
    return "".join(sorted(chars))


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    font_dir = Path(sys.argv[1]).expanduser().resolve()
    if not font_dir.is_dir():
        raise SystemExit(f"目录不存在: {font_dir}")

    text = collect_chars()
    print(f"字符数: {len(text)}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for weight, _ in WEIGHTS:
        src = font_dir / f"HarmonyOS_Sans_SC_{weight}.ttf"
        if not src.exists():
            raise SystemExit(f"缺少字体文件: {src}")
        out = OUT_DIR / f"HarmonyOS-SC-{weight}-subset.ttf"
        subset.main(
            [
                str(src),
                f"--output-file={out}",
                f"--text={text}",
                "--layout-features=*",
                "--drop-tables+=DSIG",
                "--no-hinting",
            ]
        )
        print(f"{weight}: {src.stat().st_size / 1024 / 1024:.1f} MB -> {out.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
