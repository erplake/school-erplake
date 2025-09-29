@echo off
setlocal
set ROOT=%~dp0..
pushd %ROOT%
call scripts\stop.cmd
call scripts\start.cmd
popd
exit /b %ERRORLEVEL%
