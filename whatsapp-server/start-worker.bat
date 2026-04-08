@echo off
title PG Buddy — CAMPAIGN WORKER
color 0E
echo.
echo  ============================================
echo   PG Buddy — Campaign Marketing Worker
echo  ============================================
echo.
echo [INFO] This worker sends pitches every 3 minutes.
echo Ensure the Master Server is running first.
echo.
cd /d "%~dp0"
node campaign-worker.js
pause
