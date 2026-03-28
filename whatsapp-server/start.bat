@echo off
title PG Buddy WhatsApp Server
echo =============================================
echo    PG Buddy WhatsApp Server - Quick Start
echo =============================================
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

:: Start server and cloudflared tunnel together
echo Starting WhatsApp Server on port 3001...
echo Starting Cloudflare Tunnel...
echo.

:: Start server in background
start /B node server.js

:: Wait for server to start
timeout /t 3 /nobreak >nul

:: Start cloudflared tunnel (auto-generates HTTPS URL)
echo =============================================
echo  COPY the https://...trycloudflare.com URL
echo  and run on another terminal:
echo  npx supabase secrets set WA_SERVER_URL="<url>"
echo =============================================
echo.
cloudflared tunnel --url http://localhost:3001
