@echo off
echo.
echo Building Task Manager...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Build failed.
    exit /b 1
)

echo.
echo ===================================
echo   Task Manager is running!
echo   Press Ctrl+C to stop.
echo ===================================
echo.

call npm run start
