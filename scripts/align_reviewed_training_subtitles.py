#!/usr/bin/env python3
"""Force-align the three reviewed 敗部復活 ep01 transcripts to their audio."""

from __future__ import annotations

import json
import re
from difflib import SequenceMatcher
from pathlib import Path

from faster_whisper import WhisperModel
from opencc import OpenCC

from import_reviewed_training_transcripts import (
    PROJECT,
    SIMP_ROOT,
    TARGETS,
    TRAD_ROOT,
    stamp,
)
from docx import Document


VIDEO_ROOT = PROJECT / "assets/training/masters/videos"
VIDEOS = {
    "败部复活ep01 1/8": VIDEO_ROOT / "敗部復活/败部复活ep01/败部复活ep01 1:8.mp4",
    "败部复活.ep01 2/8mp4": VIDEO_ROOT / "敗部復活/败部复活ep01/败部复活.ep01 2:8mp4.mp4",
    "败部复活ep01 3/8": VIDEO_ROOT / "敗部復活/败部复活ep01/败部复活ep01 3:8.mp4",
}
MODEL = "small"
MODEL_CACHE = Path("/private/tmp/aia-whisper-models-fresh")
DOCX = Path("/Users/choix/Desktop/ai工作平台/资料/高手分享/高手分享字幕全文校对稿.docx")
ALIGNMENT_DIR = PROJECT / "assets/training/masters/alignment"
PUNCTUATION = set("，。！？；：、,.!?;:（）()《》“”‘’…—- \n\t")


def normalized_chars(text: str, converter: OpenCC) -> tuple[str, list[int]]:
    output: list[str] = []
    source_positions: list[int] = []
    simplified = converter.convert(text).lower()
    for index, char in enumerate(simplified):
        if char in PUNCTUATION:
            continue
        output.append(char)
        source_positions.append(index)
    return "".join(output), source_positions


def split_reviewed_text(text: str, limit: int = 22) -> list[tuple[int, int, str]]:
    pieces: list[tuple[int, int, str]] = []
    start = 0
    cursor = 0
    while cursor < len(text):
        cursor += 1
        length = cursor - start
        punctuation_break = text[cursor - 1] in "，。！？；"
        if (punctuation_break and length >= 8) or length >= limit:
            pieces.append((start, cursor, text[start:cursor].strip()))
            start = cursor
    if start < len(text):
        tail = text[start:].strip()
        if tail and pieces and len(tail) < 6:
            old_start, _, old_text = pieces.pop()
            pieces.append((old_start, len(text), (old_text + tail).strip()))
        elif tail:
            pieces.append((start, len(text), tail))
    return [piece for piece in pieces if piece[2]]


def transcribe_words(model: WhisperModel, video: Path, cache: Path) -> tuple[list[dict], float]:
    if cache.exists():
        data = json.loads(cache.read_text(encoding="utf-8"))
        return data["words"], float(data["duration"])
    segments, info = model.transcribe(
        str(video),
        language="zh",
        beam_size=1,
        word_timestamps=True,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 250},
        condition_on_previous_text=False,
    )
    words: list[dict] = []
    for segment in segments:
        for word in segment.words or []:
            text = word.word.strip()
            if text:
                words.append({"start": float(word.start), "end": float(word.end), "text": text})
    duration = float(info.duration)
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps({"duration": duration, "words": words}, ensure_ascii=False, indent=2), encoding="utf-8")
    return words, duration


def word_char_timeline(words: list[dict], converter: OpenCC) -> tuple[str, list[tuple[float, float]]]:
    chars: list[str] = []
    times: list[tuple[float, float]] = []
    for word in words:
        norm, _ = normalized_chars(word["text"], converter)
        if not norm:
            continue
        length = len(norm)
        duration = max(0.05, word["end"] - word["start"])
        for index, char in enumerate(norm):
            chars.append(char)
            times.append((word["start"] + duration * index / length, word["start"] + duration * (index + 1) / length))
    return "".join(chars), times


def map_corrected_to_asr(corrected: str, asr: str) -> tuple[list[float | None], float]:
    mapping: list[float | None] = [None] * len(corrected)
    matcher = SequenceMatcher(None, corrected, asr, autojunk=False)
    matched = 0
    anchors: list[tuple[int, int]] = []
    for block in matcher.get_matching_blocks():
        for offset in range(block.size):
            mapping[block.a + offset] = float(block.b + offset)
            anchors.append((block.a + offset, block.b + offset))
            matched += 1
    if not anchors:
        return mapping, 0.0
    anchors.sort()
    for index in range(len(mapping)):
        if mapping[index] is not None:
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


