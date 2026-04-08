@echo off
title PG Buddy — MASTER SERVER
color 0B
echo.
echo  ============================================
echo   PG Buddy — WhatsApp Master Server
echo  ============================================
echo.
echo [INFO] This server handles OTPs, API requests, 
echo and AI Auto-Replies.
echo.
cd /d "%~dp0"
npm start
pause
