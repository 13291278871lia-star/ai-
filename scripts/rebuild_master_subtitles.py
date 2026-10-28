#!/usr/bin/env python3
"""Rebuild all master-video captions from reviewed text and audio word timings."""

from __future__ import annotations

import argparse
import json
import re
from difflib import SequenceMatcher
from pathlib import Path

from docx import Document
from faster_whisper import WhisperModel
from opencc import OpenCC


PROJECT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path("/Users/choix/Desktop/ai工作平台/资料/高手分享/视频")
VIDEO_ROOT = PROJECT / "assets/training/masters/videos"
TRAD_ROOT = PROJECT / "assets/training/masters/subtitles"
SIMP_ROOT = PROJECT / "assets/training/masters/subtitles-simplified"
ALIGNMENT_ROOT = PROJECT / "assets/training/masters/alignment-v2"
DEFAULT_DOCX = Path("/Users/choix/Desktop/ai工作平台/资料/高手分享/高手分享字幕全文校对稿.docx")
PUNCTUATION = set("，。！？；：、,.!?;:（）()《》“”‘’…—- \\n\\t")
KEYWORDS = ("客戶", "保險", "保障", "目標", "行動", "成功", "成交", "見客", "專業", "學習", "團隊", "溝通", "分享", "人生", "工作")


def normalize_name(value: str) -> str:
    return re.sub(r"[^0-9a-z\u4e00-\u9fff]+", "", value.lower().replace("mp4", ""))


def catalogue_relative(video: Path) -> Path:
    relative = video.relative_to(SOURCE_ROOT)
    if relative.parts and relative.parts[0] == "新人起動 舊人翻撻":
        return Path("新人起動", *relative.parts[1:])
    return relative


def with_output_suffix(relative: Path, suffix: str) -> Path:
    """Append an output suffix without truncating dots that belong to a video title."""
    return Path(f"{relative}{suffix}")


def stamp(seconds: float) -> str:
    millis = max(0, round(seconds * 1000))
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def read_reviewed_sections(path: Path) -> dict[str, str]:
    """A Heading 1 starts a video; its first Heading 2 is the filename."""
    sections: dict[str, list[str]] = {}
    current: str | None = None
    awaiting_title = False
    for paragraph in Document(path).paragraphs:
        text = paragraph.text.strip()
        if paragraph.style.name == "Heading 1":
            current = None
            awaiting_title = True
            continue
        if awaiting_title and paragraph.style.name == "Heading 2" and text:
            current = text
            sections[current] = []
            awaiting_title = False
            continue
        if current and text:
            sections[current].append(text)
    return {title: "".join(lines) for title, lines in sections.items()}


def normalized_chars(text: str, converter: OpenCC) -> str:
    return "".join(char for char in converter.convert(text).lower() if char not in PUNCTUATION)


def word_timeline(words: list[dict], converter: OpenCC) -> tuple[str, list[tuple[float, float]]]:
    chars: list[str] = []
    times: list[tuple[float, float]] = []
    for word in words:
        normalized = normalized_chars(word["text"], converter)
        if not normalized:
            continue
        duration = max(0.05, word["end"] - word["start"])
        for index, char in enumerate(normalized):
            chars.append(char)
            times.append((word["start"] + duration * index / len(normalized), word["start"] + duration * (index + 1) / len(normalized)))
    return "".join(chars), times


def corrected_mapping(corrected: str, recognized: str) -> tuple[list[float | None], float]:
    mapping: list[float | None] = [None] * len(corrected)
    anchors: list[tuple[int, int]] = []
    matched = 0
    for block in SequenceMatcher(None, corrected, recognized, autojunk=False).get_matching_blocks():
        for offset in range(block.size):
            mapping[block.a + offset] = float(block.b + offset)
            anchors.append((block.a + offset, block.b + offset))
            matched += 1
    for index, value in enumerate(mapping):
        if value is not None or not anchors:
            continue
        left = next(((a, b) for a, b in reversed(anchors) if a < index), None)
        right = next(((a, b) for a, b in anchors if a > index), None)
        if left and right:
            ratio = (index - left[0]) / max(1, right[0] - left[0])
            mapping[index] = left[1] + ratio * (right[1] - left[1])
        elif left:
            mapping[index] = float(left[1] + index - left[0])
        elif right:
            mapping[index] = float(max(0, right[1] - (right[0] - index)))
    return mapping, matched / max(1, len(corrected))


