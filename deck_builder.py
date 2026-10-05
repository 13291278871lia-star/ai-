"""Fill the 11-page GF template into a 7-page client overview deck.

The mapping below was derived by diffing the blank template
(assets/ppt-reference/gf-template.pptx) against a deck that was filled by hand
from a 「財富盈活儲蓄保險計劃」 proposal, run by run. Every placeholder is located
by its own text rather than by shape name, because PowerPoint renames shapes
every time a slide is edited — the same box is 文字方塊 5 on one page and
文字方塊 6 on the next. Replacing only the matched run keeps the template's
font, size and colour.

Page map (1-based template page -> output page):
    1  概覽              -> 1
    2  提取概覽           -> 2     (dropped when the proposal has no 現金提取舉例)
    3-6 情景頁（傳承／兩代／教育金）-> 預設刪去
    7  保費回贈／現金券     -> 3
    8  預繳 1 年          -> 4
    9  預繳 4 年          -> 5
    10 優惠總覽           -> 6
    11 繳費方式           -> 7

Nothing here invents a number. Anything the proposal does not contain is left
with the template's placeholder text so a human notices the gap.
"""

from __future__ import annotations

import copy
import io

from pptx.oxml import parse_xml
from pptx.oxml.ns import nsdecls, qn

# Template page indices carrying client-specific scenarios; dropped by default.
SCENARIO_PAGES = (2, 3, 4, 5)
# Decorative group on page 1 that the approved deck does not carry.
OVERVIEW_DECOR = "群組 5"
# Any one of these being present counts as "the user actually gave us a
# promotion"; without them the four promotion pages are dropped.
PROMO_KEYS = ("rebatePct", "coupons", "prepay1Rate", "prepay4Rate")


# ---------------------------------------------------------------- run helpers

def _runs(shape):
    out = []
    for para in shape.text_frame.paragraphs:
        out.extend(para.runs)
    return out


def replace_runs(shape, rules):
    """Replace placeholder runs in place, keeping each run's formatting.

    rules: iterable of (token, new_text, nth). `nth` counts matches of `token`
    in document order starting at 1. Token prefixes:
      '*'  match any run *containing* the token; only the token is swapped out
           so surrounding spaces survive.
      '='  match any run containing the token and replace the whole run.
      none the run must equal the token.

    Runs already consumed by an earlier rule are skipped, keyed on the
    underlying XML element (python-pptx hands out fresh proxy objects, so
    Python object identity is not stable).
    """
    # Snapshot the runs once: python-pptx hands out throwaway proxies, so the
    # list has to be kept alive for index-based bookkeeping to mean anything.
    # `original` is what nth counts against — once a run has been rewritten it
    # no longer matches its own placeholder, so counting live text would make
    # every "second occurrence" rule miss.
    runs = _runs(shape)
    original = [r.text for r in runs]
    used = set()
    for token, new, nth in rules:
        if nth < 1:
            continue
        whole = token.startswith("=")
        contains = whole or token.startswith("*")
        needle = token[1:] if contains else token
        seen = 0
        for i, run in enumerate(runs):
            text = original[i]
            hit = (needle in text) if contains else (text == needle)
            if not hit:
                continue
            seen += 1
            if seen != nth or i in used:
                continue
            if whole:
                run.text = str(new)
            elif contains:
                run.text = text.replace(needle, str(new))
            else:
                run.text = str(new)
            used.add(i)
            break
    return shape


def find(slide, needle, kind="text"):
    """First shape on the slide whose text contains `needle` (tables included)."""
    for shape in slide.shapes:
        if kind == "table":
            if shape.has_table and needle in _table_text(shape.table):
                return shape
        elif getattr(shape, "has_text_frame", False) and needle in shape.text_frame.text:
            return shape
    return None


def _table_text(table):
    return " ".join(
        table.cell(r, c).text
        for r in range(len(table.rows))
        for c in range(len(table.columns))
    )


def _para_elements(cell):
    return list(cell.text_frame._txBody.findall(qn("a:p")))


def _rpr_of(run):
    """Deep copy of a run's <a:rPr> so its look can be reused elsewhere."""
    el = run._r.find(qn("a:rPr"))
    return copy.deepcopy(el) if el is not None else None


