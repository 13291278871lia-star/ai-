#!/usr/bin/env python3
"""Generate local Traditional/Simplified Chinese captions and transcript JSON."""

from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path

from faster_whisper import BatchedInferencePipeline, WhisperModel
from opencc import OpenCC


PROJECT = Path(__file__).resolve().parents[1]
VIDEO_ROOT = PROJECT / "assets/training/masters/videos"
TRAD_ROOT = PROJECT / "assets/training/masters/subtitles"
SIMP_ROOT = PROJECT / "assets/training/masters/subtitles-simplified"
REVIEW_OUTPUT = PROJECT / "assets/training/masters/字幕全文_待確認標記.md"
CURRENT_OUTPUT = PROJECT / "assets/training/masters/transcription-current.json"


def publish_current(number: int, total: int, video: Path, status: str, message: str = "") -> None:
    CURRENT_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "current": number,
        "total": total,
        "name": video.stem,
        "status": status,
        "message": message,
    }
    temp = CURRENT_OUTPUT.with_suffix(".tmp")
    temp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    temp.replace(CURRENT_OUTPUT)


def stamp(seconds: float) -> str:
    millis = max(0, round(seconds * 1000))
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def words_text(words: list[dict], mark_uncertain: bool = True) -> str:
    output = []
    uncertain = []
    for word in words:
        text = word["word"]
        probability = word.get("probability")
        if mark_uncertain and probability is not None and probability < 0.12:
            uncertain.append(text.strip())
            output.append(f"【待確認：{text.strip()}】")
        else:
            output.append(text)
    return "".join(output).strip()


def caption_cues(segments: list[dict]) -> list[dict]:
    cues: list[dict] = []
    for segment in segments:
        words = segment.get("words") or []
        if not words:
            cues.append(segment)
            continue
        group: list[dict] = []
        for word in words:
            group.append(word)
            text = words_text(group, mark_uncertain=False)
            duration = group[-1]["end"] - group[0]["start"]
            ends_sentence = bool(re.search(r"[。！？!?；;]$", text))
            if len(text) >= 20 or duration >= 5.5 or (ends_sentence and len(text) >= 8):
                cues.append({"start": group[0]["start"], "end": group[-1]["end"], "text": words_text(group)})
                group = []
        if group:
            cues.append({"start": group[0]["start"], "end": group[-1]["end"], "text": words_text(group)})
    return cues


def write_vtt(path: Path, segments: list[dict], converter: OpenCC) -> None:
    lines = ["WEBVTT", ""]
    for index, segment in enumerate(caption_cues(segments), 1):
        text = converter.convert(segment["text"].strip())
        if not text:
            continue
        lines.extend([
            str(index),
            f"{stamp(segment['start'])} --> {stamp(segment['end'])}",
            text,
            "",
        ])
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")


def paragraphs(segments: list[dict], converter: OpenCC) -> list[dict]:
    output: list[dict] = []
    group: list[dict] = []
    for segment in segments:
        group.append(segment)
        duration = group[-1]["end"] - group[0]["start"]
        chars = sum(len(item["text"]) for item in group)
        if duration >= 42 or chars >= 180:
            output.append({
                "start": round(group[0]["start"], 2),
                "end": round(group[-1]["end"], 2),
                "text": converter.convert("".join(words_text(item.get("words") or []) or item["text"].strip() for item in group)),
            })
            group = []
    if group:
        output.append({
            "start": round(group[0]["start"], 2),
            "end": round(group[-1]["end"], 2),
            "text": converter.convert("".join(words_text(item.get("words") or []) or item["text"].strip() for item in group)),
        })
    return output


def extract_summary(items: list[dict]) -> list[str]:
    """Pick short verbatim highlights from the transcript; never invent content."""
    keywords = ("客戶", "保險", "保障", "需要", "分享", "學習", "成功", "成交", "見客", "產品", "目標", "溝通", "行動")
    candidates = []
    for index, item in enumerate(items):
        text = re.sub(r"\s+", "", str(item.get("text", ""))).strip()
        if not text:
            continue
        sentence = next((part for part in re.split(r"(?<=[。！？!?])", text) if len(part) >= 12), text)
        score = sum(1 for keyword in keywords if keyword in sentence)
        candidates.append((score, -index, sentence[:88]))
    selected = sorted(candidates, reverse=True)[:4]
    return [text for _, _, text in selected]


