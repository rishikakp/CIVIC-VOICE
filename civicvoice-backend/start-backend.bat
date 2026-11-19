@echo off
rem Civic Voice backend launcher (used by start-app.bat)
cd /d "%~dp0"

rem Load repo-root .env (CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, APP_SESSION_SECRET, ...)
if exist "%~dp0..\.env" (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%~dp0..\.env") do (
    if not "%%A"=="" if not "%%B"=="" set "%%A=%%B"
  )
)

java -jar target\civicvoice-backend-1.0.0.jar > app_out.log 2> app_err.log