def _new_run(text, rpr=None):
    xml = '<a:r %s><a:t>%s</a:t></a:r>' % (
        nsdecls("a"),
        str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"),
    )
    r = parse_xml(xml)
    if rpr is not None:
        r.insert(0, copy.deepcopy(rpr))
    return r


def write_cell_runs(cell, specs):
    """Rebuild a cell's runs, keeping each paragraph's <a:pPr> and line breaks.

    specs: list of paragraphs; each paragraph is a list of (text, rpr_or_None).
    """
    paras = _para_elements(cell)
    if not paras:
        return cell
    for i, spec in enumerate(specs):
        if i < len(paras):
            p = paras[i]
        else:
            p = copy.deepcopy(paras[-1])
            paras[-1].addnext(p)
            paras = _para_elements(cell)
        for child in list(p):
            if child.tag not in (qn("a:pPr"), qn("a:endParaRPr"), qn("a:br")):
                p.remove(child)
        end = p.find(qn("a:endParaRPr"))
        at = list(p).index(end) if end is not None else len(p)
        for text, rpr in spec:
            p.insert(at, _new_run(text, rpr))
            at += 1
    for extra in _para_elements(cell)[len(specs):]:
        extra.getparent().remove(extra)
    return cell


def set_cell(cell, text, sample=None):
    """Set a cell's text. The first run's formatting survives; empty cells
    inherit `sample`'s run formatting (usually the row label next to them)."""
    text = str(text)
    paras = cell.text_frame.paragraphs
    if paras and paras[0].runs:
        runs = paras[0].runs
        runs[0].text = text
        for run in runs[1:]:
            run._r.getparent().remove(run._r)
        for para in paras[1:]:
            para._p.getparent().remove(para._p)
        return cell
    sample_runs = None
    if sample is not None and sample.text_frame.paragraphs:
        sample_runs = sample.text_frame.paragraphs[0].runs
    write_cell_runs(cell, [[(text, _rpr_of(sample_runs[0]) if sample_runs else None)]])
    return cell


def set_cell_pair(cell, first, second):
    """Two-run cell (e.g. 「20」+「年后 」); both runs keep their own look."""
    runs = cell.text_frame.paragraphs[0].runs if cell.text_frame.paragraphs else []
    if len(runs) >= 2:
        runs[0].text = str(first)
        runs[1].text = str(second)
        for run in runs[2:]:
            run._r.getparent().remove(run._r)
        return cell
    return set_cell(cell, f"{first}{second}")


def set_lines(shape, lines):
    """Rewrite a shape's paragraphs, keeping each paragraph's first-run format."""
    lines = [str(x) for x in lines]
    paras = shape.text_frame.paragraphs
    if not paras:
        return shape
    for i, line in enumerate(lines):
        if i < len(paras):
            para = paras[i]
        else:
            para = copy.deepcopy(paras[-1])
            paras[-1]._p.addnext(para._p)
            paras = shape.text_frame.paragraphs
            para = paras[i]
        runs = para.runs
        if runs:
            runs[0].text = line
            for run in runs[1:]:
                run._r.getparent().remove(run._r)
        else:
            para.text = line
    for para in shape.text_frame.paragraphs[len(lines):]:
        para._p.getparent().remove(para._p)
    return shape


def fit_rows(table, n, header=1):
    """Grow or shrink a table so it has exactly n body rows."""
    trs = list(table._tbl.tr_lst)
    while len(trs) - header > n:
        last = trs[-1]
        last.getparent().remove(last)
        trs = list(table._tbl.tr_lst)
    while len(trs) - header < n and trs:
        new = copy.deepcopy(trs[-1])
        trs[-1].addnext(new)
        trs = list(table._tbl.tr_lst)
    return table


