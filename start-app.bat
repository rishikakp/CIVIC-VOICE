@echo off
rem ===========================================================================
rem Civic Voice - one-command local startup (stable)
rem Starts: PostgreSQL -> Backend (Spring Boot :8080) -> Frontend (:3000)
rem Safe to re-run: skips anything already running.
rem ===========================================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "PG_BIN=C:\Program Files\PostgreSQL\17\bin"
set "PGDATA=%CD%\civicvoice-backend\pgdata"
set "BACKEND_DIR=%CD%\civicvoice-backend"
set "TRIES=0"
rem Prefer the locally installed Maven (see README); fall back to PATH
set "MVN=%LOCALAPPDATA%\apache-maven-3.9.16\bin\mvn.cmd"
if not exist "%MVN%" set "MVN=mvn"

echo ============================================
echo  Civic Voice - starting local environment
echo ============================================

rem --- 1. PostgreSQL -------------------------------------------------------
"%PG_BIN%\pg_isready.exe" -h 127.0.0.1 -p 5432 >nul 2>&1
if not errorlevel 1 goto pg_ok
echo [1/3] Starting PostgreSQL...
if exist "%PGDATA%\postmaster.pid" del /f "%PGDATA%\postmaster.pid" >nul 2>&1
"%PG_BIN%\pg_ctl.exe" -D "%PGDATA%" -l "%BACKEND_DIR%\pg_started.log" start >nul 2>&1
call :sleep 3
"%PG_BIN%\pg_isready.exe" -h 127.0.0.1 -p 5432 >nul 2>&1
if not errorlevel 1 goto pg_ok
echo [FAIL] PostgreSQL did not start. See civicvoice-backend\pg_started.log
exit /b 1

:pg_ok
echo [1/3] PostgreSQL is ready.
"%PG_BIN%\psql.exe" -h 127.0.0.1 -U postgres -d postgres -c "CREATE DATABASE civic_voice;" >nul 2>&1

rem --- 2. Backend ----------------------------------------------------------
netstat -ano | findstr ":8080 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto backend_ok
echo [2/3] Starting backend...
if not exist "%BACKEND_DIR%\target\civicvoice-backend-1.0.0.jar" (
  echo       Jar not found - attempting Maven build...
  call "%MVN%" -f "%BACKEND_DIR%\pom.xml" -q clean package -DskipTests
  if errorlevel 1 (
    echo [FAIL] Build failed and jar is missing. Install Maven 3.9+.
    exit /b 1
  )
)
start "CivicVoice-Backend" /min cmd /c call "%BACKEND_DIR%\start-backend.bat"

:wait_backend
call :sleep 3
curl -s -o nul --max-time 3 http://localhost:8080/api/issues?page=1
if not errorlevel 1 goto backend_ok
set /a TRIES+=1
if !TRIES! lss 60 goto wait_backend
echo [FAIL] Backend did not start. See civicvoice-backend\app_err.log
exit /b 1

:backend_ok
echo [2/3] Backend is ready: http://localhost:8080/api

rem --- 3. Frontend ---------------------------------------------------------
netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto frontend_ok
echo [3/3] Starting frontend server...
start "CivicVoice-Frontend" /min cmd /c node "%CD%\tools\static-server.js" 3000
call :sleep 3

:frontend_ok
echo [3/3] Frontend is ready: http://localhost:3000
echo ============================================
echo  All services running.
echo    Frontend: http://localhost:3000
echo    Backend : http://localhost:8080/api
echo    Admin   : admin@civicvoice.local
echo ============================================
exit /b 0

rem --- portable sleep (works headless, unlike timeout) ----------------------
:sleep
ping -n %~1 127.0.0.1 >nul 2>&1
exit /b 0
