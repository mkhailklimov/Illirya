@echo off
rem Double-click to play "The Governor" (Phase 0 playtest). Continues the saved game, or starts one.
rem Needs Python 3 with PyYAML (pip install pyyaml).
cd /d "%~dp0"
chcp 65001 >nul
python rules\play.py %*
echo.
pause