def by_pos(slide, x, y, tol=0.55, needle=None):
    """Nearest *non-empty* text box whose centre sits within `tol` inches of (x,y).

    Decorative ellipses and crosses share the grid's coordinates, so empty
    shapes are ignored and a box already carrying `needle` wins over a closer
    empty-ish neighbour.
    """
    best = None  # (head_miss, distance, shape)
    for shape in slide.shapes:
        if shape.left is None or shape.top is None:
            continue
        if not getattr(shape, "has_text_frame", False):
            continue
        text = shape.text_frame.text or ""
        if not text.strip():
            continue
        cx = (shape.left + (shape.width or 0) / 2) / 914400
        cy = (shape.top + (shape.height or 0) / 2) / 914400
        d = ((cx - x) ** 2 + (cy - y) ** 2) ** 0.5
        if d > tol:
            continue
        miss = 0 if (needle and needle in text) else 1
        key = (miss, d)
        if best is None or key < best[0]:
            best = (key, shape)
    return best[1] if best else None


def delete_slide(prs, index):
    slides = list(prs.slides._sldIdLst)
    if index >= len(slides):
        return
    sld = slides[index]
    rId = sld.get(
        "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
    )
    if rId:
        try:
            prs.part.drop_rel(rId)
        except KeyError:
            pass
    prs.slides._sldIdLst.remove(sld)


def delete_shape(slide, name):
    for shape in slide.shapes:
        if shape.name == name:
            shape._element.getparent().remove(shape._element)
            return True
    return False


# ---------------------------------------------------------------- formatting

def wan(value):
    """Format in 萬/万: one decimal below 500萬, whole numbers above."""
    x = value / 10000.0
    if abs(x) >= 500:
        return f"{round(x):,}"
    s = f"{x:,.1f}"
    return s[:-2] if s.endswith(".0") else s


def money(value, digits=0):
    return f"{int(round(value, digits)):,}" if digits == 0 else f"{value:,.{digits}f}"


def pct(rate, digits=2):
    return f"{rate * 100:.{digits}f}%"


def pct_short(rate):
    s = f"{rate * 100:.4f}".rstrip("0").rstrip(".")
    return f"{s}%"


def pct_of(part, whole, digits=1):
    return f"{part / whole * 100:.{digits}f}%" if whole else "0%"


def _date_parts(text):
    """'2026年10月11日' -> (2026, 10, 11); tolerates missing pieces."""
    import re
    m = re.search(r"(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日", str(text or ""))
    return (m.group(1), m.group(2), m.group(3)) if m else (None, None, None)


# ---------------------------------------------------------------- page fills

def fill_overview(slide, cfg, plan):
    product = cfg.get("product") or ""
    premium = plan["premium"]
    total = plan["totalPremium"]
    fx = plan["fx"]

    sh = find(slide, "环宇盈活")
    if sh:
        replace_runs(sh, [            ("=环宇盈活", product, 1)])

    sh = find(slide, "目标")
    if sh:
        replace_runs(sh, [
            ("=全球低息环境", cfg.get("target") or "", 1),
            ("=兼享灵活配置", cfg.get("advantage") or "", 1),
        ])

    sh = find(slide, "供款额")
    if sh:
        replace_runs(sh, [
            ("美元 ", f"美元 {premium:,.0f} ", 1),
            ("人民币", f"人民币 {premium * fx:,.0f}", 1),
            ("5", str(plan["years"]), 1),
            ("美元 ", f"美元{total:,.0f} ", 2),
            ("人民币", f"人民币 {total * fx:,.0f}", 2),
        ])

    sh = find(slide, "年度化年利率", kind="table")
    if sh is None:
        sh = find(slide, "年后", kind="table")
    if sh is not None:
        tbl = sh.table
        rows = plan["table"]
        body = len(tbl.rows) - 1
        for i in range(body):
            row = rows[i] if i < len(rows) else None
            label = tbl.cell(i + 1, 0)
            if row is None:
                set_cell_pair(label, "—", "")
                for c in range(1, len(tbl.columns)):
                    set_cell(tbl.cell(i + 1, c), "", sample=label)
                continue
            set_cell_pair(label, row["year"], "年后 ")
            set_cell(tbl.cell(i + 1, 1), f"{row['usd']:,.0f}", sample=label)
            set_cell(tbl.cell(i + 1, 2), f"{row['rmb']:,.0f}", sample=label)
            set_cell(tbl.cell(i + 1, 3), pct(row["rate"]), sample=label)


