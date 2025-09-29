@echo off
setlocal ENABLEDELAYEDEXPANSION
set ROOT=%~dp0..
pushd %ROOT%
if exist .env (
  for /f "usebackq tokens=1,* delims==" %%A in (`findstr /R "^[A-Za-z0-9_][A-Za-z0-9_]*=" .env`) do (
    set "%%A=%%B"
  )
)
if not defined LOGS_HOME set LOGS_HOME=scripts\.state\logs
if not exist %LOGS_HOME% (
  echo Log directory %LOGS_HOME% does not exist yet.
  exit /b 1
)

echo [logs] Tailing (Ctrl+C to exit):
echo   %LOGS_HOME%\api.out.log
echo   %LOGS_HOME%\api.err.log
echo   %LOGS_HOME%\web.out.log
echo   %LOGS_HOME%\web.err.log
echo   %LOGS_HOME%\postgres.out.log

echo.
powershell -NoLogo -NoProfile -Command ^
  "$paths = @('%LOGS_HOME%/api.out.log','%LOGS_HOME%/api.err.log','%LOGS_HOME%/web.out.log','%LOGS_HOME%/web.err.log','%LOGS_HOME%/postgres.out.log'); ^
   $tails = $paths | ForEach-Object { if(Test-Path $_){ Get-Content -Path $_ -Tail 10 -Wait -Encoding UTF8 | ForEach-Object { Write-Host (Split-Path $_ -Leaf) ':' $_ } } };" 2>nul
popd
exit /b 0
