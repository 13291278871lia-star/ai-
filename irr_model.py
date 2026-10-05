"""Cash-flow model shared by the deck builder and the IRR verification panel.

Everything here is arithmetic on numbers the proposal printed. Nothing is
projected, smoothed or invented: if the proposal has no withdrawal example the
caller gets `withdrawal=None` and must leave those placeholders alone.

Conventions (same as the browser engine in src/insurance-ppt.js):
  * t=0 is the policy date; year-n premiums fall on t=0..n-1.
  * Surrender values are paid at the end of the policy year (t=year).
  * IRR is solved in log(1+r) space so -100% stays representable.
"""

from __future__ import annotations

import math

# AIA's own illustration basis excludes the IA levy (建議書 說明 xviii).
DEFAULT_INCLUDE_LEVY = False
# Regulatory cap the insurer applies to illustrated total internal return.
DEFAULT_IRR_CAP = 0.065


def npv_log(flows, x):
    """Σ CF_t·e^{-t·x} with x = log(1+r), using a shared exponent shift.

    The shift keeps the sum inside float range for 50-year flows and makes the
    result dimensionless: npv ≈ 0 means the discounted inflows and outflows
    cancel, and the size of the residual is directly comparable between a
    120k policy and a 12m-dollar one.
    """
    logs = [-math.inf] * len(flows)
    for t, v in enumerate(flows):
        if v:
            logs[t] = math.log(abs(v)) - t * x
    scale = max(logs)
    return sum((1 if v > 0 else -1) * math.exp(l - scale) for l, v in zip(logs, flows) if v)


def npv(flows, rate):
    """Σ CF_t / (1+r)^t, reported on the same shifted scale as npv_log."""
    return npv_log(flows, math.log1p(rate))


def _sign_changes(flows):
    signs = [1 if v > 0 else (-1 if v < 0 else 0) for v in flows]
    signs = [s for s in signs if s]
    return sum(1 for i in range(1, len(signs)) if signs[i] != signs[i - 1])


def irr_bisect(flows):
    """Primary solver: bisection on log(1+r). Mirrors irr() in insurance-ppt.js."""
    if not flows or len(flows) < 2:
        raise ValueError("現金流至少需要兩期")
    if any(not isinstance(v, (int, float)) or math.isnan(v) or math.isinf(v) for v in flows):
        raise ValueError("現金流必須為有效數字")
    if not any(v > 0 for v in flows) or not any(v < 0 for v in flows):
        raise ValueError("IRR 需要同時有支出與收入")
    if _sign_changes(flows) > 1:
        raise ValueError("現金流正負號多次轉換，可能存在多個 IRR")

    lo, hi = -32.0, 32.0
    flo = npv_log(flows, lo)
    if flo * npv_log(flows, hi) > 0:
        raise ValueError("未能求得 IRR")
    for _ in range(220):
        mid = (lo + hi) / 2
        v = npv_log(flows, mid)
        if abs(v) < 1e-14:
            return math.expm1(mid)
        if v * flo > 0:
            lo, flo = mid, v
        else:
            hi = mid
    return math.expm1((lo + hi) / 2)


def irr_newton(flows, guess=0.06):
    """Independent second solver, used only to cross-check irr_bisect.

    Damped Newton on x = log(1+r) with a *numerical* derivative, so it shares
    no algebra with the bisection solver: if the two disagree, one of them is
    wrong and the verification panel says so instead of picking a winner.

    Working in x-space means -100% stays representable, and the residual is
    judged on npv_log's own shifted scale rather than in dollars — otherwise a
    perfectly good 3.5m-dollar answer fails a 1e-6-dollar tolerance.
    """
    x = math.log1p(guess)
    for _ in range(120):
        v = npv_log(flows, x)
        h = 1e-6 * max(1.0, abs(x))
        d = (npv_log(flows, x + h) - npv_log(flows, x - h)) / (2 * h)
        if d == 0 or not math.isfinite(d):
            break
        step = v / d
        # A full Newton step on a long flat flow jumps straight past the root.
        while abs(step) > 0.5:
            step /= 2
        x -= step
        if abs(step) < 1e-14:
            break
    if abs(npv_log(flows, x)) > 1e-9:
        raise ValueError("牛頓法未收斂，請以二分法結果為準")
    return math.expm1(x)


def surrender_flows(premium, years, year, total, levy=0.0, include_levy=DEFAULT_INCLUDE_LEVY):
    """Premiums at t=0..years-1, surrender value at t=year."""
    flows = [0.0] * (year + 1)
    for t in range(min(years, year + 1)):
        flows[t] -= premium
    if include_levy:
        flows[0] -= levy
    flows[year] += total
    return flows