def fill_withdrawal(slide, cfg, plan):
    w = plan.get("withdrawal")
    if not w:
        return False
    age = plan["age"]
    years = plan["years"]
    fx = plan["fx"]
    end_age = plan["endAge"]
    title = cfg.get("insuredTitle") or (
        "小姐" if (cfg.get("gender") or "").startswith("女") else "先生"
    )
    product = cfg.get("product") or ""

    sh = find(slide, "岁 先生")
    if sh:
        replace_runs(sh, [
            ("XX", str(age), 1),
            ("岁 先生", f"岁{title}", 1),
            ("/", "", 1),
            ("=环宇盈活", f" {product}（", 1),
            ("5", str(years), 1),
        ])

    boxes = [sh for sh in slide.shapes
             if getattr(sh, "has_text_frame", False) and sh.text_frame.text.strip() == "XX岁"]
    if len(boxes) >= 1:
        replace_runs(boxes[0], [("XX", str(age), 1)])
    if len(boxes) >= 2:
        replace_runs(boxes[1], [("XX", str(age + years - 1), 1)])

    sh = find(slide, "xx-xx岁")
    if sh:
        replace_runs(sh, [("xx-xx", f"{w['startAge']}-{w['endAge']}", 1)])

    sh = find(slide, "100岁")
    if sh:
        replace_runs(sh, [("100", str(end_age), 1)])

    sh = find(slide, "每年基本储蓄")
    if sh:
        replace_runs(sh, [
            ("美元", f"美元{wan(plan['premium'])}万", 1),
            ("人民币", f"人民币{wan(plan['premium'] * fx)}万", 1),
            ("5", str(years), 1),
            ("美元", f"美元 {wan(plan['totalPremium'])}万", 2),
            ("人民币", f"人民币{wan(plan['totalPremium'] * fx)}万", 2),
        ])

    sh = find(slide, "岁每年提取")
    if sh:
        replace_runs(sh, [
            ("60", str(w["startAge"]), 1),
            ("-90", f"-{w['endAge']}", 1),
            ("美元", f"美元{wan(w['annual'])}万", 1),
            ("人民币", f"人民币{wan(w['annual'] * fx)}万", 1),
            ("{ 31", "{ " + str(w["count"]), 1),
            ("美元 ", f"美元{wan(w['totalWithdrawn'])}万 ", 1),
            ("人民币", f"人民币{wan(w['totalWithdrawn'] * fx)}万", 2),
        ])

    sh = find(slide, "选择退保或传承")
    if sh:
        replace_runs(sh, [
            ("100", str(end_age), 1),
            ("美元 ", f"美元{w['residual']:,.0f} ", 1),
            ("人民币", f"人民币{w['residual'] * fx:,.0f}", 1),
        ])

    sh = find(slide, "x 年")
    if sh:
        replace_runs(sh, [("x ", f"x {w['count']}", 1)])

    sh = find(slide, "实际回报年利率")
    if sh:
        replace_runs(sh, [("%", pct(w["rate"]), 1)])

    sh = find(slide, "一生合共提取")
    if sh:
        replace_runs(sh, [
            ("=环宇盈活", product, 1),
            ("XX", f"{wan(w['grandTotal'])}萬", 1),
            ("XX", f"{wan(w['grandTotal'] * fx)}萬", 2),
            ("XX", f"{w['multiple']:.1f} ", 3),
        ])
    return True


def _coupon_sentence(cell, coupons, total, fx):
    """Rebuild 「…會轉 N 張美元 X 及 M 張美元 Y 的現金券…」 for any coupon count."""
    runs = cell.text_frame.paragraphs[0].runs
    plain, red = None, None
    for run in runs:
        if run.text.strip() in ("会转", "，", "合共"):
            plain = _rpr_of(run)
        if run.text == "美元" and run.font.bold:
            red = _rpr_of(run)
    if plain is None and runs:
        plain = _rpr_of(runs[0])
    if red is None and runs:
        red = _rpr_of(runs[-1])

    body = []
    for i, c in enumerate(coupons or []):
        if int(c.get("count") or 0) <= 0:
            continue
        if body:
            body.append(("及", plain))
        body.extend([(str(int(c["count"])), plain),
                     ("张", plain),
                     ("美元", plain),
                     (money(float(c.get("value") or 0)), plain)])
    if not body:
        body = [("现时没有", plain)]
    tail = [("的现金券入你的友邦账户", plain), ("，", plain), ("合共", plain),
            ("美元", red), (f"{money(total)} (", red), ("人民币", red),
            (money(total * fx), red), (")", red)]
    head = [("现时你的友邦账户没有现金券", plain), (", ", plain), ("会转", plain)]
    write_cell_runs(cell, [head + body + tail])


