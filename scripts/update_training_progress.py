#!/usr/bin/env python3
"""Continuously publish local subtitle-generation progress for the workbench UI."""

from __future__ import annotations

import json
import time
from datetime import datetime
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]
VIDEO_ROOT = PROJECT / "assets/training/masters/videos"
TRAD_ROOT = PROJECT / "assets/training/masters/subtitles"
SIMP_ROOT = PROJECT / "assets/training/masters/subtitles-simplified"
OUTPUT = PROJECT / "assets/training/masters/transcription-progress.json"
REVIEW = PROJECT / "assets/training/masters/字幕全文_待確認標記.md"
CURRENT = PROJECT / "assets/training/masters/transcription-current.json"


def target(video: Path, root: Path, suffix: str) -> Path:
    relative = video.relative_to(VIDEO_ROOT).with_suffix("")
    return Path(f"{root / relative}{suffix}")


def snapshot() -> dict:
    videos = sorted(VIDEO_ROOT.rglob("*.mp4"), key=lambda path: str(path))
    traditional = [target(video, TRAD_ROOT, ".vtt") for video in videos]
    simplified = [target(video, SIMP_ROOT, ".vtt") for video in videos]
    transcripts = [target(video, TRAD_ROOT, ".json") for video in videos]
    completed = [path for path in transcripts if path.exists()]
    uncertain = 0
    for path in completed:
        try:
            uncertain += path.read_text(encoding="utf-8").count("【待確認：")
        except OSError:
            pass
    newest = max(completed, key=lambda path: path.stat().st_mtime, default=None)
    current = {}
    try:
        current = json.loads(CURRENT.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        pass
    return {
        "total": len(videos),
        "traditional": sum(path.exists() for path in traditional),
        "simplified": sum(path.exists() for path in simplified),
        "transcripts": len(completed),
        "uncertainMarks": uncertain,
        "reviewReady": REVIEW.exists(),
        "latest": newest.stem if newest else "等待开始",
        "currentTask": current,
        "updatedAt": datetime.now().isoformat(timespec="seconds"),
    }


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    while True:
        temp = OUTPUT.with_suffix(".tmp")
        temp.write_text(json.dumps(snapshot(), ensure_ascii=False, indent=2), encoding="utf-8")
        temp.replace(OUTPUT)
        time.sleep(5)


if __name__ == "__main__":
    main()
