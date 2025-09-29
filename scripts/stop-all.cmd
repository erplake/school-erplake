@echo off
setlocal
set ROOT=%~dp0..
pushd %ROOT%
if exist .env (
  for /f "usebackq tokens=1,* delims==" %%A in (`findstr /R "^[A-Za-z0-9_][A-Za-z0-9_]*=" .env`) do (
    set "%%A=%%B"
  )
)

if not defined POSTGRES_PORT set POSTGRES_PORT=5432

set KILLED=0

for %%F in (api web) do (
  if exist scripts\.state\%%F.pid (
    for /f "usebackq delims=" %%p in ("scripts\.state\%%F.pid") do set PID=%%p
    2>nul >nul (tasklist /FI "PID eq %PID%" | find /I "%PID%")
    if not errorlevel 1 (
      echo [stop] Attempting to terminate %%F (PID %PID%)
      taskkill /PID %PID% /T /F >nul 2>&1
      set /a KILLED+=1
    )
    del scripts\.state\%%F.pid >nul 2>&1
  )
)

:: Graceful Postgres shutdown (if running)
if not defined DB_HOME set DB_HOME=%ROOT%\pgsql\bin
if not defined PGDATA set PGDATA=%ROOT%\pgsql\pgdata
for /f "tokens=5" %%i in ('netstat -aon ^| findstr /R ":%POSTGRES_PORT%" ^| findstr LISTENING') do set PGPID=%%i
if defined PGPID (
  if exist "%DB_HOME%\pg_ctl.exe" (
    echo [stop] Stopping Postgres with pg_ctl (PID %PGPID%)
    "%DB_HOME%\pg_ctl.exe" stop -D "%PGDATA%" -m fast >nul 2>&1
    set /a KILLED+=1
  ) else (
  echo [stop] pg_ctl not found in %DB_HOME%; falling back to taskkill for Postgres PID %PGPID%
    taskkill /PID %PGPID% /T /F >nul 2>&1
  )
)

where docker >nul 2>&1
if %errorlevel%==0 (
  echo [stop] Stopping docker compose services (if any)…
  docker compose down >nul 2>&1
)

echo [stop] Done. (%KILLED% processes terminated)
popd
exit /b 0
