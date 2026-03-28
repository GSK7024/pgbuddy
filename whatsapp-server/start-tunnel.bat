@echo off
echo ==============================================
echo PG Buddy WhatsApp Server Tunnel
echo ==============================================
echo This terminal will automatically reconnect
echo if the tunnel connection drops.
echo.
echo Your permanent API URL is:
echo https://pgbuddy-wa-server.loca.lt
echo ==============================================
echo.

:loop
echo [ %time% ] Connecting to Localtunnel...
call npx localtunnel --port 3001 --subdomain pgbuddy-wa-server

echo.
echo [ %time% ] Error: Localtunnel disconnected.
echo Restarting tunnel in 2 seconds...
timeout /t 2 /nobreak >nul
goto loop
