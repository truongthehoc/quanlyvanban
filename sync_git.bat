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

echo [1/3] Staging changes...
"%GIT_PATH%" add .

set "MSG=%~1"
if "%MSG%"=="" set "MSG=feat: update e-Office DMS source code"

echo [2/3] Committing with message: "%MSG%"...
"%GIT_PATH%" commit -m "%MSG%"

echo [3/3] Pushing to GitHub (origin/main)...
"%GIT_PATH%" push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo [SUCCESS] Source code pushed to GitHub successfully!
) else (
    echo.
    echo [NOTICE] Push encountered an issue. Check your credentials/token.
)
echo ===================================================
