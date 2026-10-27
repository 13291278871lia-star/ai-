"""Build a source-grounded 11-page client deck inside the supplied GF template."""
from io import BytesIO
from pathlib import Path
from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.util import Inches, Pt

BURG = "681A1A"; GOLD = "8A7A49"; PALE = "F7F1E7"; INK = "1F1715"; GREY = "6E747C"; WHITE = "FFFFFF"

def _rgb(x): return RGBColor.from_string(x)

def _clear(slide):
    for shape in list(slide.shapes):
        shape._element.getparent().remove(shape._element)
    bg = slide.background.fill; bg.solid(); bg.fore_color.rgb = _rgb(WHITE)

def _box(slide, x,y,w,h, fill=WHITE, line=None, radius=True):
    shp=slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    shp.fill.solid(); shp.fill.fore_color.rgb=_rgb(fill)
    shp.line.color.rgb=_rgb(line or fill)
    return shp

def _text(slide, text, x,y,w,h, size=18, color=INK, bold=False, align=PP_ALIGN.LEFT, font="Arial Unicode MS", valign=MSO_ANCHOR.MIDDLE):
    shp=slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h)); tf=shp.text_frame; tf.clear(); tf.word_wrap=True; tf.vertical_anchor=valign; tf.margin_left=tf.margin_right=Inches(.04); tf.margin_top=tf.margin_bottom=Inches(.02)
    p=tf.paragraphs[0]; p.text=str(text); p.alignment=align
    for r in p.runs: r.font.name=font; r.font.size=Pt(size); r.font.bold=bold; r.font.color.rgb=_rgb(color)
    return shp

def _title(slide, kicker, title, subtitle=""):
    _text(slide,kicker.upper(),.55,.28,5,.25,10,BURG,True)
    _text(slide,title,.55,.58,12.1,.62,26,INK,True)
    if subtitle: _text(slide,subtitle,.58,1.20,12,.35,11,GREY)
    _box(slide,.55,1.58,1.0,.05,GOLD,radius=False)

def _foot(slide, source, fx=None):
    fxtext=f"｜人民币按 1 美元 = {fx:g} 人民币展示" if fx else ""
    _text(slide,f"资料来源：{source}{fxtext}｜数值仅供参考，详见计划书。",.55,7.12,12.2,.22,7,GREY)

def _table(slide, data, x,y,w,h, widths=None, font=12):
    rows=len(data); cols=len(data[0]); shape=slide.shapes.add_table(rows,cols,Inches(x),Inches(y),Inches(w),Inches(h)); tbl=shape.table
    if widths:
        for i,cw in enumerate(widths): tbl.columns[i].width=Inches(cw)
    for ri,row in enumerate(data):
        for ci,val in enumerate(row):
            cell=tbl.cell(ri,ci); cell.text=str(val); cell.margin_left=cell.margin_right=Inches(.05); cell.margin_top=cell.margin_bottom=Inches(.03)
            cell.fill.solid(); cell.fill.fore_color.rgb=_rgb(GOLD if ri==0 else ("FBF8F2" if ri%2 else WHITE))
            cell.vertical_anchor=MSO_ANCHOR.MIDDLE
            for p in cell.text_frame.paragraphs:
                p.alignment=PP_ALIGN.CENTER
                for r in p.runs: r.font.name="Arial Unicode MS"; r.font.size=Pt(font); r.font.bold=(ri==0); r.font.color.rgb=_rgb(WHITE if ri==0 else INK)
    return shape

def _metric(slide,label,value,x,y,w=2.6):
    _box(slide,x,y,w,.9,PALE,GOLD)
    _text(slide,label,x+.15,y+.12,w-.3,.22,10,GREY)
    _text(slide,value,x+.15,y+.37,w-.3,.38,19,BURG,True)

def _bullet(slide, title, body, x,y,w=5.7,h=.82):
    _box(slide,x,y,w,h,"FBF8F2","E7DCC8")
   _text(slide,title,x+.18,y+.10,w-.36,.23,13,BURG,True)
    _text(slide,body,x+.18,y+.35,w-.36,h-.42,10,INK)

def _move_slide(prs, old, new):
    ids=prs.slides._sldIdLst; item=ids[old]; ids.remove(item); ids.insert(new,item)

