#!/usr/bin/env python3
"""Import selected reviewed DOCX sections into transcript JSON and WebVTT."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

from docx import Document


PROJECT = Path(__file__).resolve().parents[1]
TRAD_ROOT = PROJECT / "assets/training/masters/subtitles"
SIMP_ROOT = PROJECT / "assets/training/masters/subtitles-simplified"
TIME_RE = re.compile(r"^\[(\d{2}):(\d{2})\]\s*(.*)$", re.S)

TARGETS = {
    "败部复活ep01 1/8": "敗部復活/败部复活ep01/败部复活ep01 1:8",
    "败部复活.ep01 2/8mp4": "敗部復活/败部复活ep01/败部复活.ep01 2:8mp4",
    "败部复活ep01 3/8": "敗部復活/败部复活ep01/败部复活ep01 3:8",
}

SUMMARIES = {
    "败部复活ep01 1/8": [
        "重新檢視目標與夢想，避免在長期工作中失去行動力。",
        "專注經營客戶、人際網絡與專業能力，讓投入轉化為實際成果。",
        "以熱誠和持續學習建立保險事業的長期能量。",
        "工作成果不會說謊；看似忙碌但缺乏專注，最終不會帶來生產力。",
        "真正想做好一件事，注意力會自然放在相關的人、問題與機會上。",
        "把學到的保險理念分享出去，讓專業知識轉化為幫助別人的能力。",
    ],
    "败部复活.ep01 2/8mp4": [
        "真正的改變來自自己，主管與環境只能提供支持。",
        "警惕負能量與老油條心態，保持目標感和生產力。",
        "經營個人狀態與專業表現，重新喚起事業夢想。",
        "不要把人生的希望推給下一代；自己的目標仍要由自己爭取。",
        "團隊可以鼓勵和陪伴，但突破恐懼、建立自信仍要靠本人完成。",
        "減少是非與互相比慘，把時間重新放回見客、成交和專業討論。",
    ],
    "败部复活ep01 3/8": [
        "長期逃避挑戰會消耗鬥志，解決問題才能累積信心。",
        "不要用輕鬆姿態掩飾恐懼，要坦然表達自己的保險專業。",
        "先展現值得信任與栽培的狀態，再以熱誠創造新的機會。",
        "成就感來自持續解決問題；長期逃避只會讓人更害怕面對挑戰。",
        "在未成功之前，也要先展現積極、可靠和願意付出的工作狀態。",
        "新的環境是重新建立形象的機會，熱誠會讓別人願意提供支持。",
    ],
}

START_TIMELINES = {
    "败部复活ep01 1/8": [3, 89, 170, 231, 342, 398, 444, 499, 557],
    "败部复活.ep01 2/8mp4": [7, 65, 345, 447, 507],
    "败部复活ep01 3/8": [0, 62, 124, 180, 229, 265, 331, 437, 465],
}


def stamp(seconds: float) -> str:
    millis = max(0, round(seconds * 1000))
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def split_text(text: str, limit: int = 24) -> list[str]:
    pieces = [p for p in re.findall(r"[^，。！？；]+[，。！？；]?", text) if p]
    output: list[str] = []
    current = ""
    for piece in pieces:
        if current and len(current) + len(piece) > limit:
            output.append(current)
            current = piece
        else:
            current += piece
    if current:
        output.append(current)
    return output or [text]


def character_map() -> dict[str, str]:
    votes: dict[str, Counter[str]] = defaultdict(Counter)
    for trad_path in TRAD_ROOT.rglob("*.json"):
        relative = trad_path.relative_to(TRAD_ROOT)
        simp_path = SIMP_ROOT / relative
        if not simp_path.exists():
            continue
        try:
            trad = json.loads(trad_path.read_text(encoding="utf-8"))
            simp = json.loads(simp_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        trad_values = list(trad.get("summary", [])) + [p.get("text", "") for p in trad.get("paragraphs", [])]
        simp_values = list(simp.get("summary", [])) + [p.get("text", "") for p in simp.get("paragraphs", [])]
        for left, right in zip(trad_values, simp_values):
            if len(left) != len(right):
                continue
            for source, target in zip(left, right):
                votes[source][target] += 1
    return {source: counts.most_common(1)[0][0] for source, counts in votes.items()}


def simplify(text: str, mapping: dict[str, str]) -> str:
    return "".join(mapping.get(char, char) for char in text)


def read_sections(docx_path: Path) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {}
    current = ""
    for paragraph in Document(docx_path).paragraphs:
        text = paragraph.text.strip()
        if paragraph.style.name == "Heading 2":
            current = text
            if current in TARGETS:
                sections[current] = []
            continue
        if paragraph.style.name.startswith("Heading"):
            continue
        if current in TARGETS and text:
            sections[current].append(text)
    return sections


def reviewed_paragraphs(heading: str, lines: list[str], old: dict) -> list[dict]:
    old_paragraphs = old.get("paragraphs", [])
    timeline = START_TIMELINES.get(heading, [])
    output: list[dict] = []
    for index, line in enumerate(lines):
        match = TIME_RE.match(line)
        if index < len(timeline):
            start = timeline[index]
            text = match.group(3).strip() if match else line.strip()
        elif match:
            start = int(match.group(1)) * 60 + int(match.group(2))
            text = match.group(3).strip()
        else:
            start = float(old_paragraphs[index].get("start", 0)) if index < len(old_paragraphs) else (output[-1]["end"] if output else 0)
            text = line.strip()
        old_end = float(old_paragraphs[index].get("end", start + 45)) if index < len(old_paragraphs) else start + 45
        output.append({"start": float(start), "end": max(float(start) + 1, old_end), "text": text})
    for index, item in enumerate(output[:-1]):
        item["end"] = max(item["start"] + 1, output[index + 1]["start"] - 0.2)
    return output


def write_vtt(path: Path, paragraphs: list[dict]) -> None:
    cues: list[dict] = []
    for item in paragraphs:
        parts = split_text(item["text"])
        duration = max(float(item["end"]) - float(item["start"]), len(parts))
        weights = [max(1, len(part)) for part in parts]
        total = sum(weights)
        cursor = float(item["start"])
        for index, part in enumerate(parts):
            end = float(item["end"]) if index == len(parts) - 1 else cursor + duration * weights[index] / total
            cues.append({"start": cursor, "end": max(cursor + 0.8, end), "text": part})
            cursor = end
    lines = ["WEBVTT", ""]
    for index, cue in enumerate(cues, 1):
        lines.extend([str(index), f"{stamp(cue['start'])} --> {stamp(cue['end'])}", cue["text"], ""])
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("docx")
    args = parser.parse_args()
    sections = read_sections(Path(args.docx))
    missing = [title for title in TARGETS if not sections.get(title)]
    if missing:
        raise SystemExit(f"Missing reviewed sections: {', '.join(missing)}")

    mapping = character_map()
    for heading, relative in TARGETS.items():
        trad_json = TRAD_ROOT / f"{relative}.json"
        trad_vtt = TRAD_ROOT / f"{relative}.vtt"
        simp_json = SIMP_ROOT / f"{relative}.json"
        simp_vtt = SIMP_ROOT / f"{relative}.vtt"
        old = json.loads(trad_json.read_text(encoding="utf-8"))
        paragraphs = reviewed_paragraphs(heading, sections[heading], old)
        summary = SUMMARIES[heading]
        trad_data = {
            "title": old.get("title", heading),
            "language": "zh-Hant-HK",
            "notice": "字幕文本已經人工校對；請結合視頻原聲作最終確認。",
            "summary": summary,
            "paragraphs": paragraphs,
        }
        simp_data = {
            "title": simplify(trad_data["title"], mapping),
            "language": "zh-Hans-CN",
            "notice": simplify(trad_data["notice"], mapping),
            "summary": [simplify(item, mapping) for item in summary],
            "paragraphs": [{**item, "text": simplify(item["text"], mapping)} for item in paragraphs],
        }
        trad_json.write_text(json.dumps(trad_data, ensure_ascii=False, indent=2), encoding="utf-8")
        simp_json.write_text(json.dumps(simp_data, ensure_ascii=False, indent=2), encoding="utf-8")
        write_vtt(trad_vtt, paragraphs)
        write_vtt(simp_vtt, simp_data["paragraphs"])
        print(f"Updated {heading}: {len(paragraphs)} paragraphs")


if __name__ == "__main__":
    main()
