@echo off
echo ========================================
echo Update PostgreSQL Password in .env
echo ========================================
echo.
echo This script will help you update the PostgreSQL password in backend/.env
echo.
echo Current DATABASE_URL in backend/.env:
findstr "DATABASE_URL" backend\.env
echo.
echo Please enter your PostgreSQL password for user 'postgres':
set /p PASSWORD="Password: "

echo.
echo Updating backend/.env...
powershell -Command "(Get-Content backend\.env) -replace 'postgresql://postgres:postgres@', 'postgresql://postgres:%PASSWORD%@' | Set-Content backend\.env"

echo.
echo Updated DATABASE_URL in backend/.env:
findstr "DATABASE_URL" backend\.env
echo.
echo You can now run start-dev.bat to start the servers
echo.
pause