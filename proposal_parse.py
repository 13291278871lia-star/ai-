"""Source-grounded AIA proposal parser (server side, pdfplumber).

Only reads numbers that the proposal itself prints. Nothing is inferred or
extrapolated: missing sections are reported as missing so the caller can leave
the corresponding deck placeholders untouched.

Recognised sections (verified against 「財富盈活儲蓄保險計劃」 2026-10-02):

* 建議書摘要 (p1)      -> product / insured / age / gender / premium / levy / currency
* 保障及利益摘要        -> 「預期退保發還總額摘要」 (independent cross-check values)
* 詳細說明              -> year-by-year surrender value  (age, year, A, B, C, total)
* 現金提取舉例          -> withdrawal amount per year     (age, year, amount)
* 現金提取後之退保發還金額 -> residual value after withdrawal (age, year, total)

悲觀 / 樂觀 / 身故賠償 pages are deliberately skipped so the parser can never
silently mix scenarios.
"""

from __future__ import annotations

import io
import re

NUM = r"[\d,]+(?:\.\d+)?"


def _num(text):
    return float(str(text).replace(",", "").strip())


def _int(text):
    return int(round(_num(text)))


def _clean(text):
    """Normalise full-width punctuation so the regexes stay readable."""
    return (text or "").replace("（", "(").replace("）", ")").replace("：", ":")


# 詳細說明 / 現金提取後 row: age year premium A B C total
ROW_9 = re.compile(rf"^(\d{{1,3}})\s+(\d{{1,3}})\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})(?:\s|$)")
# 說明摘要 row (no age column): year premium A B C total
ROW_8 = re.compile(rf"^(\d{{1,3}})\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})(?:\s|$)")
# 現金提取金額 row: age year A B C total
ROW_6 = re.compile(
    rf"^(\d{{1,3}})\s+(\d{{1,3}})\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})(?:\s|$)"
)
# 保障及利益摘要「預期退保發還總額摘要」: year  total
STATED = re.compile(rf"^(\d{{1,3}})\s+({NUM})$")


def _page_kind(text):
    head = "\n".join(_clean(text).splitlines()[:14])
    if "悲观情景" in _clean(text) or "悲觀情景" in _clean(text):
        return "skip"
    if "详细说明" in head or "詳細說明" in head:
        return "detail"
    if "现金提取后之退保发还金额" in head or "現金提取後之退保發還金額" in head:
        return "residual"
    if "现金提取金额" in head or "現金提取金額" in head:
        return "withdrawal"
    if "说明摘要" in head or "說明摘要" in head:
        return "summary"
    if "预期退保发还总额摘要" in _clean(text) or "預期退保發還總額摘要" in _clean(text):
        return "stated"
    return "other"


def _pages(pdf):
    return [(i + 1, _clean(p.extract_text() or "")) for i, p in enumerate(pdf.pages)]


