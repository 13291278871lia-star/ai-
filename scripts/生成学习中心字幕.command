#!/bin/zsh
set -e

PROJECT_DIR="/Users/choix/Documents/Codex/2026-09-08/aia-ai-codex-ai-ai-ppt"
PYTHON_BIN="/Users/choix/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"
WHISPER_PACKAGES="/private/tmp/aia-whisper"
LOG_FILE="$PROJECT_DIR/assets/training/masters/subtitles/transcription-progress.log"

cd "$PROJECT_DIR"
echo "开始生成学习中心繁体／简体字幕……"
echo "已完成的影片会自动跳过，可随时重新运行。"
PYTHONPATH="$WHISPER_PACKAGES" "$PYTHON_BIN" scripts/transcribe_training.py --model small --batch-size 16 2>&1 | tee "$LOG_FILE"
echo "全部字幕生成完成。"
