"""Unit + integration tests for the proposal -> deck pipeline.

    python3.11 tests/test_pipeline.py

The proposal fixture is optional: when the real PDF is not present (it is a
client document and must stay out of the repo) the parser tests are skipped and
only the arithmetic / deck-structure tests run.
"""

from __future__ import annotations

import io
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import deck_builder  # noqa: E402
import irr_model  # noqa: E402

TEMPLATE = ROOT / "assets" / "ppt-reference" / "gf-template.pptx"
PROPOSAL = Path("/root/uploads/work/proposal.pdf")

PASS, FAIL = [], []


def check(name, fn):
    try:
        fn()
        PASS.append(name)
    except AssertionError as exc:
        FAIL.append(f"{name}: {exc}")
    except Exception as exc:  # noqa: BLE001
        FAIL.append(f"{name}: {type(exc).__name__}: {exc}")


def eq(a, b, msg=""):
    assert a == b, f"{msg} 期望 {b!r}，實得 {a!r}"


def close(a, b, tol=1e-9, msg=""):
    assert abs(a - b) <= tol, f"{msg} 期望 {b!r}±{tol}，實得 {a!r}"


# ------------------------------------------------------------------ IRR model

def t_irr_basics():
    close(irr_model.irr_bisect([-100, 0, 121]), 0.1, 1e-10, "兩期 IRR")
    close(irr_model.irr_bisect([-100, 0, 81]), -0.1, 1e-10, "負 IRR")
    # No income at all -> refuse rather than invent a number.
    try:
        irr_model.irr_bisect([-100, 0])
        raise AssertionError("沒有收入時應拒絕計算")
    except ValueError:
        pass
    # Multiple sign changes -> refuse rather than pick one of several roots.
    try:
        irr_model.irr_bisect([-100, 230, -132])
        raise AssertionError("正負號多次轉換時應拒絕計算")
    except ValueError:
        pass


def t_irr_cross_check():
    flows = [-120000.0] * 5 + [0.0] * 25 + [3512864.0]
    a = irr_model.irr_bisect(flows)
    b = irr_model.irr_newton(flows)
    close(a, b, 1e-9, "二分法 vs 牛頓法")
    scale = max(abs(v) for v in flows)
    assert abs(irr_model.npv(flows, a)) / scale < 1e-12, "NPV(r) 應為 0"


def t_prepaid_matches_excel():
    """複本 irr sample.xlsx C71:E75: balance_n = n*premium + interest so far."""
    rows = irr_model.prepaid_interest(120000, 0.038, 4)
    eq([round(r["balance"]) for r in rows], [480000, 378240, 272613, 162972], "本金餘額")
    eq([round(r["earned"]) for r in rows], [18240, 14373, 10359, 6193], "每年利息")
    close(rows[-1]["total"], 49165.37, 0.01, "四年總利息")


def t_promo_figures():
    promo = irr_model.promo_figures(120000, {
        "rebatePct": 26,
        "coupons": [{"count": 2, "value": 1250}, {"count": 6, "value": 63}],
        "prepay1Rate": 4.3,
        "prepay4Rate": 3.8,
    })
    eq(promo["rebate"], 31200.0, "保費回贈")
    eq(promo["couponTotal"], 2878.0, "現金券")
    eq(promo["totalSaving"], 34078.0, "不預繳合共")
    eq(promo["prepay1Interest"], 5160.0, "預繳1年利息")
    eq(promo["prepay4Interest"], 49165.37, "預繳4年利息")
    eq(promo["withPrepay1"], 39238.0, "預繳1年合共")
    eq(promo["withPrepay4"], 83243.37, "預繳4年合共")


def t_payment_schedule():
    promo = irr_model.promo_figures(120000, {"rebatePct": 26, "coupons": [{"count": 2, "value": 1250}],
                                              "prepay1Rate": 4.3, "prepay4Rate": 3.8})
    pays = irr_model.payment_schedule(120000, 5, promo)
    eq([p["amount"] for p in pays], [117500.0, 88800.0, 120000.0, 120000.0, 120000.0], "逐年實繳")


