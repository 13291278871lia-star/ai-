#!/usr/bin/env python3.11
"""Dump every placeholder in a .pptx template, page by page.

    python3.11 scripts/inspect_template.py [模版.pptx]

Use this when the template changes: compare the output with
references/template-map.md and update deck_builder.py. PowerPoint renames
shapes every time a slide is edited, so the dump indexes placeholders by
position (left/top in cm), not by shape name.
"""

from __future__ import annotations

import sys
from pathlib import Path

from pptx import Presentation
from pptx.util import Emu

HERE = Path(__file__).resolve().parent
DEFAULT = HERE.parents[3] / "assets" / "ppt-reference" / "gf-template.pptx"


def cm(value):
    return round(Emu(value).cm, 2) if value is not None else None


def main() -> int:
    path = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else DEFAULT
    if not path.is_file():
        sys.exit(f"找不到模版：{path}")
    prs = Presentation(str(path))
    for i, slide in enumerate(prs.slides, start=1):
        print(f"\n=== 第 {i} 页 ===")
        for sh in slide.shapes:
            pos = f"({cm(sh.left)}, {cm(sh.top)})"
            if getattr(sh, "has_table", False):
                rows = []
                for r in sh.table.rows:
                    rows.append(" | ".join(c.text.strip() for c in r.cells))
                print(f"  表格 {pos}  {sh.shape_type}  「{sh.name}」")
                for r in rows:
                    print(f"      {r}")
                continue
            if not getattr(sh, "has_text_frame", False):
                continue
            text = " ".join(sh.text_frame.text.split())
            if not text:
                print(f"  [空框] {pos}  「{sh.name}」")
                continue
            print(f"  文字 {pos}  「{sh.name}」  {text}")
    print(f"\n共 {len(prs.slides._sldIdLst)} 页")
    return 0


if __name__ == "__main__":
    sys.exit(main())
