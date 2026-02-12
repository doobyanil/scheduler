@echo off
echo ========================================
echo Academic Calendar Organizer - Dev Mode
echo ========================================
echo.

REM Check if PostgreSQL is running
echo Checking PostgreSQL service...
sc query postgresql-x64-15 >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: PostgreSQL service may not be running
    echo.
    echo Please ensure PostgreSQL is installed and running:
    echo   1. Install PostgreSQL from https://www.postgresql.org/download/windows/
    echo   2. Start the PostgreSQL service from Services or run:
    echo      net start postgresql-x64-15
    echo   3. Create the database: createdb -U postgres calendar_organizer
    echo.
    echo Press any key to continue anyway (backend will fail if PostgreSQL is not running)...
    pause >nul
) else (
    echo PostgreSQL service is running
    echo.
)

REM Check if node_modules exist
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo ========================================
echo Starting Backend Server...
echo ========================================
echo Backend will run on http://localhost:5000
echo.
start "Backend Server" cmd /k "cd backend && npm run dev"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo Starting Frontend Server...
echo ========================================
echo Frontend will run on http://localhost:3000
echo.
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Development servers started!
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window (servers will continue running)
echo.
pause