def t_wan_formatting():
    eq(deck_builder.wan(5322542), "532")
    eq(deck_builder.wan(36193285.6), "3,619")
    eq(deck_builder.wan(120000), "12")
    eq(deck_builder.wan(816000), "81.6")
    eq(deck_builder.wan(65000), "6.5")
    eq(deck_builder.wan(4225000), "422.5")


def t_build_plan_keeps_only_parsed_years():
    """Never show a policy year the proposal does not actually contain."""
    detail = {str(y): {"year": y, "age": 15 + y, "guaranteed": y * 1000, "reversionary": 0.0,
                       "terminal": 0.0, "total": y * 1000, "page": 12} for y in range(1, 21)}
    plan = irr_model.build_plan({
        "product": "X", "premium": 100000, "years": 5, "age": 15, "fx": 6.8,
        "detail": detail, "showYears": [20, 30, 40, 50], "promo": {},
    })
    eq([r["year"] for r in plan["table"]], [20], "只顯示計劃書有的年度")


# ------------------------------------------------------------- deck structure

def _pages(data):
    from pptx import Presentation
    return list(Presentation(io.BytesIO(data)).slides)


def _cfg(**over):
    detail = {str(y): {"year": y, "age": 15 + y, "guaranteed": 100000.0, "reversionary": y * 3000.0,
                       "terminal": y * 4000.0, "total": 100000.0 + y * 7000.0, "page": 12}
              for y in (20, 30, 40, 50)}
    cfg = {"product": "測試計劃", "age": 15, "years": 5, "premium": 120000, "fx": 6.8,
           "levy": 12.76, "endAge": 100, "detail": detail, "withdrawal": None, "promo": {}}
    cfg.update(over)
    return cfg


def t_deck_drops_withdrawal_page():
    if not TEMPLATE.is_file():
        raise AssertionError("缺少模版 assets/ppt-reference/gf-template.pptx")
    plan = irr_model.build_plan(_cfg())
    data = deck_builder.build_overview_deck(_cfg(), plan, TEMPLATE)
    eq(len(_pages(data)), 6, "沒有提取方案時應為6頁")


def t_deck_keeps_withdrawal_page():
    if not TEMPLATE.is_file():
        raise AssertionError("缺少模版")
    withdrawal = {"startYear": 11, "endYear": 75, "startAge": 26, "endAge": 90, "annual": 65000,
                  "byYear": {}, "residualYear": 85, "residual": 1097542, "residualAge": 100}
    plan = irr_model.build_plan(_cfg(withdrawal=withdrawal))
    data = deck_builder.build_overview_deck(_cfg(withdrawal=withdrawal), plan, TEMPLATE)
    eq(len(_pages(data)), 7, "有提取方案時應為7頁")
    assert plan["withdrawal"]["count"] == 65


def t_deck_keeps_placeholders_without_promo():
    """No rebate / coupon / prepaid rate -> the promo boxes stay as XX/XXX so a
    human can see they were never filled."""
    if not TEMPLATE.is_file():
        raise AssertionError("缺少模版")
    plan = irr_model.build_plan(_cfg())
    data = deck_builder.build_overview_deck(_cfg(), plan, TEMPLATE)
    text = "\n".join(
        sh.text_frame.text
        for page in _pages(data) for sh in page.shapes
        if getattr(sh, "has_text_frame", False)
    )
    assert "XXX" in text, "缺少優惠資料時應保留模版佔位符，方便肉眼發現"


