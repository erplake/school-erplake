@echo off
setlocal ENABLEDELAYEDEXPANSION
set ROOT=%~dp0..
pushd %ROOT%
:: Load .env
if exist .env (
  for /f "usebackq eol=# tokens=1* delims==" %%A in (".env") do if not "%%A"=="" set "%%A=%%B"
)
if not defined API_PORT set API_PORT=8000
if not defined WEB_PORT set WEB_PORT=5173
if not defined POSTGRES_PORT set POSTGRES_PORT=5432

echo --- Ports ---
echo API: %API_PORT%
echo WEB: %WEB_PORT%
echo DB : %POSTGRES_PORT%

echo --- Processes ---
for %%F in (api web) do (
  set PID=
  if exist scripts\.state\%%F.pid for /f "usebackq delims=" %%p in ("scripts\.state\%%F.pid") do set PID=%%p
  if defined PID (
    tasklist /FI "PID eq !PID!" | find /I "!PID!" >nul 2>&1
    if !errorlevel!==0 ( echo %%F : RUNNING (PID !PID!) ) else ( echo %%F : stale pid file )
  ) else (
    echo %%F : stopped
  )
)

echo --- HTTP ---
powershell -NoLogo -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://localhost:%API_PORT%/docs).StatusCode } catch { '0' }" | findstr 200 >nul
if %errorlevel%==0 ( echo api : 200 OK ) else ( echo api : no-response )
powershell -NoLogo -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://localhost:%WEB_PORT%).StatusCode } catch { '0' }" | findstr 200 >nul
if %errorlevel%==0 ( echo web : 200 OK ) else ( echo web : no-response )

echo --- Database ---
set PGPID=
for /f "tokens=5" %%i in ('netstat -aon ^| findstr /R ":%POSTGRES_PORT%" ^| findstr LISTENING') do set PGPID=%%i
if defined PGPID ( echo postgres : RUNNING (PID %PGPID%) ) else ( echo postgres : stopped )

set EXIT=0
if not defined PGPID set EXIT=1
powershell -NoLogo -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://localhost:%API_PORT%/docs).StatusCode } catch { 0 }" | findstr 200 >nul || set EXIT=1
powershell -NoLogo -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://localhost:%WEB_PORT%).StatusCode } catch { 0 }" | findstr 200 >nul || set EXIT=1

popd
exit /b %EXIT%
