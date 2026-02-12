@echo off
echo ========================================
echo Reset PostgreSQL Password
echo ========================================
echo.
echo This script will help you reset the PostgreSQL password for the 'postgres' user.
echo.
echo IMPORTANT: This requires stopping the PostgreSQL service temporarily.
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script must be run as Administrator.
    echo.
    echo Right-click on this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

REM Find PostgreSQL installation path
echo Detecting PostgreSQL installation...
set PG_PATH=
if exist "C:\Program Files\PostgreSQL\15\bin\pg_ctl.exe" (
    set PG_PATH=C:\Program Files\PostgreSQL\15
) else if exist "C:\Program Files\PostgreSQL\14\bin\pg_ctl.exe" (
    set PG_PATH=C:\Program Files\PostgreSQL\14
) else if exist "C:\Program Files\PostgreSQL\13\bin\pg_ctl.exe" (
    set PG_PATH=C:\Program Files\PostgreSQL\13
) else if exist "C:\Program Files\PostgreSQL\12\bin\pg_ctl.exe" (
    set PG_PATH=C:\Program Files\PostgreSQL\12
)

if "%PG_PATH%"=="" (
    echo ERROR: PostgreSQL installation not found in default locations.
    echo Please ensure PostgreSQL is installed in C:\Program Files\PostgreSQL\
    echo.
    pause
    exit /b 1
)

echo Found PostgreSQL at: %PG_PATH%
echo.

REM Get new password
set /p NEW_PASSWORD="Enter new password for postgres user: "

if "%NEW_PASSWORD%"=="" (
    echo ERROR: Password cannot be empty.
    pause
    exit /b 1
)

echo.
echo Stopping PostgreSQL service...
net stop postgresql-x64-15 >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Could not stop service. It may already be stopped.
)

echo.
echo Starting PostgreSQL in single-user mode...
start /B "" "%PG_PATH%\bin\postgres.exe" -D "%PG_PATH%\data" --single -D "%PG_PATH%\data" -c config_file="%PG_PATH%\data\postgresql.conf" > "%TEMP%\postgres_reset.log" 2>&1

timeout /t 2 /nobreak >nul

echo.
echo Resetting password...
echo ALTER USER postgres WITH PASSWORD '%NEW_PASSWORD%'; | "%PG_PATH%\bin\psql.exe" -U postgres -h localhost -p 5432 -d postgres >nul 2>&1

if %errorlevel% neq 0 (
    echo ERROR: Failed to reset password.
    echo.
    echo Trying alternative method...
    echo.
    
    REM Alternative method using pg_ctl
    taskkill /F /IM postgres.exe >nul 2>&1
    timeout /t 1 /nobreak >nul
    
    echo Starting PostgreSQL normally...
    net start postgresql-x64-15 >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: Could not start PostgreSQL service.
        pause
        exit /b 1
    )
    
    timeout /t 3 /nobreak >nul
    
    echo.
    echo Please try connecting with your old password first.
    echo If that doesn't work, you may need to reinstall PostgreSQL.
    echo.
    pause
    exit /b 1
)

echo.
echo Stopping single-user mode...
taskkill /F /IM postgres.exe >nul 2>&1
timeout /t 1 /nobreak >nul

echo.
echo Starting PostgreSQL service normally...
net start postgresql-x64-15 >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Could not start service automatically.
    echo Please start it manually from Services.
)

echo.
echo ========================================
echo Password reset successful!
echo ========================================
echo.
echo New password: %NEW_PASSWORD%
echo.
echo IMPORTANT: Update backend/.env with this new password:
echo DATABASE_URL=postgresql://postgres:%NEW_PASSWORD%@localhost:5432/calendar_organizer
echo.
echo Or run: update-password.bat
echo.
pause