def split_reviewed_text(text: str, limit: int = 22) -> list[tuple[int, int, str]]:
    output: list[tuple[int, int, str]] = []
    start = 0
    for cursor in range(1, len(text) + 1):
        length = cursor - start
        punctuation_break = text[cursor - 1] in "，。！？；"
        if (punctuation_break and length >= 7) or length >= limit:
            output.append((start, cursor, text[start:cursor].strip()))
            start = cursor
    if start < len(text):
        tail = text[start:].strip()
        if tail and output and len(tail) < 6:
            old_start, _, old_text = output.pop()
            output.append((old_start, len(text), old_text + tail))
        elif tail:
            output.append((start, len(text), tail))
    return [item for item in output if item[2]]


def align_text(text: str, words: list[dict], duration: float, converter: OpenCC) -> tuple[list[dict], float]:
    recognized, times = word_timeline(words, converter)
    corrected = normalized_chars(text, converter)
    mapping, confidence = corrected_mapping(corrected, recognized)
    source_to_norm: list[int | None] = []
    cursor = 0
    for char in converter.convert(text).lower():
        if char in PUNCTUATION:
            source_to_norm.append(None)
        else:
            source_to_norm.append(cursor)
            cursor += 1
    cues: list[dict] = []
    previous_end = 0.0
    for source_start, source_end, cue_text in split_reviewed_text(text):
        norm_indexes = [source_to_norm[i] for i in range(source_start, source_end) if source_to_norm[i] is not None]
        mapped = [mapping[i] for i in norm_indexes if i < len(mapping) and mapping[i] is not None]
        if mapped and times:
            first = min(len(times) - 1, max(0, round(min(mapped))))
            last = min(len(times) - 1, max(0, round(max(mapped))))
            start = max(previous_end, times[first][0] - 0.06)
            end = min(duration, start + 6.5, max(start + 0.65, times[last][1] + 0.16))
        else:
            start = previous_end
            end = min(duration, start + max(0.8, len(cue_text) / 5.5))
        if start - previous_end > 0.35:
            start = max(previous_end, start)
        if end <= start or (duration > 0 and start >= duration - 0.1):
            if cues:
                cues[-1]["text"] += cue_text
            continue
        cues.append({"start": round(start, 2), "end": round(end, 2), "text": cue_text})
        previous_end = end
    return cues, confidence


