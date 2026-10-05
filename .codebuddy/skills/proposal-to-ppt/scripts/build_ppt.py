#!/usr/bin/env python3.11
"""计划书 → 概览 PPT（按 GF 模版填充）。

    python3.11 scripts/build_ppt.py <计划书.pdf> [-o 输出.pptx] [优惠参数…]

一条命令做完：解析计划书 → 13 项校验 → 填充模版 → 写出 .pptx。
有 FAIL 时默认拒绝出稿（--force 可强出），避免把对不上账的数字发给客户。

优惠参数（回赠%、礼券、预缴利率）**从来不在计划书里**，必须手工给；
不给就保留模版的 XX / XXX 占位符，等同事补。绝不填 0。
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SKILL_DIR = HERE.parent


def find_root() -> Path:
    """Locate the workbench root that owns proposal_parse.py / deck_builder.py."""
    candidates = []
    env = os.environ.get("AI_WORKBENCH_ROOT")
    if env:
        candidates.append(Path(env))
    candidates += [
        Path.cwd(),
        SKILL_DIR.parents[2],             # <root>/.codebuddy/skills/<skill>/scripts
        *Path.cwd().parents,
        Path("/workspace/repo"),
    ]
    seen = []
    for c in candidates:
        c = c.expanduser().resolve()
        if c in seen:
            continue
        seen.append(c)
        if (c / "proposal_parse.py").is_file() and (c / "deck_builder.py").is_file():
            return c
    sys.exit("找不到工作台根目录（proposal_parse.py / deck_builder.py）。"
             "请设置 AI_WORKBENCH_ROOT 或在工作台目录下运行。")


ROOT = find_root()
sys.path.insert(0, str(ROOT))

import deck_builder  # noqa: E402
import irr_model  # noqa: E402
import proposal_parse  # noqa: E402

DEFAULT_TEMPLATE = ROOT / "assets" / "ppt-reference" / "gf-template.pptx"


def parse_coupons(text: str):
    """'2×1250,6×63' -> [{'count':2,'value':1250}, {'count':6,'value':63}]"""
    out = []
    for part in re.split(r"[,，;]", text or ""):
        part = part.strip()
        if not part:
            continue
        m = re.match(r"^(\d+)\s*[×xX*]\s*([\d,]+(?:\.\d+)?)$", part)
        if not m:
            sys.exit(f"礼券格式看不懂：{part!r}。应写成 2×1250,6×63（份数×面额）")
        out.append({"count": int(m.group(1)), "value": float(m.group(2).replace(",", ""))})
    return out


def promo_overrides(args) -> dict:
    """Only promote the keys the user actually supplied — an absent key means
    the template keeps its own placeholder, which is the honest answer."""
    promo = {}
    if args.rebate is not None:
        promo["rebatePct"] = args.rebate
    if args.rebate_deadline:
        promo["rebateDeadline"] = args.rebate_deadline
    if args.coupons:
        promo["coupons"] = parse_coupons(args.coupons)
    if args.prepay1 is not None:
        promo["prepay1Rate"] = args.prepay1
    if args.prepay4 is not None:
        promo["prepay4Rate"] = args.prepay4
    if args.promo_start:
        promo["promoStart"] = args.promo_start
    if args.promo_end:
        promo["promoEnd"] = args.promo_end

    overrides = {"promo": promo}
    if args.show_years:
        overrides["showYears"] = [int(y) for y in re.split(r"[,，\s]+", args.show_years) if y]
    for key, value in (("insuredTitle", args.insured_title),
                       ("target", args.target),
                       ("advantage", args.advantage)):
        if value:
            overrides[key] = value
    if args.include_levy:
        overrides["includeLevy"] = True
    return overrides


def resolve_pdf(text: str) -> Path:
    p = Path(text).expanduser()
    if p.is_file():
        return p
    for base in (Path("/root/uploads"), Path.cwd()):
        cand = base / text
        if cand.is_file():
            return cand
    sys.exit(f"找不到计划书：{text}")


def main() -> int:
    ap = argparse.ArgumentParser(
        description="把 AIA 计划书填进 GF 概览模版，产出 7 页可编辑 PPT")
    ap.add_argument("pdf", help="计划书 PDF 路径")
    ap.add_argument("-o", "--out", help="输出 .pptx 路径（默认 <计划书名>_概览.pptx）")
    ap.add_argument("--template", default=str(DEFAULT_TEMPLATE), help="模版 .pptx")
    ap.add_argument("--rebate", type=float, help="首年保费回赠 %%（例 26）")
    ap.add_argument("--rebate-deadline", help="回赠截止日（例 2026年10月11日）")
    ap.add_argument("--coupons", help="礼券，例：2×1250,6×63")
    ap.add_argument("--prepay1", type=float, help="预缴1年保证优惠年利率 %%（例 4.3）")
    ap.add_argument("--prepay4", type=float, help="预缴4年保证优惠年利率 %%（例 3.8）")
    ap.add_argument("--promo-start")
    ap.add_argument("--promo-end")
    ap.add_argument("--show-years", help="概览页要展示的年度，默认 20,30,40,50")
    ap.add_argument("--insured-title", help="受保人称呼，例：VIP 女士")
    ap.add_argument("--target")
    ap.add_argument("--advantage")
    ap.add_argument("--include-levy", action="store_true", help="IRR 计入保费征费（默认不计）")
    ap.add_argument("--fields", action="store_true", help="只打印解析结果，不生成 PPT")
    ap.add_argument("--verify-only", action="store_true", help="只跑校验，不生成 PPT")
    ap.add_argument("--json", action="store_true", help="机器可读输出")
    ap.add_argument("--force", action="store_true", help="校验有 FAIL 也照样出稿")
    args = ap.parse_args()

    pdf = resolve_pdf(args.pdf)
    parsed = proposal_parse.parse_proposal(pdf.read_bytes())

    if not parsed.get("known"):
        print("⚠️  计划书结构未识别，需要人工映射：", file=sys.stderr)
        for w in parsed.get("warnings") or []:
            print("   -", w, file=sys.stderr)
        if not args.force:
            print("\n改用工作台页面的「手工映射」上传，或先修 proposal_parse.py 的解析规则。",
                  file=sys.stderr)
            return 2

    try:
        import serve
        cfg = serve.default_cfg(parsed, promo_overrides(args))
    except Exception:  # noqa: BLE001 - 服务端模块不可用时退回本地同构配置
        cfg = {
            "product": parsed["profile"].get("product"),
            "insured": parsed["profile"].get("insured"),
            "gender": parsed["profile"].get("gender"),
            "age": parsed["profile"].get("age"),
            "years": parsed["profile"].get("years"),
            "premium": parsed["profile"].get("premium"),
            "levy": parsed["profile"].get("levy") or 0.0,
            "fx": parsed["profile"].get("fx") or 6.8,
            "endAge": 100,
            "detail": parsed.get("detail") or {},
            "withdrawal": parsed.get("withdrawalPlan"),
            "promo": {},
        }
        cfg.update(promo_overrides(args))

    plan = irr_model.build_plan(cfg)
    checks = irr_model.verify(cfg, parsed, plan)

    if args.fields:
        payload = {
            "profile": parsed["profile"],
            "rowCount": parsed.get("rowCount"),
            "sourcePages": parsed.get("sourcePages"),
            "withdrawalPlan": parsed.get("withdrawalPlan"),
            "stated": parsed.get("stated"),
            "table": plan.get("table"),
            "checks": checks,
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0

    failed = [c for c in checks if c["status"] == "fail"]
    warned = [c for c in checks if c["status"] == "warn"]

    if not args.json:
        prof = parsed["profile"]
        print(f"计划书：{pdf.name}")
        print(f"  {prof.get('product')}｜{prof.get('insured')}（{prof.get('age')}岁）"
              f"｜{prof.get('years')}年缴费｜年缴 {prof.get('premium'):,.0f} {prof.get('currency')}")
        w = parsed.get("withdrawalPlan")
        if w:
            print(f"  提取方案：{w['startAge']}–{w['endAge']}岁，每年 {w['annual']:,.0f}，共 {w['count']} 年")
        print(f"  解析年度：{parsed.get('rowCount')} 个｜来源页 {parsed.get('sourcePages')}")
        print()
        for c in checks:
            print(f"  [{'✅' if c['status'] == 'pass' else '⚠️' if c['status'] == 'warn' else '❌'}]"
                  f" {c['name']} — {c.get('detail','')}")
        print(f"\n校验：PASS {len(checks) - len(failed) - len(warned)} / "
              f"WARN {len(warned)} / FAIL {len(failed)}")

    if failed and not args.force:
        print("\n拒绝出稿：有 FAIL。确认数字无误后加 --force 才会生成。", file=sys.stderr)
        return 1

    if args.verify_only or args.fields:
        return 0

    template = Path(args.template).expanduser()
    if not template.is_file():
        sys.exit(f"找不到模版：{template}")

    out = Path(args.out).expanduser() if args.out else pdf.with_name(f"{pdf.stem}_概览.pptx")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(deck_builder.build_overview_deck(cfg, plan, template))

    if not args.json:
        from pptx import Presentation
        pages = len(Presentation(str(out)).slides._sldIdLst)
        print(f"\n已生成：{out}（{pages} 页，{out.stat().st_size:,} 字节）")
        if not (cfg.get("promo") or {}):
            print("注意：未提供优惠参数，第 3–6 页保留 XX / XXX 占位符，需手工补。")
    else:
        print(json.dumps({"out": str(out), "checks": checks}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
