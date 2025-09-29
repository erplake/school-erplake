@echo off
setlocal
set ROOT=%~dp0..
pushd %ROOT%
if exist .env (
  for /f "usebackq eol=# tokens=1* delims==" %%A in (".env") do if not "%%A"=="" set "%%A=%%B"
)
if not defined POSTGRES_PORT set POSTGRES_PORT=5432
if not defined DB_HOME set DB_HOME=%ROOT%\pgsql\bin
if not defined PGDATA set PGDATA=%ROOT%\pgsql\pgdata
set COUNT=0
for %%F in (api web) do (
  if exist scripts\.state\%%F.pid (
    for /f "usebackq delims=" %%p in ("scripts\.state\%%F.pid") do set PID=%%p
    if defined PID (
      tasklist /FI "PID eq %PID%" | find /I "%PID%" >nul 2>&1
      if not errorlevel 1 (
        echo [stop] Killing %%F PID %PID%
        taskkill /PID %PID% /T /F >nul 2>&1
        set /a COUNT+=1
      )
    )
    del scripts\.state\%%F.pid >nul 2>&1
  )
)
:: Postgres via pg_ctl
for /f "tokens=5" %%i in ('netstat -aon ^| findstr /R ":%POSTGRES_PORT%" ^| findstr LISTENING') do set PGPID=%%i
if defined PGPID (
  if exist "%DB_HOME%\pg_ctl.exe" (
    echo [stop] Stopping Postgres (PID %PGPID%)
    "%DB_HOME%\pg_ctl.exe" stop -D "%PGDATA%" -m fast >nul 2>&1
    set /a COUNT+=1
  ) else (
    echo [stop] pg_ctl missing; force killing Postgres PID %PGPID%
    taskkill /PID %PGPID% /T /F >nul 2>&1
  )
)
echo [stop] Done. (%COUNT% processes terminated)
popd
exit /b 0
