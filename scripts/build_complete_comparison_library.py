#!/usr/bin/env python3
"""Mirror the complete comparison PDF library and build grouped case data."""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

from pypdf import PdfReader


PROJECT = Path(__file__).resolve().parents[1]
SOURCE = Path("/Users/choix/Desktop/ai工作平台/资料/产品对比")
DEST = PROJECT / "assets/comparison-sources"
OUTPUT = PROJECT / "src/comparison-generated-data.js"

CATEGORIES = {
    "友扣税": ("tax", "友扣稅", "自願醫保及延期年金"),
    "危疾": ("critical", "危疾", "危疾保障結構"),
    "AIA 健康系列": ("health", "AIA 健康系列", "危疾與高端醫療"),
    "個人意外": ("accident", "個人意外", "意外、住院入息及保費回贈"),
    "嚴重程度健康保障": ("severity-health", "嚴重程度健康保障", "癌症、傳染病及全面保障"),
    "定期壽險": ("term-life", "定期壽險", "大眾及高端定期壽險"),
    "投資相連計劃": ("linked", "投資相連計劃", "保障型及投資連繫壽險"),
    "終身壽險 及 儲蓄壽險": ("whole-savings", "終身及儲蓄壽險", "儲蓄、年金、入息、危疾及財富傳承"),
    "萬用壽險": ("universal-life", "萬用壽險", "高保額財富傳承及身故保障"),
    "醫療": ("medical", "醫療", "住院、癌症、危疾及醫療附加保障"),
}

CURATED_CATEGORY_IDS = {"tax", "critical", "health"}

FIELDS = [
    ("產品定位", [r"產品概[覽覌]\s*[:：]?", r"計劃種類\s*[:：]?", r"產品特點\s*[:：]?"]),
    ("目標客戶", [r"目標客戶\s*[:：]?"]),
    ("投保年齡／資格", [r"投保年齡\s*[:：]?", r"受保人年齡\s*[:：]?", r"最高投保年齡\s*[:：]?"]),
    ("保障年期", [r"保障年期\s*[:：]?", r"保障期\s*[:：]?"]),
    ("保費／繳費", [r"保費繳付年期\s*[:：]?", r"繳費年期\s*[:：]?", r"最低保費\s*[:：]?"]),
    ("保障／賠償重點", [r"保障範圍\s*[:：]?", r"保障項目\s*[:：]?", r"身故賠償\s*[:：]?", r"賠償\s*[:：]?"]),
    ("現金價值／退保", [r"退保價值\s*[:：]?", r"現金價值\s*[:：]?", r"退保\s*[:：]?"]),
    ("地域／貨幣", [r"地域保障\s*[:：]?", r"保單貨幣\s*[:：]?", r"貨幣選擇\s*[:：]?"]),
]


def clean(value: str, limit: int = 170) -> str:
    """Clean PDF text without presenting contents-page leaders as product data."""
    value = re.sub(r"(?:\.{3,}|…{2,}|·{3,}|_{3,}|-{5,})\s*\d*", " ", value)
    value = re.sub(r"\s+", " ", value).strip(" ：:|·•-.,，。")
    value = re.split(r"\s+(?:\d+|[ivx]+)[.)、]\s+", value, maxsplit=1, flags=re.I)[0].strip()
    value = re.split(
        r"(?:只供|For Internal|AIA Hong Kong|目錄|附錄|\b(?:II|III|IV|V|VI|VII|VIII|IX|X)\s*[.、])",
        value,
        maxsplit=1,
        flags=re.I,
    )[0].strip()
    if not value or len(re.sub(r"[^\w\u3400-\u9fff]", "", value)) < 4:
        return "資料暫未提供"
    return value[:limit].rstrip(" ：:|·•-.,，。") or "資料暫未提供"


def extract_text(path: Path) -> tuple[list[str], int]:
    reader = PdfReader(str(path), strict=False)
    pages = len(reader.pages)
    page_texts = []
    for page in reader.pages:
        lines = [re.sub(r"[ \t]+", " ", line).strip() for line in (page.extract_text() or "").splitlines()]
        page_texts.append("\n".join(line for line in lines if line))
    return page_texts, pages


def extract_field(pages: list[str], patterns: list[str]) -> str:
    # Search line by line so a field cannot absorb a contents page or a distant
    # section. A short continuation is allowed for labels whose value wraps.
    candidates: list[tuple[int, str]] = []
    for page_no, text in enumerate(pages):
        dot_ratio = sum(text.count(mark) for mark in ("...", "……", "···"))
        looks_like_toc = "目錄" in text[:250] or dot_ratio >= 4
        if looks_like_toc:
            continue
        lines = text.splitlines()
        for line_no, line in enumerate(lines):
            for pattern in patterns:
                match = re.search(pattern, line, re.I)
                if not match or match.start() > 16 or re.search(r"(?:\.{3,}|…{2,}|·{3,})", line):
                    continue
                parts = [line[match.end():].strip()]
                if len(parts[0]) < 18:
                    for following in lines[line_no + 1:line_no + 4]:
                        if re.match(r"^(?:\d+[.)、]?\s*)?(?:產品|目標|投保|受保|保障|保費|繳費|賠償|退保|現金價值|地域|貨幣|附錄|目錄)", following):
                            break
                        parts.append(following)
                        if len(" ".join(parts)) >= 100:
                            break
                value = clean(" ".join(part for part in parts if part))
                if value == "資料暫未提供":
                    continue
                if re.search(r"(?:解釋每節|銷售重點|常見問題|產品特點詳解|建議書系統|以上[「『]保證回報率|資料摘自|頁碼)", value):
                    continue
                alnum = re.sub(r"[^A-Za-z0-9\u3400-\u9fff]", "", value)
                if len(alnum) < 4 or re.match(r"^\d+(?:\s+\d+){2,}", value):
                    continue
                # Prefer a label at the start of a line and a compact, specific value.
                prefix_penalty = min(match.start(), 30)
                length_score = 80 - abs(min(len(value), 120) - 72)
                score = length_score - prefix_penalty - page_no // 10
                candidates.append((score, value))
    if candidates:
        return max(candidates, key=lambda item: item[0])[1]
    return "資料暫未提供"