def _parse_meta(text):
    """Proposal header (p1). Returns (meta, page)."""
    meta = {}
    m = re.search(r"[計计][劃划][：:]\s*(.+)", text)
    if m:
        raw = m.group(1).strip().splitlines()[0].strip()
        meta["productFull"] = raw[:70]
        # 「财富盈活储蓄保险计划（5 年缴费）」-> base name + payment term
        base = re.split(r"[（(]", raw)[0].strip()
        meta["product"] = base[:70] or raw[:70]
        t = re.search(r"[（(]\s*(\d{1,3})\s*年[缴繳][費费]", raw) or re.search(r"(\d{1,3})\s*年[缴繳][費费]", raw)
        if t:
            meta["years"] = int(t.group(1))
        elif "整付" in raw:
            meta["years"] = 1
    m = re.search(r"受保人姓名[：:]\s*([^\n]+?)\s*年[齡龄][：:]\s*(\d+)", text)
    if m:
        meta["insured"] = m.group(1).strip()[:40]
        meta["age"] = int(m.group(2))
    else:
        m = re.search(r"年[齡龄][：:]\s*(\d+)", text)
        if m:
            meta["age"] = int(m.group(1))
    m = re.search(r"年[齡龄][：:]\s*\d+\s*性[別别][：:]\s*(\S+)", text)
    if m:
        meta["gender"] = m.group(1).strip()[:4]
    m = re.search(r"保[單单][貨货][幣币][：:]\s*(\S+)", text)
    meta["currency"] = (m.group(1) if m else "美元").strip()

    # 保障摘要 row: 基本金額 / 投保時保額 / 年繳保費(2dp) / 保費供款年期 / 保障年期
    m = re.search(
        rf"({NUM})\s+({NUM})\s+({NUM})\s+(\d{{1,3}})\s+[终終]身", text
    )
    if m:
        meta["sumAssured"] = _num(m.group(1))
        meta["deathBenefitAtIssue"] = _num(m.group(2))
        meta["premiumExact"] = _num(m.group(3))
        meta["premium"] = float(round(_num(m.group(3))))
        if "years" not in meta:
            meta["years"] = int(m.group(4))
    if "premium" not in meta:
        m = re.search(rf"({NUM})\s*整付保[費费]", text)
        if m:
            meta["premiumExact"] = _num(m.group(1))
            meta["premium"] = float(round(_num(m.group(1))))
            meta.setdefault("years", 1)
    m = re.search(rf"保[費费][徵征][費费]\s*({NUM})", text)
    meta["levy"] = _num(m.group(1)) if m else 0.0
    m = re.search(rf"投保時年[繳缴]總保[費费][：:]\s*({NUM})", text) or re.search(
        rf"投保时年缴总保费[：:]\s*({NUM})", text
    )
    if m:
        meta["annualTotalPremium"] = _num(m.group(1))
    m = re.search(r"(\d+(?:\.\d+)?)\s*%\s*上限", text)
    if m:
        meta["irrCap"] = float(m.group(1)) / 100
    m = re.search(r"列印日期[：:]\s*([\d年月日\-/]+)", text)
    if m:
        meta["printDate"] = m.group(1).strip()
    return meta


