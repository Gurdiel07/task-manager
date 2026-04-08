@echo off
echo.
echo ===================================
echo   Task Manager - Setup
echo ===================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is required. Install from https://nodejs.org
    exit /b 1
)

echo Node.js detected:
node -v

echo.
echo Installing dependencies...
call npm install
echo.

if not exist .env (
    copy .env.example .env
    echo Created .env file - please set NEXTAUTH_SECRET to a random value
) else (
    echo .env already exists
)

echo.
echo Setting up database...
call npx prisma generate
call npx prisma db push
echo Database ready

echo.
set /p SEED="Load demo data? (y/N): "
if /i "%SEED%"=="y" (
    call npx prisma db seed
    echo Demo data loaded
    echo Login: admin@taskmanager.com / password123
)

echo.
echo ===================================
echo   Setup complete!
echo   Run: npm run dev
echo   Open: http://localhost:3000
echo ===================================
echo.
