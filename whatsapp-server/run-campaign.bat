@echo off
title PG Buddy — B2B Campaign Runner
color 0E
echo.
echo  ============================================
echo   PG Buddy — B2B Lead Campaign
echo  ============================================
echo.

cd /d "%~dp0"

:: Check dependencies
if not exist "node_modules\puppeteer" (
    echo Installing puppeteer for scraping...
    call npm install puppeteer --save
)

:: STEP 1: Scrape leads
set SEARCH=%~1
if "%SEARCH%"=="" set SEARCH=PG in Karve Nagar Pune

echo [PHASE 1] Scraping Google Maps for "%SEARCH%"...
echo.
node scrape-leads.js "%SEARCH%"

if not exist "pg_leads.json" (
    echo.
    echo ERROR: No leads found. Scraper may have been blocked.
    pause
    exit /b 1
)

echo.
echo [PHASE 2] Generating LLM pitches via Groq...
echo.

:: Check for --dry-run flag
if "%~2"=="--dry-run" (
    node generate-pitches.js --dry-run
    echo.
    echo DRY RUN complete. Review pg_pitches.json
    echo Run again without --dry-run to go live.
    pause
    exit /b 0
)

node generate-pitches.js

echo.
echo [PHASE 3] Starting PG Buddy WhatsApp Automation...
echo.
echo 🚀 Running in single-terminal mode for maximum stability.
echo Handling OTPs (via Queue), Rent Reminders, and Sales Campaigns.
echo.

npm start