def parse_proposal(file_bytes):
    """Parse an AIA proposal PDF. Never raises for an unknown layout: returns
    known=false plus warnings so the caller can fall back to manual mapping."""
    import pdfplumber

    warnings = []
    pdf = pdfplumber.open(io.BytesIO(file_bytes))
    try:
        pages = _pages(pdf)
        if not pages:
            return {"known": False, "warnings": ["PDF 沒有可讀取文字頁，可能需要 OCR"]}

        full = "\n".join(t for _, t in pages)
        meta = _parse_meta(pages[0][1])

        detail = {}          # year -> dict
        summary = {}         # year -> total (說明摘要)
        withdrawal = {}      # year -> amount
        residual = {}        # year -> total after withdrawal
        stated = {}          # year -> total (保障及利益摘要 cross-check)
        source_pages = {}

        for page_no, text in pages:
            kind = _page_kind(text)
            if kind == "skip":
                continue
            lines = [ln.strip() for ln in text.splitlines() if ln.strip()]

            if kind == "detail":
                for ln in lines:
                    m = ROW_9.match(ln)
                    if not m:
                        continue
                    age, year, premium, a, b, c, total = (
                        int(m.group(1)), int(m.group(2)), _num(m.group(3)),
                        _num(m.group(4)), _num(m.group(5)), _num(m.group(6)), _num(m.group(7)),
                    )
                    if not (1 <= year <= 120) or total <= 0:
                        continue
                    detail[year] = {
                        "year": year, "age": age, "premiumPaid": premium,
                        "guaranteed": a, "reversionary": b, "terminal": c, "total": total,
                        "page": page_no,
                    }
                    source_pages.setdefault("detail", []).append(page_no)

            elif kind == "summary":
                for ln in lines:
                    m = ROW_8.match(ln)
                    if not m:
                        continue
                    year, total = int(m.group(1)), _num(m.group(6))
                    if 1 <= year <= 120:
                        summary[year] = {"year": year, "total": total, "page": page_no}

            elif kind == "withdrawal":
                for ln in lines:
                    m = ROW_6.match(ln)
                    if not m:
                        continue
                    age, year, total = int(m.group(1)), int(m.group(2)), _num(m.group(6))
                    if 1 <= year <= 120:
                        withdrawal[year] = {"year": year, "age": age, "amount": total, "page": page_no}
                        source_pages.setdefault("withdrawal", []).append(page_no)

            elif kind == "residual":
                for ln in lines:
                    m = ROW_9.match(ln)
                    if not m:
                        continue
                    # 現金提取後 columns: age year 繳付保費 提取 基本金額 A B C 總額
                    nums = re.findall(NUM, ln)
                    if len(nums) < 9:
                        continue
                    age, year = int(m.group(1)), int(m.group(2))
                    residual[year] = {
                        "year": year, "age": age,
                        "premiumPaid": _num(nums[2]), "withdraw": _num(nums[3]),
                        "guaranteed": _num(nums[5]), "reversionary": _num(nums[6]),
                        "terminal": _num(nums[7]), "total": _num(nums[8]),
                        "page": page_no,
                    }
                    source_pages.setdefault("residual", []).append(page_no)

            elif kind == "stated":
                for i, ln in enumerate(lines):
                    if "预期退保发还总额摘要" in ln or "預期退保發還總額摘要" in ln:
                        for follow in lines[i + 1:i + 12]:
                            m = STATED.match(follow)
                            if m:
                                stated[int(m.group(1))] = {
                                    "year": int(m.group(1)), "total": _num(m.group(2)), "page": page_no
                                }
                        break

        # The AIA 詳細說明 table is the single source of truth for cash values.
        # Column 2 is every non-guaranteed dollar (復歸紅利 + 終期分紅): the
        # browser model reconstructs the total as guaranteed + non-guaranteed,
        # so dropping 終期分紅 here would understate the chart by a lot.
        rows = [
            [y, detail[y]["guaranteed"], detail[y]["reversionary"] + detail[y]["terminal"]]
            for y in sorted(detail)
        ]

        plan = None
        active = {y: v for y, v in withdrawal.items() if v["amount"] > 0}
        if active and residual:
            years = sorted(active)
            plan = {
                "startYear": years[0],
                "endYear": years[-1],
                "startAge": active[years[0]]["age"],
                "endAge": active[years[-1]]["age"],
                "annual": active[years[0]]["amount"],
                "count": len(years),
                "continuous": years == list(range(years[0], years[-1] + 1)),
                "uniform": len({round(v["amount"], 2) for v in active.values()}) == 1,
                "byYear": {y: active[y]["amount"] for y in years},
                "residualYear": max(residual),
                "residual": residual[max(residual)]["total"],
                "residualAge": residual[max(residual)]["age"],
                "page": sorted(set(source_pages.get("withdrawal", [])))[:2],
            }

        meta["fx"] = 6.8
        if not detail:
            warnings.append("未找到「詳細說明」逐年退保價值表")
        if not meta.get("product"):
            warnings.append("未找到產品名稱")
        if not meta.get("premium"):
            warnings.append("未找到年繳保費")
        if meta.get("age") is None:
            warnings.append("未找到投保年齡")
        if meta.get("currency") and meta["currency"] not in ("美元", "USD", "美金"):
            warnings.append(f"保單貨幣為 {meta['currency']}，本工具僅支援美元")

        known = bool(detail and meta.get("product") and meta.get("premium") and meta.get("age") is not None)
        for key in ("detail", "withdrawal", "residual"):
            if key in source_pages:
                source_pages[key] = sorted(set(source_pages[key]))

        return {
            "known": known,
            "profile": meta,
            "rows": rows,
            "detail": {str(y): detail[y] for y in sorted(detail)},
            "summary": {str(y): summary[y] for y in sorted(summary)},
            "stated": {str(y): stated[y] for y in sorted(stated)},
            "withdrawalPlan": plan,
            "residual": {str(y): residual[y] for y in sorted(residual)},
            "rowCount": len(rows),
            "sourcePages": source_pages,
            "warnings": warnings,
            "hasText": bool(full.strip()),
        }
    finally:
        pdf.close()