def document_type(filename: str) -> str:
    if "常見問題" in filename or "FAQ" in filename.upper():
        return "常見問題／補充說明"
    if "比較" in filename or "資訊速遞" in filename:
        return "產品比較／市場參考"
    if "保費" in filename or "優惠" in filename:
        return "保費／推廣安排"
    if "停止銷售" in filename:
        return "推出及停售通告"
    if "推出" in filename or "新產品" in filename or "新推出" in filename:
        return "產品推出通告"
    if "資料" in filename or "概覽" in filename:
        return "產品資料／概覽"
    return "產品或營運資料"


def display_name(path: Path) -> str:
    name = path.stem.strip()
    name = re.sub(r"^(?:AIA\s*)?(?:新推出|推出|新產品\s*[-–—]?|更新的產品資料冊\s*)", "", name).strip()
    return name[:58]


def case_label(group: list[dict]) -> str:
    """Use recognizable source/product names instead of opaque group numbers."""
    names = []
    for item in group:
        name = re.sub(r"\s+", " ", item["name"]).strip(" -–—_、，")
        name = re.sub(r"(?:產品資料(?:冊)?|產品概覽|內部參考資料)$", "", name).strip(" -–—_、，")
        if name and name not in names:
            names.append(name)
    label = " ／ ".join(names)
    return label[:150] or "來源文件比較"


def case_groups(records: list[dict]) -> list[list[dict]]:
    buckets: dict[str, list[dict]] = {}
    for record in records:
        kind = record["kind"]
        buckets.setdefault(kind, []).append(record)
    groups: list[list[dict]] = []
    for kind, items in buckets.items():
        for start in range(0, len(items), 4):
            groups.append(items[start:start + 4])
    return groups


def make_case(category_id: str, label: str, group: list[dict], index: int) -> dict:
    products = [item["name"] for item in group]
    rows = [
        ["資料類型", *[item["kind"] for item in group]],
        ["文件頁數", *[f"{item['pages']} 頁" for item in group]],
    ]
    for field, _ in FIELDS:
        rows.append([field, *[item["fields"][field] for item in group]])
    rows.append(["原始文件", *[item["filename"] for item in group]])
    available = sum(value != "資料暫未提供" for item in group for value in item["fields"].values())
    return {
        "id": f"{category_id}-group-{index}",
        "label": case_label(group),
        "title": f"{label}：按原始文件并排比较",
        "type": group[0]["kind"],
        "source": "、".join(item["filename"] for item in group),
        "sourceFiles": [[item["filename"], item["url"]] for item in group],
        "products": products,
        "rows": rows,
        "highlights": [
            f"本组共 {len(group)} 份来源文件，已提取 {available} 个可核对字段。",
            "表格按文件原文提取；同名字段的口径可能因产品性质不同而异。",
        ],
        "cautions": [
            "资料未明确列示的栏目保留为“资料暂未提供”，不作推断。",
            "推出通告、常见问题和市场资料的生效日期可能不同，正式建议前须核对最新保单文件。",
        ],
    }


def main() -> None:
    stale_tax_alias = DEST / "友扣税"
    if stale_tax_alias.exists():
        shutil.rmtree(stale_tax_alias)
    generated = []
    supplemental: dict[str, list[dict]] = {}
    total = 0
    for folder_name, (category_id, label, description) in CATEGORIES.items():
        folder = SOURCE / folder_name
        records = []
        for source_path in sorted(folder.rglob("*.pdf")):
            relative = source_path.relative_to(SOURCE)
            if relative.parts[0] == "友扣税":
                relative = Path("友扣稅", *relative.parts[1:])
            dest_path = DEST / relative
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_path, dest_path)
            page_texts, pages = extract_text(source_path)
            records.append({
                "filename": source_path.name,
                "name": display_name(source_path),
                "kind": document_type(source_path.name),
                "pages": pages,
                "url": "/assets/comparison-sources/" + "/".join(relative.parts),
                "fields": {field: extract_field(page_texts, patterns) for field, patterns in FIELDS},
            })
            total += 1
        groups = case_groups(records)
        cases = [make_case(category_id, label, group, index + 1) for index, group in enumerate(groups)]
        if category_id in CURATED_CATEGORY_IDS:
            supplemental[category_id] = cases
        else:
            generated.append({"id": category_id, "label": label, "description": description, "cases": cases})
    payload = json.dumps(generated, ensure_ascii=False, indent=2)
    OUTPUT.write_text(
        "/* 由 scripts/build_complete_comparison_library.py 按原始 PDF 生成。 */\n"
        f"export const generatedComparisonSeries = {payload};\n"
        f"export const supplementalComparisonCases = {json.dumps(supplemental, ensure_ascii=False, indent=2)};\n",
        encoding="utf-8",
    )
    print(f"Mirrored {total} PDFs and generated {sum(len(item['cases']) for item in generated) + sum(len(items) for items in supplemental.values())} grouped cases.")


if __name__ == "__main__":
    main()
