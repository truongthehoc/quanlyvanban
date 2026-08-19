@echo off
setlocal
echo ===================================================
echo   e-Office DMS - Git Sync & Backup Tool
echo ===================================================

set "GIT_PATH=%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
if not exist "%GIT_PATH%" (
    set "GIT_PATH=git"
)

cd /d "%~dp0"

echo [1/4] Configuring SSH Port 443...
"%GIT_PATH%" config core.sshCommand "ssh -p 443 -o Hostname=ssh.github.com -o StrictHostKeyChecking=accept-new"

echo [2/4] Staging changes...
"%GIT_PATH%" add .

set "MSG=%~1"
if "%MSG%"=="" set "MSG=feat: update e-Office DMS source code"

echo [3/4] Committing with message: "%MSG%"...
"%GIT_PATH%" commit -m "%MSG%"

echo [4/4] Pushing to GitHub (origin/main)...
"%GIT_PATH%" push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo [SUCCESS] Source code pushed to GitHub successfully!
) else (
    echo.
    echo [NOTICE] If permission is denied, please ensure your SSH Public Key is added to https://github.com/settings/keys
)
echo ===================================================