def withdrawal_flows(premium, years, plan, levy=0.0, include_levy=DEFAULT_INCLUDE_LEVY):
    """Premiums at t=0..years-1, withdrawal each year of the plan, residual last."""
    last = max(plan["endYear"], plan.get("residualYear", plan["endYear"]))
    flows = [0.0] * (last + 1)
    for t in range(years):
        flows[t] -= premium
    if include_levy:
        flows[0] -= levy
    for y in range(plan["startYear"], plan["endYear"] + 1):
        flows[y] += plan.get("byYear", {}).get(str(y), plan.get("byYear", {}).get(y, plan["annual"]))
    residual_year = plan.get("residualYear")
    if residual_year is not None:
        flows[residual_year] += plan.get("residual", 0.0)
    return flows


def prepaid_interest(premium, rate, years=4):
    """Prepaid-premium interest, same recurrence as 複本 irr sample.xlsx C71:E75.

    balance_n = n*premium + interest accrued so far, for n = years..1.
    """
    if premium <= 0 or rate < 0:
        raise ValueError("預繳輸入無效")
    interest = 0.0
    out = []
    for n in range(years, 0, -1):
        balance = n * premium + interest
        earned = balance * rate
        interest += earned
        out.append({"year": years - n + 1, "balance": balance, "earned": earned, "total": interest})
    return out


def promo_figures(premium, promo):
    """Rebate / e-coupon / prepaid interest / total savings."""
    pct = float(promo.get("rebatePct") or 0)
    rebate = round(premium * pct / 100, 2)
    coupons = promo.get("coupons") or []
    coupon_total = round(sum(int(c.get("count") or 0) * float(c.get("value") or 0) for c in coupons), 2)
    p1 = float(promo.get("prepay1Rate") or 0) / 100
    p4 = float(promo.get("prepay4Rate") or 0) / 100
    i1 = round(premium * p1, 2)
    i4 = round(prepaid_interest(premium, p4, 4)[-1]["total"], 2)
    return {
        "rebatePct": pct,
        "rebate": rebate,
        "coupons": coupons,
        "couponTotal": coupon_total,
        "totalSaving": round(rebate + coupon_total, 2),
        "prepay1Rate": p1,
        "prepay1Interest": i1,
        "prepay4Rate": p4,
        "prepay4Interest": i4,
        "prepay4Schedule": prepaid_interest(premium, p4, 4),
        "withPrepay1": round(rebate + coupon_total + i1, 2),
        "withPrepay4": round(rebate + coupon_total + i4, 2),
    }


def payment_schedule(premium, years, promo_figures):
    """Year 1 nets off the e-coupons, year 2 nets off the premium rebate."""
    out = []
    for y in range(1, years + 1):
        amount = premium
        note = ""
        if y == 1:
            amount = round(premium - promo_figures["couponTotal"], 2)
            note = "已扣减保费现金券"
        elif y == 2:
            amount = round(premium - promo_figures["rebate"], 2)
            note = "已扣减保费回赠"
        out.append({"year": y, "amount": amount, "note": note})
    return out


def wan(value):
    """Format a USD/RMB amount in 萬 / 万, matching the reference deck."""
    x = value / 10000.0
    if abs(x) >= 500:
        return f"{round(x):,}"
    s = f"{x:,.1f}"
    return s[:-2] if s.endswith(".0") else s


def money(value, digits=0):
    return f"{round(value, digits):,}" if digits == 0 else f"{value:,.{digits}f}"


