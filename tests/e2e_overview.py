"""End-to-end check: parse the real proposal, build the deck, diff it against
the deck that was filled by hand.

    python3.11 tests/e2e_overview.py <proposal.pdf> <template.pptx> <reference.pptx>

Prints a per-shape diff so a placeholder that stopped matching shows up as
"still the template's placeholder" rather than silently looking fine.
"""

from __future__ import annotations

import io
import sys

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent.parent))

import deck_builder
import irr_model
import proposal_parse
from pptx import Presentation


PROMO = {
    "rebatePct": 26,
    "rebateDeadline": "2026年10月11日",
    "coupons": [{"count": 2, "value": 1250}, {"count": 6, "value": 63}],
    "prepay1Rate": 4.3,
    "prepay4Rate": 3.8,
    "promoStart": "2026年10月1日",
    "promoEnd": "2026年10月11日",
}


def cfg_from_parsed(parsed, promo=PROMO):
    p = parsed["profile"]
    return {
        "product": p.get("product"),
        "insured": p.get("insured"),
        "gender": p.get("gender"),
        "age": p.get("age"),
        "years": p.get("years"),
        "premium": p.get("premium"),
        "levy": p.get("levy"),
        "fx": p.get("fx") or 6.8,
        "endAge": 100,
        "irrCap": p.get("irrCap") or irr_model.DEFAULT_IRR_CAP,
        "showYears": [20, 30, 40, 50],
        "detail": parsed["detail"],
        "withdrawal": parsed["withdrawalPlan"],
        "promo": promo,
        "insuredTitle": "妹妹",
        "target": "透过长远而审慎的规划，为家族财富奠定可世代传承的基础",
        "advantage": "支持灵活资金流动性，助您从容拥抱机遇；同时透过周全而长远的财务规划，为您的财富提供稳健的支撑",
    }


def flatten(path_or_bytes):
    prs = Presentation(path_or_bytes) if not isinstance(path_or_bytes, io.BytesIO) else Presentation(path_or_bytes)
    out = []
    for i, slide in enumerate(prs.slides, 1):
        for sh in slide.shapes:
            if sh.has_table:
                t = sh.table
                for r in range(len(t.rows)):
                    for c in range(len(t.columns)):
                        txt = t.cell(r, c).text
                        if txt.strip():
                            out.append((i, f"{sh.name}[{r},{c}]", txt))
            elif sh.has_text_frame and sh.text_frame.text.strip():
                out.append((i, sh.name, sh.text_frame.text))
    return out


def norm(s):
    return " ".join(str(s).replace("\v", " ").replace("\n", " ").split())


def main():
    proposal, template, reference = sys.argv[1], sys.argv[2], sys.argv[3]
    parsed = proposal_parse.parse_proposal(open(proposal, "rb").read())
    print("known:", parsed["known"], "warnings:", parsed["warnings"])

    cfg = cfg_from_parsed(parsed)
    plan = irr_model.build_plan(cfg)
    print("table:", [(r["year"], f"{r['usd']:,.0f}", f"{r['rate']*100:.2f}%") for r in plan["table"]])
    w = plan["withdrawal"]
    print("withdrawal:", f"{w['startAge']}-{w['endAge']}岁", f"{w['annual']:,.0f}×{w['count']}",
          "合计", f"{w['grandTotal']:,.0f}", f"{w['multiple']:.2f}倍", f"{w['rate']*100:.2f}%")

    for item in irr_model.verify(cfg, parsed, plan):
        print(f"  [{item['status'].upper():4}] {item['name']} — {item['detail']}")

    data = deck_builder.build_overview_deck(cfg, plan, template)
    open("/tmp/generated.pptx", "wb").write(data)

    gen = flatten(io.BytesIO(data))
    ref = flatten(reference)
    print(f"\ngenerated {len(gen)} text blocks / reference {len(ref)}")

    ref_map = {}
    for page, name, txt in ref:
        ref_map.setdefault((page, name), []).append(txt)
    gen_map = {}
    for page, name, txt in gen:
        gen_map.setdefault((page, name), []).append(txt)

    # PowerPoint renames shapes every time a slide is edited, so compare the
    # per-page multiset of strings first (what the reader actually sees), then
    # fall back to a per-shape diff for the leftovers.
    pages = sorted({p for p, _, _ in gen} | {p for p, _, _ in ref})
    same = diff = missing = extra = 0
    for p in pages:
        from collections import Counter
        g = Counter(norm(t) for pg, _, t in gen if pg == p)
        r = Counter(norm(t) for pg, _, t in ref if pg == p)
        for text in sorted((g - r).elements()):
            print(f"  多  p{p}: {text[:150]}")
            extra += 1
        for text in sorted((r - g).elements()):
            print(f"  缺  p{p}: {text[:150]}")
            missing += 1
        shared = g & r
        same += sum(shared.values())
        diff += sum((g - r).values()) + sum((r - g).values())
    print(f"\n按内容比对（忽略形状重命名）：一致 {same} / 生成多出 {extra} / 参考多出 {missing}")

    if "-v" in sys.argv:
        keys = sorted(set(ref_map) | set(gen_map), key=lambda k: (k[0], str(k[1])))
        for key in keys:
            a = [norm(x) for x in gen_map.get(key, [])]
            b = [norm(x) for x in ref_map.get(key, [])]
            if a != b:
                print(f"  形状 p{key[0]} {key[1]}\n        生成: {a}\n        参考: {b}")


if __name__ == "__main__":
    main()