def write_json(path: Path, title: str, language: str, segments: list[dict], converter: OpenCC) -> None:
    transcript_paragraphs = paragraphs(segments, converter)
    data = {
        "title": title,
        "language": language,
        "notice": "字幕由本機離線語音辨識整理；粵語口語、人名及專業詞彙可能需要人工覆核。",
        "summary": extract_summary(transcript_paragraphs),
        "paragraphs": transcript_paragraphs,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def refresh_summary(path: Path) -> None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if data.get("summary") or not data.get("paragraphs"):
            return
        data["summary"] = extract_summary(data["paragraphs"])
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    except (OSError, ValueError):
        return


def write_review_document(videos: list[Path]) -> None:
    lines = [
        "# 高手分享｜字幕全文及待確認標記",
        "",
        "说明：`【待確認：…】` 表示离线语音识别把握较低，请按视频原声修订；其余内容也建议在正式使用前抽查。",
        "",
    ]
    for video in videos:
        _, transcript_path, _, _ = output_paths(video)
        if not transcript_path.exists():
            continue
        try:
            data = json.loads(transcript_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        lines.extend([f"## {video.stem}", ""])
        for item in data.get("paragraphs", []):
            total = max(0, int(float(item.get("start", 0))))
            minute, second = divmod(total, 60)
            lines.append(f"**[{minute:02d}:{second:02d}]** {item.get('text', '')}")
            lines.append("")
    REVIEW_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    REVIEW_OUTPUT.write_text("\n".join(lines), encoding="utf-8")


def output_paths(video: Path) -> tuple[Path, Path, Path, Path]:
    relative = video.relative_to(VIDEO_ROOT).with_suffix("")
    trad_base = TRAD_ROOT / relative
    simp_base = SIMP_ROOT / relative
    return (
        Path(f"{trad_base}.vtt"),
        Path(f"{trad_base}.json"),
        Path(f"{simp_base}.vtt"),
        Path(f"{simp_base}.json"),
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="small")
    parser.add_argument("--cache", default="/private/tmp/aia-whisper-models")
    parser.add_argument("--only", default="")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--batch-size", type=int, default=8)
    args = parser.parse_args()

    os.environ.setdefault("HF_HOME", args.cache)
    videos = sorted(VIDEO_ROOT.rglob("*.mp4"), key=lambda path: str(path))
    if args.only:
        videos = [path for path in videos if args.only in path.name]
    if args.limit:
        videos = videos[: args.limit]
    print(f"Preparing {len(videos)} video(s)", flush=True)

    model = WhisperModel(args.model, device="cpu", compute_type="int8", cpu_threads=max(4, os.cpu_count() or 4), download_root=args.cache)
    transcriber = BatchedInferencePipeline(model=model)
    to_traditional = OpenCC("s2hk")
    to_simplified = OpenCC("t2s")

    for number, video in enumerate(videos, 1):
        if not video.exists():
            publish_current(number, len(videos), video, "missing", "源视频路径失效，已跳过")
            print(f"[{number}/{len(videos)}] missing source {video}", flush=True)
            continue
        trad_vtt, trad_json, simp_vtt, simp_json = output_paths(video)
        targets = (trad_vtt, trad_json, simp_vtt, simp_json)
        if not args.overwrite and all(path.exists() for path in targets):
            refresh_summary(trad_json)
            refresh_summary(simp_json)
            print(f"[{number}/{len(videos)}] skip {video.name}", flush=True)
            continue
        print(f"[{number}/{len(videos)}] transcribing {video}", flush=True)
        publish_current(number, len(videos), video, "transcribing")
        try:
            segment_stream, info = transcriber.transcribe(
                str(video.resolve()),
                language="zh",
                batch_size=args.batch_size,
                beam_size=1,
                word_timestamps=True,
                vad_filter=True,
                vad_parameters={"min_silence_duration_ms": 500},
                condition_on_previous_text=True,
            )
            segments = [
                {
                    "start": float(segment.start),
                    "end": float(segment.end),
                    "text": segment.text,
                    "words": [
                        {"start": float(word.start), "end": float(word.end), "word": word.word, "probability": getattr(word, "probability", None)}
                        for word in (segment.words or [])
                        if word.start is not None and word.end is not None
                    ],
                }
                for segment in segment_stream
                if segment.text.strip()
            ]
        except Exception as error:
            publish_current(number, len(videos), video, "failed", str(error))
            print(f"[{number}/{len(videos)}] failed {video}: {error}", flush=True)
            continue
        title = video.stem
        write_vtt(trad_vtt, segments, to_traditional)
        write_json(trad_json, title, "zh-Hant-HK", segments, to_traditional)
        write_vtt(simp_vtt, segments, to_simplified)
        write_json(simp_json, title, "zh-Hans-CN", segments, to_simplified)
        publish_current(number, len(videos), video, "completed")
        print(f"[{number}/{len(videos)}] wrote {len(segments)} caption segments ({info.duration:.1f}s)", flush=True)
    write_review_document(videos)
    print(f"Wrote review document: {REVIEW_OUTPUT}", flush=True)


if __name__ == "__main__":
    main()