def build_plan(cfg):
    """Assemble every number the deck needs, with its provenance."""
    premium = float(cfg["premium"])
    years = int(cfg["years"])
    age = int(cfg["age"])
    fx = float(cfg.get("fx") or 6.8)
    levy = float(cfg.get("levy") or 0)
    include_levy = bool(cfg.get("includeLevy", DEFAULT_INCLUDE_LEVY))
    end_age = int(cfg.get("endAge") or 100)
    detail = cfg.get("detail") or {}
    max_year = max((int(y) for y in detail), default=end_age - age)

    requested = [int(y) for y in (cfg.get("showYears") or [20, 30, 40, 50])]
    available = [y for y in requested if str(y) in detail]
    if not available:
        years_sorted = sorted(int(y) for y in detail)
        available = years_sorted[-min(4, len(years_sorted)):] if years_sorted else []
    # Keep the deck honest: never show a year the proposal does not contain.
    table_years = sorted(available)[:4]

    table = []
    for y in table_years:
        d = detail[str(y)]
        flows = surrender_flows(premium, years, y, d["total"], levy, include_levy)
        table.append({
            "year": y,
            "age": d.get("age", age + y),
            "usd": d["total"],
            "rmb": d["total"] * fx,
            "rate": irr_bisect(flows),
            "guaranteed": d.get("guaranteed"),
            "reversionary": d.get("reversionary"),
            "terminal": d.get("terminal"),
            "page": d.get("page"),
            "flows": flows,
        })

    withdrawal = cfg.get("withdrawal")
    withdrawal_result = None
    if withdrawal:
        start_year = int(withdrawal["startYear"])
        end_year = int(withdrawal["endYear"])
        annual = float(withdrawal["annual"])
        by_year = {int(k): float(v) for k, v in (withdrawal.get("byYear") or {}).items()}
        plan = {
            "startYear": start_year,
            "endYear": end_year,
            "startAge": int(withdrawal.get("startAge", age + start_year)),
            "endAge": int(withdrawal.get("endAge", age + end_year)),
            "annual": annual,
            "byYear": by_year,
            "residualYear": int(withdrawal["residualYear"]) if withdrawal.get("residualYear") else None,
            "residual": float(withdrawal.get("residual") or 0),
            "residualAge": int(withdrawal.get("residualAge") or end_age),
            "count": end_year - start_year + 1,
        }
        flows = withdrawal_flows(premium, years, plan, levy, include_levy)
        total_withdrawn = sum(by_year.get(y, annual) for y in range(start_year, end_year + 1))
        total_out = total_withdrawn + plan["residual"]
        withdrawal_result = {
            **plan,
            "totalWithdrawn": total_withdrawn,
            "grandTotal": total_out,
            "multiple": total_out / (premium * years) if premium * years else 0,
            "rate": irr_bisect(flows),
            "flows": flows,
        }

    promo = promo_figures(premium, cfg.get("promo") or {})
    return {
        "premium": premium,
        "years": years,
        "age": age,
        "fx": fx,
        "levy": levy,
        "includeLevy": include_levy,
        "endAge": end_age,
        "maxYear": max_year,
        "totalPremium": premium * years,
        "table": table,
        "withdrawal": withdrawal_result,
        "promo": promo,
        "payments": payment_schedule(premium, years, promo),
    }


# --------------------------------------------------------------------------
# Verification
# --------------------------------------------------------------------------

def _check(status, name, detail, expected=None, actual=None, source=None):
    item = {"status": status, "name": name, "detail": detail}
    if expected is not None:
        item["expected"] = expected
        item["actual"] = actual
    if source:
        item["source"] = source
    return item


