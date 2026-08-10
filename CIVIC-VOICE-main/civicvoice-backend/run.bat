@echo off
rem Civic Voice backend launcher
rem Requires Java 17+ and PostgreSQL running on localhost:5432

cd /d "%~dp0"
setlocal
if "%JAVA_HOME%"=="" (echo [WARN] JAVA_HOME not set, using 'java' from PATH)
mvn spring-boot:run
endlocal
