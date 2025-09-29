@echo off
setlocal ENABLEDELAYEDEXPANSION
:: Lightweight cross-process starter for DB (docker compose), API (uvicorn), Web (Vite)
:: Non-blocking: spawns each component detached and exits quickly.

set ROOT=%~dp0..
pushd %ROOT%

:: Load .env (simple KEY=VALUE parser ignoring comments)
if exist .env (
  for /f "usebackq tokens=1,* delims==" %%A in (`findstr /R "^[A-Za-z0-9_][A-Za-z0-9_]*=" .env`) do (
    set "%%A=%%B"
  )
)

if not exist scripts\.state mkdir scripts\.state 2>nul
if not exist scripts\.state\logs mkdir scripts\.state\logs 2>nul

set LOGDIR=scripts\.state\logs
if not defined API_PORT set API_PORT=8000
if not defined WEB_PORT set WEB_PORT=5173
set APIPORT=%API_PORT%
set WEBPORT=%WEB_PORT%

echo [info] Enforcing fixed ports API=%APIPORT% WEB=%WEBPORT%
:: Kill any existing process bound to those ports using a subroutine (avoids nested FOR parsing issues)
for %%P in (%APIPORT% %WEBPORT%) do call :KILLPORT %%P

goto :AFTER_PORT_KILL

:KILLPORT
for /f "tokens=5" %%i in ('netstat -aon ^| findstr /R ":%1" ^| findstr LISTENING') do (
  echo [warn] Port %1 in use by PID %%i - terminating
  taskkill /PID %%i /T /F >nul 2>&1
)
goto :EOF

:AFTER_PORT_KILL

:: --- Local PostgreSQL (embedded binaries) ---
if not defined DB_HOME set DB_HOME=%ROOT%\pgsql\bin
if not defined PGDATA set PGDATA=%ROOT%\pgsql\pgdata
if not defined POSTGRES_PORT set POSTGRES_PORT=5432
if not defined POSTGRES_HOST set POSTGRES_HOST=localhost
if not defined POSTGRES_USER set POSTGRES_USER=postgres
if not defined POSTGRES_PASSWORD set POSTGRES_PASSWORD=
if not defined POSTGRES_DB set POSTGRES_DB=postgres
set PGBIN=%DB_HOME%
set PGPORT=%POSTGRES_PORT%
if not exist "%PGDATA%" (
  echo [db] Initializing new postgres data directory at %PGDATA%
  "%PGBIN%\initdb.exe" -U %POSTGRES_USER% -A trust -D "%PGDATA%" >"%LOGDIR%\pg_init.out.log" 2>"%LOGDIR%\pg_init.err.log"
)
for /f "tokens=5" %%i in ('netstat -aon ^| findstr /R ":%PGPORT%" ^| findstr LISTENING') do set PGPID=%%i
if defined PGPID (
  echo [db] Postgres already running (PID %PGPID%) on port %PGPORT%
) else (
  echo [db] Starting postgres on %PGPORT%
  REM Simplified start command to avoid complex quoting issues
  start "postgres" /min "%PGBIN%\postgres.exe" -D "%PGDATA%" -p %PGPORT% 1>>%LOGDIR%\postgres.out.log 2>>%LOGDIR%\postgres.err.log
  >scripts\.state\db.pid echo %date% %time%
)

:: --- API ---
if exist scripts\.state\api.pid (
  for /f "usebackq delims=" %%p in ("scripts\.state\api.pid") do set APIPID=%%p
  tasklist /FI "PID eq !APIPID!" | find /I "!APIPID!" >nul 2>&1
  if !errorlevel!==0 (
    echo [warn] API already running (PID !APIPID!)
    goto :START_WEB
  ) else (
    del scripts\.state\api.pid >nul 2>&1
  )
)

if not defined API_HOME set API_HOME=services\api
if exist %API_HOME%\alembic.ini (
  echo [start] Applying migrations...
  start "alembic-upgrade" /min cmd /c "cd %API_HOME% && python -m alembic upgrade head 1>>..\..\%LOGDIR%\alembic.out.log 2>>..\..\%LOGDIR%\alembic.err.log"
)

if not defined DATABASE_URL set DATABASE_URL=postgresql://%POSTGRES_USER%:%POSTGRES_PASSWORD%@%POSTGRES_HOST%:%POSTGRES_PORT%/%POSTGRES_DB%
echo [start] Starting API (port %APIPORT%) using %DATABASE_URL%
powershell -NoLogo -NoProfile -Command ^
  "$p=Start-Process -FilePath python -ArgumentList '-m','uvicorn','app.main:app','--port','%APIPORT%','--reload' -WorkingDirectory '%CD%/%API_HOME%' -WindowStyle Minimized -PassThru; ^
   Set-Content -Path 'scripts/.state/api.pid' -Value $p.Id"

:: Wait for API health (max ~10s) hitting /docs
set /a ATTEMPTS=0
:API_WAIT
set /a ATTEMPTS+=1
if %ATTEMPTS% GTR 20 goto :AFTER_API_WAIT
powershell -NoLogo -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 http://localhost:%APIPORT%/docs).StatusCode } catch { 0 }" | findstr 200 >nul
if %errorlevel%==0 ( echo [health] API up in %ATTEMPTS% checks & goto :AFTER_API_WAIT )
ping -n 2 127.0.0.1 >nul
goto :API_WAIT
:AFTER_API_WAIT

:START_WEB
:: --- Web ---
if exist scripts\.state\web.pid (
  for /f "usebackq delims=" %%p in ("scripts\.state\web.pid") do set WEBPID=%%p
  tasklist /FI "PID eq !WEBPID!" | find /I "!WEBPID!" >nul 2>&1
  if !errorlevel!==0 (
    echo [warn] Web already running (PID !WEBPID!)
    goto :DONE
  ) else (
    del scripts\.state\web.pid >nul 2>&1
  )
)

echo [start] Starting Web (port %WEBPORT%)
if not defined WEB_HOME set WEB_HOME=apps\web
if not exist %WEB_HOME%\node_modules (
  echo [start] Installing frontend dependencies (first run)...
  start "web-npm-install" /min cmd /c "cd %WEB_HOME% && npm install 1>>..\..\%LOGDIR%\web.npm.out.log 2>>..\..\%LOGDIR%\web.npm.err.log && npm run dev -- --port %WEBPORT% 1>>..\..\%LOGDIR%\web.out.log 2>>..\..\%LOGDIR%\web.err.log"
) else (
  powershell -NoLogo -NoProfile -Command ^
    "$p=Start-Process -FilePath npm -ArgumentList 'run','dev','--','--port','%WEBPORT%' -WorkingDirectory '%CD%/%WEB_HOME%' -WindowStyle Minimized -PassThru; ^
     Set-Content -Path 'scripts/.state/web.pid' -Value $p.Id" 1>>%LOGDIR%\web.out.log 2>>%LOGDIR%\web.err.log
)
echo %WEBPORT% > scripts\.state\web.port

:DONE
echo [done] Launched components. Use status.cmd to probe.
popd
exit /b 0