def verify(cfg, parsed, plan):
    """Independently re-derive every headline number and report PASS/WARN/FAIL."""
    checks = []
    detail = parsed.get("detail") or {}
    premium = float(cfg["premium"])
    years = int(cfg["years"])
    fx = float(cfg.get("fx") or 6.8)
    cap = float(cfg.get("irrCap") or DEFAULT_IRR_CAP)

    # 1. 總額 = 保證 + 復歸 + 終期, for every parsed year
    bad = []
    for y, d in sorted(detail.items(), key=lambda kv: int(kv[0])):
        if abs((d["guaranteed"] + d["reversionary"] + d["terminal"]) - d["total"]) > max(1.0, d["total"] * 1e-6):
            bad.append(int(y))
    checks.append(_check(
        "pass" if not bad else "fail",
        "退保總額 = 保證 + 復歸紅利 + 終期分紅",
        f"已核對 {len(detail)} 個年度" + (f"，第 {', '.join(map(str, bad[:8]))} 年不符" if bad else "，全部相符"),
        source=f"詳細說明 第 {_pages_of(detail)} 頁",
    ))

    # 2. 繳付保費總額 = 年繳保費 × min(年度, 供款年期)
    bad = []
    for y, d in sorted(detail.items(), key=lambda kv: int(kv[0])):
        expect = premium * min(int(y), years)
        if abs(d.get("premiumPaid", expect) - expect) > max(1.0, expect * 0.01):
            bad.append(int(y))
    checks.append(_check(
        "pass" if not bad else "warn",
        "繳付保費總額 = 年繳保費 × 供款年期上限",
        "全部相符" if not bad else f"第 {', '.join(map(str, bad[:8]))} 年與保費×年期不符（提取後基本金額會改變此欄，屬正常）",
        source="詳細說明",
    ))

    # 3. 保證現金價值單調不減
    seq = [detail[str(y)]["guaranteed"] for y in sorted(detail, key=int)]
    mono = all(b >= a - 1 for a, b in zip(seq, seq[1:]))
    checks.append(_check(
        "pass" if mono else "warn",
        "保證現金價值逐年不減少",
        f"掃描 {len(seq)} 個年度" + ("" if mono else "，發現下降區間"),
    ))

    # 4. 與計劃書自身「預期退保發還總額摘要」對帳
    stated = parsed.get("stated") or {}
    if stated:
        parts, ok = [], True
        for y, s in sorted(stated.items(), key=lambda kv: int(kv[0])):
            d = detail.get(y)
            if not d:
                continue
            same = abs(d["total"] - s["total"]) < 1.0
            ok = ok and same
            parts.append(f"第{y}年 {money(d['total'])} vs {money(s['total'])}")
        checks.append(_check(
            "pass" if ok else "fail",
            "與計劃書「預期退保發還總額摘要」對帳",
            "；".join(parts) or "沒有可對帳年度",
            source=f"保障及利益摘要 第 {_pages_of(stated)} 頁",
        ))

    # 5. IRR 雙算法一致
    worst = 0.0
    for row in plan["table"]:
        a = irr_bisect(row["flows"])
        try:
            b = irr_newton(row["flows"])
        except ValueError:
            b = a
        worst = max(worst, abs(a - b))
    checks.append(_check(
        "pass" if worst < 1e-9 else "fail",
        "IRR 雙算法一致（二分法 vs 牛頓法）",
        f"最大差異 {worst:.2e}",
    ))

    # 6. IRR 回代：NPV(r) ≈ 0
    worst = 0.0
    for row in plan["table"] + ([plan["withdrawal"]] if plan["withdrawal"] else []):
        if not row:
            continue
        scale = max(abs(v) for v in row["flows"])
        worst = max(worst, abs(npv(row["flows"], row["rate"])) / scale)
    checks.append(_check(
        "pass" if worst < 1e-9 else "fail",
        "IRR 回代檢驗：NPV(r) = 0",
        f"最大相對殘差 {worst:.2e}",
    ))

    # 7. 監管 6.5% 上限提示
    capped = [r["year"] for r in plan["table"] if r["rate"] >= cap - 1e-6]
    checks.append(_check(
        "warn" if capped else "pass",
        f"內部回報率 {cap * 100:.1f}% 監管上限",
        f"第 {', '.join(map(str, capped))} 年剛好等於上限，屬計劃書已被調低後的數值，並非保證回報"
        if capped else "所有年度均未觸及上限",
        source="建議書 說明 (vii)",
    ))

    # 8. 匯率換算
    bad = [r["year"] for r in plan["table"] if abs(r["rmb"] - r["usd"] * fx) > 0.01]
    checks.append(_check(
        "pass" if not bad else "fail",
        f"人民幣 = 美元 × {fx:g}",
        "全部相符" if not bad else f"第 {', '.join(map(str, bad))} 年不符",
    ))

    # 9. 提取方案
    w = plan["withdrawal"]
    if w:
        expect_count = w["endAge"] - w["startAge"] + 1
        checks.append(_check(
            "pass" if w["count"] == expect_count else "fail",
            "提取年數 = 結束年齡 − 開始年齡 + 1",
            f"{w['startAge']}–{w['endAge']}歲共 {w['count']} 年",
            expected=expect_count, actual=w["count"],
            source=f"現金提取舉例 第 {_pages_of(parsed.get('residual') or {}, default=cfg.get('withdrawalPage'))} 頁",
        ))
        expect_total = w["annual"] * w["count"] if not w.get("byYear") else sum(w["byYear"].values())
        checks.append(_check(
            "pass" if abs(w["totalWithdrawn"] - expect_total) < 1 else "fail",
            "合共提取 = 每年提取 × 年數",
            money(w["totalWithdrawn"]),
            expected=money(expect_total), actual=money(w["totalWithdrawn"]),
        ))
        residual_src = (parsed.get("residual") or {}).get(str(w["residualYear"]))
        if residual_src:
            checks.append(_check(
                "pass" if abs(residual_src["total"] - w["residual"]) < 1 else "fail",
                f"{w['residualAge']}歲剩餘價值取自「現金提取後之退保發還金額」",
                money(w["residual"]),
                expected=money(residual_src["total"]), actual=money(w["residual"]),
                source=f"建議書 第 {residual_src.get('page')} 頁",
            ))
        checks.append(_check(
            "pass",
            "倍數 =（合共提取 + 期末價值）÷ 累計保費",
            f"{w['multiple']:.2f} 倍（{money(w['grandTotal'])} ÷ {money(premium * years)}）",
        ))
        if w["rate"] >= cap - 1e-6:
            checks.append(_check("warn", "提取方案 IRR 觸及上限", f"{w['rate'] * 100:.2f}%"))
    else:
        checks.append(_check("warn", "提取方案", "計劃書沒有「現金提取舉例」，提取概覽頁不予填充"))

    # 10. 保費徵費口徑
    checks.append(_check(
        "pass",
        "IRR 是否計入保費徵費",
        f"目前{'計入' if plan['includeLevy'] else '不計入'}（徵費 {money(cfg.get('levy') or 0, 2)} 美元）"
        f"；建議書說明 xviii 採用不計入的口徑",
        source="建議書 說明 (xviii)",
    ))

    return checks


def _pages_of(mapping, default=None):
    pages = sorted({v.get("page") for v in mapping.values() if v.get("page")})
    return "、".join(str(p) for p in pages) if pages else (default or "—")
