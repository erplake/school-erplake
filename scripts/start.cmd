@echo off
setlocal ENABLEDELAYEDEXPANSION
:: start.cmd - unified starter for Postgres, API, Web (detached) using .env

set ROOT=%~dp0..
pushd %ROOT%

:: Load .env (skip blank/comment lines) robust approach
if exist .env (
  for /f "usebackq delims=" %%L in (".env") do (
    set "LINE=%%L"
    if not "!LINE!"=="" if not "!LINE:~0,1!"=="#" if NOT "!LINE!"=="[" (
      for /f "tokens=1* delims==" %%A in ("!LINE!") do (
        if not "%%A"=="" (
          set "VAL=%%B"
          if defined VAL (
            if "!VAL:~0,1!"=="\"" set "VAL=!VAL:~1!"
            if "!VAL:~-1!"=="\"" set "VAL=!VAL:~0,-1!"
          )
          set "%%A=!VAL!"
        )
      )
    )
  )
)

if not defined LOGS_HOME set LOGS_HOME=scripts\.state\logs
if not exist scripts\.state mkdir scripts\.state 2>nul
if not exist %LOGS_HOME% mkdir %LOGS_HOME% 2>nul

set APIPORT=%API_PORT%
if not defined APIPORT set APIPORT=8000
set WEBPORT=%WEB_PORT%
if not defined WEBPORT set WEBPORT=5173

:: Ports must be deterministic; kill anything occupying them
for %%P in (%APIPORT% %WEBPORT%) do call :KILLPORT %%P

:: Postgres setup
if not defined DB_HOME set DB_HOME=%ROOT%\pgsql\bin
if not defined PGDATA set PGDATA=%ROOT%\pgsql\pgdata
if not defined POSTGRES_PORT set POSTGRES_PORT=5432
if not defined POSTGRES_HOST set POSTGRES_HOST=localhost
if not defined POSTGRES_USER set POSTGRES_USER=erplake
if not defined POSTGRES_PASSWORD set POSTGRES_PASSWORD=erplake
if not defined POSTGRES_DB set POSTGRES_DB=schooldb
set PGBIN=%DB_HOME%

if not exist "%PGDATA%" (
  echo [db] Initializing new data dir: %PGDATA%
  "%PGBIN%\initdb.exe" -U %POSTGRES_USER% -A trust -D "%PGDATA%" 1>>"%LOGS_HOME%\postgres.out.log" 2>>"%LOGS_HOME%\postgres.err.log"
)

:: Start Postgres if not already listening
set PGPID=
for /f "tokens=5" %%i in ('netstat -aon ^| findstr /R ":%POSTGRES_PORT%" ^| findstr LISTENING') do set PGPID=%%i
if defined PGPID (
  echo [db] Already running (PID %PGPID%) on port %POSTGRES_PORT%
) else (
  echo [db] Starting Postgres on %POSTGRES_PORT%
  start "postgres" /min "%PGBIN%\postgres.exe" -D "%PGDATA%" -p %POSTGRES_PORT% 1>>"%LOGS_HOME%\postgres.out.log" 2>>"%LOGS_HOME%\postgres.err.log"
  >scripts\.state\postgres.pid echo pending
)

:: Build DATABASE_URL if not provided
if not defined DATABASE_URL set DATABASE_URL=postgresql://%POSTGRES_USER%:%POSTGRES_PASSWORD%@%POSTGRES_HOST%:%POSTGRES_PORT%/%POSTGRES_DB%

:: API
if not defined API_HOME set API_HOME=services\api
if exist scripts\.state\api.pid del scripts\.state\api.pid >nul 2>&1
if exist %API_HOME%\alembic.ini (
  echo [api] Applying migrations...
  start "alembic" /min cmd /c "cd %API_HOME% && python -m alembic upgrade head 1>>..\..\%LOGS_HOME%\alembic.out.log 2>>..\..\%LOGS_HOME%\alembic.err.log"
)
powershell -NoLogo -NoProfile -Command ^
  "$p=Start-Process -FilePath python -ArgumentList '-m','uvicorn','app.main:app','--port','%APIPORT%','--reload' -WorkingDirectory '%CD%/%API_HOME%' -WindowStyle Minimized -PassThru; Set-Content -Path 'scripts/.state/api.pid' -Value $p.Id" 1>>"%LOGS_HOME%\api.out.log" 2>>"%LOGS_HOME%\api.err.log"

:: Health wait (API /docs)
set /a ATTEMPTS=0
:API_WAIT
set /a ATTEMPTS+=1
if %ATTEMPTS% GTR 20 goto :AFTER_API_WAIT
powershell -NoLogo -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 http://localhost:%APIPORT%/docs).StatusCode } catch { 0 }" | findstr 200 >nul
if %errorlevel%==0 ( echo [health] API up after %ATTEMPTS% checks & goto :AFTER_API_WAIT )
ping -n 2 127.0.0.1 >nul
goto :API_WAIT
:AFTER_API_WAIT

:: Web
if not defined WEB_HOME set WEB_HOME=apps\web
if not exist %WEB_HOME%\node_modules (
  echo [web] Installing dependencies (first run)...
  start "web-npm-install" /min cmd /c "cd %WEB_HOME% && npm install 1>>..\..\%LOGS_HOME%\web.npm.out.log 2>>..\..\%LOGS_HOME%\web.npm.err.log && npm run dev -- --port %WEBPORT% 1>>..\..\%LOGS_HOME%\web.out.log 2>>..\..\%LOGS_HOME%\web.err.log"
) else (
  powershell -NoLogo -NoProfile -Command ^
    "$p=Start-Process -FilePath npm -ArgumentList 'run','dev','--','--port','%WEBPORT%' -WorkingDirectory '%CD%/%WEB_HOME%' -WindowStyle Minimized -PassThru; Set-Content -Path 'scripts/.state/web.pid' -Value $p.Id" 1>>"%LOGS_HOME%\web.out.log" 2>>"%LOGS_HOME%\web.err.log"
)

echo [done] Started (API:%APIPORT% Web:%WEBPORT% DB:%POSTGRES_PORT%)
echo [hint] Use status.cmd for health; logs: logs.cmd ; seed: seed.cmd
popd
exit /b 0

:KILLPORT
for /f "tokens=5" %%i in ('netstat -aon ^| findstr /R ":%1" ^| findstr LISTENING') do (
  echo [port] Freeing %1 from PID %%i
  taskkill /PID %%i /T /F >nul 2>&1
)
exit /b 0