def fill_promotion(slide, cfg, plan):
    promo = plan["promo"]
    promo_cfg = cfg.get("promo") or {}
    fx = plan["fx"]
    product = cfg.get("product") or ""
    premium = plan["premium"]
    years = plan["years"]
    y, m, d = _date_parts(promo_cfg.get("rebateDeadline"))

    sh = find(slide, "共节省")
    if sh:
        replace_runs(sh, [
            ("元", f"元{promo['totalSaving']:,.0f}", 1),
            ("人民币", f"人民币{promo['totalSaving'] * fx:,.0f}", 1),
        ])

    sh = find(slide, "保费回赠：", kind="table")
    if sh is not None:
        tbl = sh.table
        head = tbl.cell(0, 0)
        replace_runs(head, [
            ("=环宇盈活", product, 1),
            ("100,000", money(premium), 1),
            ("美元 ", "美元", 1),
        ])
        cell = tbl.cell(1, 1)
        rules = [("=环宇盈活", product, 1), ("*(5", f"({years}", 1)]
        if y:
            rules.append(("2026", y, 1))
        if m:
            rules.append(("9", m, 1))
        if d:
            rules.append(("30", d, 1))
        rules += [
            ("XX%", f"{pct_short(promo['rebatePct'] / 100)}", 1),
            ("XX (", f"{money(promo['rebate'])} (", 1),
            ("XX", money(promo["rebate"] * fx), 1),
        ]
        replace_runs(cell, rules)

        _coupon_sentence(tbl.cell(3, 1), promo["coupons"], promo["couponTotal"], fx)

    sh = find(slide, "缴费", kind="table")
    if sh is not None:
        tbl = sh.table
        if len(tbl.rows) != years:
            fit_rows(tbl, years, header=0)
        for i, pay in enumerate(plan["payments"][:len(tbl.rows)]):
            set_cell(tbl.cell(i, 1), f"美元{pay['amount']:,.0f}")


def fill_prepay(slide, cfg, plan, years, interest_key, rate_key):
    promo = plan["promo"]
    promo_cfg = cfg.get("promo") or {}
    premium = plan["premium"]
    rate = promo[rate_key]
    interest = promo[interest_key]

    sh = find(slide, "优惠利息合共")
    if sh:
        rules = []
        if any(run.text == "XXX" for run in _runs(sh)):
            rules.append(("XXX", money(interest), 1))
        else:
            # Template page 9 has a blank run where the amount belongs.
            rules += [("美元", f"美元{money(interest)}", 1), (" ", "", 1)]
        rules += [("*(4.3%", f"({pct_short(rate)}", 1),
                  ("*(40.9%", f"({pct_of(interest, premium)}", 1)]
        replace_runs(sh, rules)

    sh = find(slide, "保费享保证优惠年利率")
    if sh:
        replace_runs(sh, [
            ("*4.3%", pct_short(rate), 1),
            ("*3.8%", pct_short(rate), 1),
        ])

    sh = find(slide, "年缴保费美元")
    if sh:
        replace_runs(sh, [
            ("*XXX", money(premium), 1),
            ("1", str(years), 1),
            ("4", str(years), 1),
        ])

    sh = find(slide, "环宇盈活")
    if sh:
        replace_runs(sh, [("=环宇盈活", cfg.get("product") or "", 1)])

    sh = find(slide, "推广期由")
    if sh:
        set_lines(sh, [
            "以上数据只供参考，详情请参阅计划书",
            f"推广期由 {promo_cfg.get('promoStart') or ''}至 {promo_cfg.get('promoEnd') or ''}"
            f"，优惠名额有限及先到先得，额满即止。",
        ])

    sh = find(slide, "个保单周年日", kind="table")
    if sh is not None:
        tbl = sh.table
        schedule = promo["prepay4Schedule"] if years == 4 else [
            {"balance": premium, "earned": interest}
        ]
        for i, item in enumerate(schedule):
            if i >= len(tbl.columns):
                break
            cell = tbl.cell(1, i)
            runs = cell.text_frame.paragraphs[0].runs
            if len(runs) >= 3:
                runs[0].text = f"美元{item['balance']:,.0f} "
                runs[1].text = f"x {pct_short(rate)}"
                runs[2].text = f"美元{item['earned']:,.0f}"


