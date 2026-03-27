@echo off
echo Starting TestWeaver Pro...
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

start "Backend Server" cmd /k "npm run backend"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo Both servers are starting...
echo Backend will be available at http://localhost:5000
echo Frontend will be available at http://localhost:3000
echo.
echo Press any key to exit this window (servers will continue running)
pause >nul