def align_paragraph(text: str, words: list[dict], start: float, end: float, converter: OpenCC) -> tuple[list[dict], float]:
    interval_words = [word for word in words if word["end"] >= start - 0.5 and word["start"] <= end + 0.5]
    asr_text, times = word_char_timeline(interval_words, converter)
    corrected_norm, corrected_source = normalized_chars(text, converter)
    mapped, confidence = map_corrected_to_asr(corrected_norm, asr_text)
    source_to_norm: list[int | None] = [None] * len(text)
    norm_cursor = 0
    for source_index, char in enumerate(converter.convert(text).lower()):
        if char not in PUNCTUATION:
            source_to_norm[source_index] = norm_cursor
            norm_cursor += 1
    cues: list[dict] = []
    previous_end = start
    for source_start, source_end, cue_text in split_reviewed_text(text):
        norm_indexes = [source_to_norm[index] for index in range(source_start, source_end) if source_to_norm[index] is not None]
        mapped_indexes = [mapped[index] for index in norm_indexes if index < len(mapped) and mapped[index] is not None]
        if mapped_indexes and times:
            first = min(len(times) - 1, max(0, round(min(mapped_indexes))))
            last = min(len(times) - 1, max(0, round(max(mapped_indexes))))
            cue_start = times[first][0]
            cue_end = times[last][1]
        else:
            fraction_start = source_start / max(1, len(text))
            fraction_end = source_end / max(1, len(text))
            cue_start = start + (end - start) * fraction_start
            cue_end = start + (end - start) * fraction_end
        cue_start = max(start, previous_end, cue_start - 0.08)
        cue_end = min(end, max(cue_start + 0.7, cue_end + 0.18))
        cue_end = min(cue_end, cue_start + 6.0)
        cues.append({"start": cue_start, "end": cue_end, "text": cue_text})
        previous_end = cue_end
    return cues, confidence


def write_vtt(path: Path, cues: list[dict]) -> None:
    lines = ["WEBVTT", ""]
    for index, cue in enumerate(cues, 1):
        lines.extend([str(index), f"{stamp(cue['start'])} --> {stamp(cue['end'])}", cue["text"], ""])
    path.write_text("\n".join(lines), encoding="utf-8")


def read_target_sections(path: Path) -> dict[str, list[str]]:
    """Read until the next Heading 1; some reviewed lines are accidentally Heading 2."""
    sections = {heading: [] for heading in TARGETS}
    current: str | None = None
    for paragraph in Document(path).paragraphs:
        text = paragraph.text.strip()
        style = paragraph.style.name
        if style == "Heading 1":
            current = None
            continue
        if text in TARGETS:
            current = text
            continue
        if current and text:
            sections[current].append(text)
    return sections


def main() -> None:
    sections = read_target_sections(DOCX)
    converter = OpenCC("t2s")
    model = WhisperModel(
        MODEL,
        device="cpu",
        compute_type="int8",
        cpu_threads=8,
        download_root=str(MODEL_CACHE),
    )
    for heading, relative in TARGETS.items():
        print(f"Transcribing {heading}...", flush=True)
        cache = ALIGNMENT_DIR / f"{Path(relative).name}.words.json"
        words, duration = transcribe_words(model, VIDEOS[heading], cache)
        trad_json_path = TRAD_ROOT / f"{relative}.json"
        simp_json_path = SIMP_ROOT / f"{relative}.json"
        trad_data = json.loads(trad_json_path.read_text(encoding="utf-8"))
        simp_data = json.loads(simp_json_path.read_text(encoding="utf-8"))
        reviewed_text = "".join(sections[heading])
        all_cues, confidence = align_paragraph(reviewed_text, words, 0.0, duration - 0.1, converter)
        paragraphs = [{"start": cue["start"], "end": cue["end"], "text": cue["text"]} for cue in all_cues]
        trad_data["paragraphs"] = paragraphs
        simp_data["paragraphs"] = [{**item, "text": converter.convert(item["text"])} for item in paragraphs]
        trad_json_path.write_text(json.dumps(trad_data, ensure_ascii=False, indent=2), encoding="utf-8")
        simp_json_path.write_text(json.dumps(simp_data, ensure_ascii=False, indent=2), encoding="utf-8")
        write_vtt(TRAD_ROOT / f"{relative}.vtt", all_cues)
        simple_cues = [{**cue, "text": converter.convert(cue["text"])} for cue in all_cues]
        write_vtt(SIMP_ROOT / f"{relative}.vtt", simple_cues)
        print(f"Aligned {heading}: {len(words)} ASR words, {len(all_cues)} cues, text match {confidence:.1%}", flush=True)


if __name__ == "__main__":
    main()