def build_template_ppt(profile, rows, template_path):
    prs=Presentation(str(template_path)); source=str(profile.get("source") || "亊传计划书"��110]
    fx=float(profile.get("fx") or 6.8); premium=float(profile.get("premium") or 0); levy=float(profile.get("levy") or 0); years=int(profile.get("years") or 1)
    age=int(profile.get("age") or 0); product=str(profile.get("product") or "俞险计划"); name=str(profile.get("insured") or "�保人"); sum_assured=float(profile.get("sumAssured") or 0)
    by={int(r["year"]):r for r in rows}; milestones=[y for y in (20,30,40,50) if y in by] or [int(r["year"]) for r in rows[-4:]]
    total_outlay=premium*years+levy
    asset=Path(template_path).parent.parent/"generated"
    img1=asset/"wealth-legacy-family.png"; img2=asset/"long-term-planning.png"
    while len(prs.slides)<11: prs.slides.add_slide(prs.slide_layouts[6])

    # 1 — Overview
    s=prs.slides[0]; _clear(s)
    _text(s,"香港友邦保险",.45,.35,3.0,.45,26,INK,True); _text(s,product,3.0,.35,9.7,.5,25,GOLD,True)
    _text(s,"终身保障与长期财富传承规划",.5,.95,7,.28,12,GREY)
    _text(s,"[ 计划重点 ]",.5,1.65,4.5,.45,23,INK,True); _text(s,"[ 预期现金价值 ]",5.4,1.65,7.2,.45,23,INK,True)
    _metric(s,"整付保费",f"USD {premium:,.0f}",.65,2.35,3.9); _metric(s,"首期总支出",f"USD {total_outlay:,.2f}",.65,3.45,3.9)
    _metric(s,"基本保额",f"USD {sum_assured:,.0f}" if sum_assured else "计划书提取中",.65,4.55,3.9)
    _text(s,f"{name}｜{age}岁｜美元保单｜{'整付保费' if years==1 else str(years)+'年供款'}",.7,5.65,4.0,.65,13,INK,True)
    data=[["保单年末","美元","人民币","年化 IRR"]]
    for y in milestones:
        r=by[y]; data.append([f"{y}年 / {age+y}岁",f"{r['usd']:,.0f}",f"{r['usd']*fx:,.0f}",f"{r['rate']*100:.2f}%"])
    _table(s,data,5.35,2.3,7.45,3.75,[1.55,1.75,2.25,1.9],12)
    _text(s,"IRR 以整付保费及保费征费为初始现金流，各年为独立退保情景。",5.45,6.25,7.2,.3,9,GREY)
    _foot(s,source,fx)

    # 2 — Editable IRR chart
    s=prs.slides[1]; _clear(s); _title(s,"RETURN PROFILE","不同年份的 IRR 走势",f"{name} · {age}岁投保 · 初始支出 USD {total_outlay:,.2f}")
    chart_rows=[by[y] for y in milestones]
    cd=CategoryChartData(); cd.categories=[f"{int(r['year'])}年" for r in chart_rows]; cd.add_series("年化 IRR",[float(r["rate"])*100 for r in chart_rows])
    chart=s.shapes.add_chart(XL_CHART_TYPE.LINE_MARKERS,Inches(.8),Inches(1.9),Inches(11.8),Inches(4.55),cd).chart
    chart.has_legend=False; chart.value_axis.tick_labels.number_format='0.0"%"'; chart.value_axis.minimum_scale=0; chart.value_axis.has_major_gridlines=True; chart.category_axis.tick_labels.font.size=Pt(8); chart.value_axis.tick_labels.font.size=Pt(9)
    series=chart.series[0]; series.format.line.color.rgb=_rgb(BURG); series.format.line.width=Pt(2.5); series.marker.size=7
    _text(s,"退保价值包含非保证终期分红，IRR 并非保证回报。",.82,6.55,11.5,.3,10,BURG,True); _foot(s,source)

    # 3–11 — Replace placeholders across all remaining slides.
    # The template was designed for "环宇盈活" with withdrawal scenarios.
    # For products without withdrawal data (e.g. 财富恒裕3 整付), we replace
    # what we can from the proposal and mark unknown amounts clearly.
    insured_label=name.replace(" ", "")
    pay_term_cn="整付保费" if years==1 else f"{years}年供款"
    pay_term_tw="整付保費" if years==1 else f"{years}年供款"

    # Compute values available from the proposal data
    irr_20=by.get(20,{}).get("rate",0); irr_30=by.get(30,{}).get("rate",0)
    irr_40=by.get(40,{}).get("rate",0); irr_50=by.get(50,{}).get("rate",0)
    usd_50=by.get(50,{}).get("usd",0); rmb_50=usd_50*fx
    total_paid=premium*years
    multiple=f"{usd_50/total_paid:.1f}" if total_paid>0 and usd_50 else "（资料暂未提供）"

    # ── Universal replacements (safe for ALL slides 3-11) ──
    # Product name, payment term, age, IRR, multiples — no risk of
    # accidentally filling promotion/rebate amounts.
    universal_replacements = [
        # Product name — template uses 环宇盈活, replace with actual product
        ("环宇盈活储蓄计划 --- 提取概览", f"{product} — 提取概览"),
        ("环宇盈活储蓄计划", product),
        ("环宇盈活", product),
        # Payment term — all variants (longer first)
        ("（5年缴费）", f"（{pay_term_cn}）"),
        ("（5年繳費）", f"（{pay_term_tw}）"),
        ("(5年缴费)", f"({pay_term_cn})"),
        ("(5年繳費)", f"({pay_term_tw})"),
        ("5年缴费", pay_term_cn),
        ("5年繳費", pay_term_tw),
        # Insured name / age — all spacing variants (longer first)
        ("XX岁先生/小姐", f"{age}岁{insured_label}"),
        ("XX歲先生/小姐", f"{age}歲{insured_label}"),
        ("XX岁 先生/小姐", f"{age}岁 {insured_label}"),
        ("XX歲 先生/小姐", f"{age}歲 {insured_label}"),
        ("XX岁先生", f"{age}岁{insured_label}"),
        ("XX歲先生", f"{age}歲{insured_label}"),
        ("XX岁 小女孩", f"{age}岁{insured_label}"),
        ("XX岁小女孩", f"{age}岁{insured_label}"),
        ("xx-xx岁", f"{age}-{age+30}岁"),
        ("XX-XX岁", f"{age}-{age+30}岁"),
        ("XX岁", f"{age}岁"),
        ("XX歲", f"{age}歲"),
        ("xx岁", f"{age}岁"),
        ("XX年", f"{age}年"),
        # IRR placeholders — try multiple newline variants (\n, \x0b, none)
        ("实际回报年利率\nXX%", f"实际回报年利率\n{irr_50*100:.2f}%"),
        ("实际回报年利率\x0bXX%", f"实际回报年利率\x0b{irr_50*100:.2f}%"),
        ("实际回报年利率\n%", f"实际回报年利率\n{irr_50*100:.2f}%"),
        ("实际回报年利率\x0b%", f"实际回报年利率\x0b{irr_50*100:.2f}%"),
        ("实际回报年利率%", f"实际回报年利率{irr_50*100:.2f}%"),
        ("提取的年利率为XXX%", f"提取的年利率为{irr_30*100:.2f}%"),
        ("提取的年利率为XX%", f"提取的年利率为{irr_30*100:.2f}%"),
        # 倍数 placeholder
        ("XXX倍", f"{multiple}倍"),
        ("XX倍", f"{multiple}倍"),
        ("3.41倍", f"{multiple}倍"),
        ("33倍", f"{multiple}倍"),
        # Hardcoded example numbers from template
        ("8,273,520美元", f"{usd_50:,.0f}美元" if usd_50 else "美元（资料暂未提供）"),
        ("57,087,288人民币", f"{rmb_50:,.0f}人民币" if rmb_50 else "人民币（资料暂未提供）"),
        # Amount — "美元 XXX" with space (timeline slides)
        ("美元 XXX", f"美元{usd_50:,.0f}" if usd_50 else "美元（资料暂未提供）"),
        ("人民币XXX", f"人民币{rmb_50:,.0f}" if rmb_50 else "人民币（资料暂未提供）"),
        # Amount — "美元XXX" no space (prepaid interest slides 8-9: premium amount).
        # Safe for universal list: promotion slides use "美元XX" (2 X's), not 3.
        ("美元XXX", f"美元{premium:,.0f}" if premium else "美元（资料暂未提供）"),
        # Amount — space-separated "美元 (人民币)" variants (timeline slides).
        # Only patterns with at least one SPACE between 美元 and ( are included
        # here; the \x0b-only variant "美元\x0b(人民币)" (no space) appears on
        # promotion summary slides and must NOT be filled with the 50-year value.
        ("美元 (人民币)", f"美元{usd_50:,.0f} (人民币{rmb_50:,.0f})" if usd_50 else "美元（资料暂未提供） (人民币（资料暂未提供）)"),
        ("美元 \x0b(人民币)", f"美元{usd_50:,.0f} \x0b(人民币{rmb_50:,.0f})" if usd_50 else "美元（资料暂未提供） \x0b(人民币（资料暂未提供）)"),
        ("美元\x0b (人民币)", f"美元{usd_50:,.0f}\x0b (人民币{rmb_50:,.0f})" if usd_50 else "美元（资料暂未提供）\x0b (人民币（资料暂未提供）)"),
        # Slide 10 — 优惠总金额 label
        ("优惠的金额", "优惠金额（需填入推广数据）"),
    ]

    # ── Timeline-only amount replacements (slides 3-6 only) ──
    # These patterns also appear on promotion slides (7-10) where the amounts
    # refer to rebate/coupon values, NOT the 50-year surrender value. Applying
    # them only to timeline slides avoids corrupting promotion data.
    timeline_amount_replacements = [
        # "美元XX" / "人民币XX" — 2-X variants (slide 3: "美元XX( 人民币XX)")
        ("美元XX", f"美元{usd_50:,.0f}" if usd_50 else "美元（资料暂未提供）"),
        ("人民币XX", f"人民币{rmb_50:,.0f}" if rmb_50 else "人民币（资料暂未提供）"),
        # "美元(人民币)" no space, no X (slide 3: "提取 美元(人民币)")
        ("美元(人民币)", f"美元{usd_50:,.0f}(人民币{rmb_50:,.0f})" if usd_50 else "美元（资料暂未提供）(人民币（资料暂未提供）)"),
    ]

    def _apply(text, *lists):
        result = text
        for lst in lists:
            for old, new in lst:
                result = result.replace(old, new)
        return result

    def _replace_text_frame(shape, *repl_lists):
        """Replace placeholders in a text frame, handling multi-run text.
        Gets full text, applies replacements, writes back preserving first-run formatting."""
        if not getattr(shape, "has_text_frame", False):
            return False
        original = shape.text
        updated = _apply(original, *repl_lists)
        if updated == original:
            return False
        tf = shape.text_frame
        for p in list(tf.paragraphs)[1:]:
            p._p.getparent().remove(p._p)
        first_p = tf.paragraphs[0]
        font_name = "Arial Unicode MS"
        font_size = Pt(12)
        font_bold = False
        if first_p.runs:
            r0 = first_p.runs[0]
            font_name = r0.font.name or font_name
            font_size = r0.font.size or font_size
            font_bold = r0.font.bold or font_bold
        first_p.text = updated
        for r in first_p.runs:
            r.font.name = font_name
            r.font.size = font_size
            r.font.bold = font_bold
        return True

    def _replace_table_cells(shape, *repl_lists):
        """Replace placeholders in all table cells."""
        if not getattr(shape, "has_table", False):
            return
        for row in shape.table.rows:
            for cell in row.cells:
                for paragraph in cell.text_frame.paragraphs:
                    for run in paragraph.runs:
                        run.text = _apply(run.text, *repl_lists)

    # Apply replacements:
    #   Slides 3-6 (timeline): universal + timeline-specific amounts
    #   Slides 7-11 (promotion/payment/bank): universal only — avoids
    #     filling promotion rebate/coupon XX placeholders with surrender values
    for idx, slide in enumerate(list(prs.slides)[2:], start=3):
        if idx <= 6:
            repl = (universal_replacements, timeline_amount_replacements)
        else:
            repl = (universal_replacements,)
        for shape in slide.shapes:
            _replace_text_frame(shape, *repl)
            _replace_table_cells(shape, *repl)
            # Update footer source text
            if getattr(shape, "has_text_frame", False) and "以美元兑人民币汇率" in shape.text:
                for paragraph in shape.text_frame.paragraphs:
                    for run in paragraph.runs:
                        if "以美元兑人民币汇率" in run.text:
                            run.text = f"*以美元兑人民币汇率{fx}计算* 以上数据只供参考, 详情请参阅建议书。来源：{source}"

    bio=BytesIO(); prs.save(bio); return bio.getvalue()
