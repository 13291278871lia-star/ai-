@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "AI Workbench Server" /min py -3 serve.py
) else (
  where python >nul 2>nul
  if not %errorlevel%==0 (
    echo Python 3 was not found. Please install Python 3 first.
    pause
    exit /b 1
  )
  start "AI Workbench Server" /min python serve.py
)
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:4175/