def make_summary(text: str, count: int = 6) -> list[str]:
    candidates: list[tuple[int, int, str]] = []
    for index, sentence in enumerate(re.split(r"(?<=[。！？])", text)):
        sentence = sentence.strip("，。 ")
        if not 14 <= len(sentence) <= 90:
            continue
        score = sum(2 for word in KEYWORDS if word in sentence) + min(len(sentence), 50) // 15
        candidates.append((score, -index, sentence + ("" if sentence.endswith(("。", "！", "？")) else "。")))
    selected: list[str] = []
    for _, _, sentence in sorted(candidates, reverse=True):
        if all(SequenceMatcher(None, sentence, old).ratio() < 0.58 for old in selected):
            selected.append(sentence)
        if len(selected) >= count:
            break
    if len(selected) < count:
        for sentence in re.split(r"[。！？]", text):
            sentence = sentence.strip()
            if len(sentence) >= 12 and sentence + "。" not in selected:
                selected.append(sentence[:88] + "。")
            if len(selected) >= count:
                break
    if len(selected) < count:
        phrases = [item.strip() for item in re.split(r"[，,；;]", text) if item.strip()]
        window = ""
        for phrase in phrases:
            window = f"{window}，{phrase}".strip("，")
            if len(window) < 24:
                continue
            candidate = window[:88] + "。"
            if candidate not in selected:
                selected.append(candidate)
            window = ""
            if len(selected) >= count:
                break
    if len(selected) < count and text:
        step = max(36, len(text) // count)
        for start in range(0, len(text), step):
            candidate = text[start:start + min(88, step)].strip("，。 ")
            if len(candidate) >= 12 and candidate + "。" not in selected:
                selected.append(candidate + "。")
            if len(selected) >= count:
                break
    return selected


def write_vtt(path: Path, cues: list[dict]) -> None:
    lines = ["WEBVTT", ""]
    for index, cue in enumerate(cues, 1):
        lines.extend([str(index), f"{stamp(cue['start'])} --> {stamp(cue['end'])}", cue["text"], ""])
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")


def words_from_vtt(path: Path) -> tuple[list[dict], float]:
    """Recover a character-level timing guide from an existing speech-timed VTT."""
    if not path.exists():
        return [], 0.0
    timestamp_re = re.compile(r"(\d{2}):(\d{2}):(\d{2})\.(\d{3})")

    def seconds(value: str) -> float:
        match = timestamp_re.fullmatch(value)
        if not match:
            return 0.0
        hours, minutes, secs, millis = map(int, match.groups())
        return hours * 3600 + minutes * 60 + secs + millis / 1000

    blocks = re.split(r"\n\s*\n", path.read_text(encoding="utf-8"))
    words: list[dict] = []
    duration = 0.0
    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        timing_index = next((i for i, line in enumerate(lines) if " --> " in line), None)
        if timing_index is None:
            continue
        start_text, end_text = lines[timing_index].split(" --> ", 1)
        start, end = seconds(start_text), seconds(end_text)
        text = "".join(lines[timing_index + 1:])
        chars = [char for char in text if char not in PUNCTUATION]
        if not chars:
            continue
        span = max(0.1, end - start)
        for index, char in enumerate(chars):
            words.append({"start": start + span * index / len(chars), "end": start + span * (index + 1) / len(chars), "text": char})
        duration = max(duration, end)
    return words, duration


def transcribe_words(model: WhisperModel, video: Path, cache: Path) -> tuple[list[dict], float]:
    if cache.exists():
        data = json.loads(cache.read_text(encoding="utf-8"))
        return data["words"], float(data["duration"])
    stream, info = model.transcribe(
        str(video), language="zh", beam_size=5, best_of=5, word_timestamps=True,
        vad_filter=True, vad_parameters={"min_silence_duration_ms": 250},
        condition_on_previous_text=True,
    )
    words = [{"start": float(word.start), "end": float(word.end), "text": word.word.strip()}
             for segment in stream for word in (segment.words or []) if word.word.strip()]
    data = {"duration": float(info.duration), "words": words}
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    return words, float(info.duration)


def sync_video_links(source_videos: list[Path]) -> None:
    expected = {catalogue_relative(video) for video in source_videos}
    for link in VIDEO_ROOT.rglob("*.mp4"):
        if link.relative_to(VIDEO_ROOT) not in expected or not link.exists():
            link.unlink(missing_ok=True)
    for video in source_videos:
        link = VIDEO_ROOT / catalogue_relative(video)
        link.parent.mkdir(parents=True, exist_ok=True)
        if link.is_symlink() or link.exists():
            link.unlink()
        link.symlink_to(video)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--docx", type=Path, default=DEFAULT_DOCX)
    parser.add_argument("--model", default="medium")
    parser.add_argument("--cache", type=Path, default=Path("/private/tmp/aia-whisper-models-v2"))
    parser.add_argument("--only", default="")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--sync-links", action="store_true")
    parser.add_argument("--links-only", action="store_true")
    parser.add_argument("--summaries-only", action="store_true")
    parser.add_argument("--reuse-vtt-timing", action="store_true")
    args = parser.parse_args()

    sections = read_reviewed_sections(args.docx)
    source_videos = sorted(SOURCE_ROOT.rglob("*.mp4"), key=lambda item: str(item))
    if args.sync_links:
        sync_video_links(source_videos)
        print(f"Synchronized {len(source_videos)} video links", flush=True)
    if args.links_only:
        return
    by_name = {normalize_name(video.stem): video for video in source_videos}
    jobs = [(title, by_name[normalize_name(title)], text) for title, text in sections.items() if normalize_name(title) in by_name]
    if args.only:
        jobs = [job for job in jobs if args.only in job[0]]
    if args.limit:
        jobs = jobs[:args.limit]
    print(f"Reviewed sections: {len(sections)}; videos: {len(source_videos)}; jobs: {len(jobs)}", flush=True)

    if args.summaries_only:
        to_simplified = OpenCC("t2s")
        updated = 0
        for title, video, reviewed_text in jobs:
            relative = catalogue_relative(video).with_suffix("")
            trad_json = TRAD_ROOT / with_output_suffix(relative, ".json")
            simp_json = SIMP_ROOT / with_output_suffix(relative, ".json")
            if not trad_json.exists() or not simp_json.exists():
                continue
            summary = make_summary(reviewed_text)
            trad_data = json.loads(trad_json.read_text(encoding="utf-8"))
            simp_data = json.loads(simp_json.read_text(encoding="utf-8"))
            trad_data["summary"] = summary
            simp_data["summary"] = [to_simplified.convert(item) for item in summary]
            trad_json.write_text(json.dumps(trad_data, ensure_ascii=False, indent=2), encoding="utf-8")
            simp_json.write_text(json.dumps(simp_data, ensure_ascii=False, indent=2), encoding="utf-8")
            updated += 1
        print(f"Updated highlights for {updated} videos", flush=True)
        return

    model = None if args.reuse_vtt_timing else WhisperModel(args.model, device="cpu", compute_type="int8", cpu_threads=8, download_root=str(args.cache))
    to_simplified = OpenCC("t2s")
    for number, (title, video, reviewed_text) in enumerate(jobs, 1):
        relative = catalogue_relative(video).with_suffix("")
        cache = ALIGNMENT_ROOT / with_output_suffix(relative, ".words.json")
        if cache.exists():
            words, duration = transcribe_words(model, video, cache)
        elif args.reuse_vtt_timing:
            words, duration = words_from_vtt(TRAD_ROOT / with_output_suffix(relative, ".vtt"))
            if not words:
                print(f"[{number}/{len(jobs)}] skipped {title}: no existing timing guide", flush=True)
                continue
        else:
            words, duration = transcribe_words(model, video, cache)
        cues, confidence = align_text(reviewed_text, words, duration, to_simplified)
        summary = make_summary(reviewed_text)
        trad_data = {"title": title, "language": "zh-Hant-HK", "notice": "字幕正文採用人工校對稿，時間軸由音頻逐詞對齊。", "summary": summary, "paragraphs": cues}
        simp_cues = [{**cue, "text": to_simplified.convert(cue["text"])} for cue in cues]
        simp_data = {"title": to_simplified.convert(title), "language": "zh-Hans-CN", "notice": "字幕正文采用人工校对稿，时间轴由音频逐词对齐。", "summary": [to_simplified.convert(item) for item in summary], "paragraphs": simp_cues}
        trad_json = TRAD_ROOT / with_output_suffix(relative, ".json")
        simp_json = SIMP_ROOT / with_output_suffix(relative, ".json")
        trad_json.parent.mkdir(parents=True, exist_ok=True)
        simp_json.parent.mkdir(parents=True, exist_ok=True)
        trad_json.write_text(json.dumps(trad_data, ensure_ascii=False, indent=2), encoding="utf-8")
        simp_json.write_text(json.dumps(simp_data, ensure_ascii=False, indent=2), encoding="utf-8")
        write_vtt(TRAD_ROOT / with_output_suffix(relative, ".vtt"), cues)
        write_vtt(SIMP_ROOT / with_output_suffix(relative, ".vtt"), simp_cues)
        print(f"[{number}/{len(jobs)}] {title}: {len(cues)} cues, alignment {confidence:.1%}", flush=True)


if __name__ == "__main__":
    main()