def fill_summary_grid(slide, cfg, plan):
    """Template page 10 is a 3x4 grid; match by position, not by shape name,
    because the boxes are frequently re-created by hand."""
    promo = plan["promo"]
    fx = plan["fx"]
    cols = [3.90, 6.32, 8.85, 11.74]           # 保費回贈 / 電子券 / 預繳利息 / 合共
    rows = [1.92, 3.88, 5.88]                  # i 不預繳 / ii 預繳1年 / iii 預繳4年
    values = [
        [promo["rebate"], promo["couponTotal"], None, promo["totalSaving"]],
        [promo["rebate"], promo["couponTotal"], promo["prepay1Interest"], promo["withPrepay1"]],
        [promo["rebate"], promo["couponTotal"], promo["prepay4Interest"], promo["withPrepay4"]],
    ]
    heads = ["保费回赠", "电子保费\n优惠劵", "预缴优惠\n利息", "合共"]
    for r, y in enumerate(rows):
        for c, x in enumerate(cols):
            value = values[r][c]
            if value is None:
                continue
            sh = by_pos(slide, x, y, needle=heads[c].split("\n")[0])
            if sh is None:
                continue
            set_lines(sh, heads[c].split("\n") + [f"美元{value:,.0f}", f"(人民币{value * fx:,.0f})"])


# ---------------------------------------------------------------- entry point

def build_overview_deck(cfg, plan, template_path, keep_scenario_pages=False):
    """Return the filled .pptx as bytes."""
    from pptx import Presentation

    prs = Presentation(str(template_path))
    if not keep_scenario_pages:
        for index in sorted(SCENARIO_PAGES, reverse=True):
            delete_slide(prs, index)

    pages = list(prs.slides)
    if not pages:
        raise ValueError("模版沒有可填充的頁面")

    delete_shape(pages[0], OVERVIEW_DECOR)
    fill_overview(pages[0], cfg, plan)

    withdrawal_index = 1 if len(pages) > 1 else None
    has_withdrawal = False
    if withdrawal_index is not None:
        has_withdrawal = fill_withdrawal(pages[withdrawal_index], cfg, plan)

    drop = []
    # Without a withdrawal example in the proposal the page cannot be filled.
    if withdrawal_index is not None and not has_withdrawal:
        drop.append(pages[withdrawal_index])

    # Promotion numbers (rebate %, coupon face value, prepaid-interest rate)
    # are set by the insurer per campaign and are never in the proposal. When
    # they are missing we leave the template's own XX / XXX placeholders in
    # place rather than writing 0 -- a silently-zero discount is the one
    # mistake nobody notices. The four pages stay in the deck so the agent can
    # see exactly which boxes still need typing.
    promo_cfg = cfg.get("promo") or {}
    has_promo = any(promo_cfg.get(k) for k in PROMO_KEYS)
    if has_promo:
        rest = pages[2:]
        if len(rest) >= 1:
            fill_promotion(rest[0], cfg, plan)
        if len(rest) >= 2:
            fill_prepay(rest[1], cfg, plan, 1, "prepay1Interest", "prepay1Rate")
        if len(rest) >= 3:
            fill_prepay(rest[2], cfg, plan, 4, "prepay4Interest", "prepay4Rate")
        if len(rest) >= 4:
            fill_summary_grid(rest[3], cfg, plan)

    for slide in drop:
        index = list(prs.slides).index(slide)
        delete_slide(prs, index)

    bio = io.BytesIO()
    prs.save(bio)
    return bio.getvalue()
