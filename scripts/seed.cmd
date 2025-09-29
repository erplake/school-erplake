@echo off
setlocal ENABLEDELAYEDEXPANSION
set ROOT=%~dp0..
pushd %ROOT%
if exist .env (
  for /f "usebackq tokens=1,* delims==" %%A in (`findstr /R "^[A-Za-z0-9_][A-Za-z0-9_]*=" .env`) do (
    set "%%A=%%B"
  )
)
if not defined API_HOME set API_HOME=services\api
if not defined DATABASE_URL set DATABASE_URL=postgresql://%POSTGRES_USER%:%POSTGRES_PASSWORD%@%POSTGRES_HOST%:%POSTGRES_PORT%/%POSTGRES_DB%

echo [seed] Using DATABASE_URL=%DATABASE_URL%
pushd %API_HOME%
python -m app.seed %*
set EXITCODE=%ERRORLEVEL%
popd
popd
exit /b %EXITCODE%