def t_deck_fills_promo():
    if not TEMPLATE.is_file():
        raise AssertionError("缺少模版")
    promo = {"rebatePct": 26, "rebateDeadline": "2026年10月11日",
             "coupons": [{"count": 2, "value": 1250}, {"count": 6, "value": 63}],
             "prepay1Rate": 4.3, "prepay4Rate": 3.8,
             "promoStart": "2026年10月1日", "promoEnd": "2026年10月11日"}
    cfg = _cfg(promo=promo)
    plan = irr_model.build_plan(cfg)
    data = deck_builder.build_overview_deck(cfg, plan, TEMPLATE)
    text = "\n".join(
        sh.text_frame.text
        for page in _pages(data) for sh in page.shapes
        if getattr(sh, "has_text_frame", False)
    )
    for token in ("31,200", "2,878", "5,160", "49,165", "34,078", "83,243"):
        assert token in text, f"優惠數字 {token} 未填入"


def t_deck_leaves_template_placeholder_alone():
    """A missing withdrawal amount must not silently fall back to a stale
    number carried over from another client's deck."""
    if not TEMPLATE.is_file():
        raise AssertionError("缺少模版")
    plan = irr_model.build_plan(_cfg())
    data = deck_builder.build_overview_deck(_cfg(), plan, TEMPLATE)
    eq(len(_pages(data)), 6)


# ------------------------------------------------------------------- proposal

def t_proposal_parse():
    if not PROPOSAL.is_file():
        raise AssertionError("跳過：本地沒有真實計劃書 PDF")
    import proposal_parse
    parsed = proposal_parse.parse_proposal(PROPOSAL.read_bytes())
    assert parsed["known"], parsed["warnings"]
    p = parsed["profile"]
    eq(p["product"], "财富盈活储蓄保险计划", "產品名稱")
    eq(p["years"], 5, "供款年期")
    eq(p["age"], 15, "投保年齡")
    eq(p["premium"], 120000.0, "年繳保費")
    w = parsed["withdrawalPlan"]
    eq((w["startAge"], w["endAge"], w["count"], w["annual"]), (26, 90, 65, 65000.0), "提取方案")
    eq(w["residual"], 1097542.0, "期末剩餘價值")
    d = parsed["detail"]
    eq(int(d["20"]["total"]), 1669648, "第20年退保總額")
    eq(int(d["30"]["total"]), 3512864, "第30年退保總額")
    # rows must carry every non-guaranteed dollar, otherwise the browser chart
    # would silently drop the terminal dividend.
    row20 = [r for r in parsed["rows"] if r[0] == 20][0]
    close(row20[1] + row20[2], d["20"]["total"], 1.0, "保證＋非保證＝總額")


def t_verify_all_pass():
    if not PROPOSAL.is_file():
        raise AssertionError("跳過：本地沒有真實計劃書 PDF")
    import proposal_parse
    parsed = proposal_parse.parse_proposal(PROPOSAL.read_bytes())
    cfg = {"product": parsed["profile"]["product"], "age": 15, "years": 5, "premium": 120000,
           "fx": 6.8, "levy": 12.76, "endAge": 100, "detail": parsed["detail"],
           "withdrawal": parsed["withdrawalPlan"], "promo": {}, "showYears": [20, 30, 40, 50]}
    plan = irr_model.build_plan(cfg)
    checks = irr_model.verify(cfg, parsed, plan)
    assert not [c for c in checks if c["status"] == "fail"], [c["name"] for c in checks if c["status"] == "fail"]
    eq([round(r["rate"] * 100, 2) for r in plan["table"]], [5.83, 6.50, 6.50, 6.50], "各年期 IRR")
    eq(round(plan["withdrawal"]["rate"] * 100, 2), 6.48, "提取方案 IRR")


for name, fn in list(globals().items()):
    if name.startswith("t_") and callable(fn):
        check(name[2:], fn)

print(f"通過 {len(PASS)} / 失敗 {len(FAIL)}")
for name in PASS:
    print(f"  ok   {name}")
for name in FAIL:
    print(f"  FAIL {name}")
sys.exit(1 if FAIL else 0)
