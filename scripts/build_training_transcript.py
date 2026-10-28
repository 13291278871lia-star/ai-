#!/usr/bin/env python3
"""Convert local speech-recognition JSON into WebVTT and readable transcript JSON."""

import argparse
import json
import re
from pathlib import Path


def normalise(text):
    replacements = {
        "﹐": "，", ",": "，", "?": "？", "!": "！", "﹒": "。", "�": "",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    return re.sub(r"\s+", "", text).strip("，。 ")


def timestamp(seconds):
    milliseconds = max(0, round(seconds * 1000))
    hours, milliseconds = divmod(milliseconds, 3_600_000)
    minutes, milliseconds = divmod(milliseconds, 60_000)
    secs, milliseconds = divmod(milliseconds, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{milliseconds:03d}"


def split_cues(start, end, text, max_chars=24):
    pieces = [piece for piece in re.findall(r"[^，。！？；]+[，。！？；]?", text) if piece]
    cues, current = [], ""
    for piece in pieces:
        if current and len(current) + len(piece) > max_chars:
            cues.append(current)
            current = piece
        else:
            current += piece
    if current:
        cues.append(current)
    if not cues:
        return []
    weights = [max(1, len(cue)) for cue in cues]
    total_weight = sum(weights)
    duration = max(end - start, len(cues) * 1.2)
    cursor = start
    output = []
    for index, cue in enumerate(cues):
        cue_end = end if index == len(cues) - 1 else cursor + duration * weights[index] / total_weight
        output.append({"start": round(cursor, 2), "end": round(max(cursor + 1.0, cue_end), 2), "text": cue})
        cursor = cue_end
    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input_json")
    parser.add_argument("output_vtt")
    parser.add_argument("output_json")
    parser.add_argument("--title", required=True)
    parser.add_argument("--summary", action="append", default=[])
    args = parser.parse_args()

    raw = json.loads(Path(args.input_json).read_text(encoding="utf-8"))
    segments = []
    for item in raw.get("segments", []):
        text = normalise(item.get("text", ""))
        if text:
            segments.extend(split_cues(float(item["start"]), float(item["end"]), text))

    vtt_lines = ["WEBVTT", ""]
    for index, cue in enumerate(segments, 1):
        vtt_lines.extend([str(index), f"{timestamp(cue['start'])} --> {timestamp(cue['end'])}", cue["text"], ""])

    paragraphs = []
    bucket = []
    bucket_start = None
    bucket_end = None
    for item in raw.get("segments", []):
        text = normalise(item.get("text", ""))
        if not text:
            continue
        if bucket_start is None:
            bucket_start = float(item["start"])
        if bucket and float(item["end"]) - bucket_start > 55:
            paragraphs.append({"start": round(bucket_start, 2), "end": round(bucket_end, 2), "text": "".join(bucket)})
            bucket, bucket_start = [], float(item["start"])
        bucket.append(text + ("" if text.endswith(("。", "！", "？")) else "。"))
        bucket_end = float(item["end"])
    if bucket:
        paragraphs.append({"start": round(bucket_start, 2), "end": round(bucket_end, 2), "text": "".join(bucket)})

    transcript = {
        "title": args.title,
        "language": "zh-Hant-HK",
        "notice": "字幕由本機語音辨識整理；粵語口語、人名及專業詞彙可能需要人工覆核。",
        "summary": args.summary,
        "paragraphs": paragraphs,
    }
    Path(args.output_vtt).parent.mkdir(parents=True, exist_ok=True)
    Path(args.output_json).parent.mkdir(parents=True, exist_ok=True)
    Path(args.output_vtt).write_text("\n".join(vtt_lines), encoding="utf-8")
    Path(args.output_json).write_text(json.dumps(transcript, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
