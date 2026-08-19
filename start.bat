@echo off
title e-Office DMS - Server Khoi Chay
cd /d "%~dp0"

echo ================================================================
echo       HE THONG QUAN LY VAN BAN VA DIEU HANH - e-Office DMS
echo ================================================================
echo.

REM 1. Kiem tra Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 goto :no_node

REM 2. Kiem tra file .env
if not exist ".env" if exist ".env.example" (
    echo [THONG BAO] Dang tao file .env tu .env.example...
    copy .env.example .env >nul
)

REM 3. Kiem tra node_modules
if not exist "node_modules" goto :install_deps
goto :skip_install

:install_deps
echo [1/3] Dang cai dat thu vien dependencies...
call npm install
if %ERRORLEVEL% neq 0 goto :npm_error

:skip_install
echo [OK] Thu vien dependencies da san sang.

REM 4. Sinh Prisma Client
echo [2/3] Dang dong bo Prisma Client...
call npx prisma generate

REM 5. Mo trinh duyet va khoi dong dev server
echo [3/3] Dang khoi dong may chu thu nghiem: http://localhost:3000...
echo.
echo ================================================================
echo  * Trinh duyet se tu dong mo tai: http://localhost:3000
echo  * Nhan to hop phim Ctrl + C de dung may chu.
echo ================================================================
echo.

start "" "http://localhost:3000"

call npm run dev

echo.
echo ================================================================
echo [THONG BAO] May chu da dung lai.
echo ================================================================
pause
exit /b 0

:no_node
echo [LOI] Khong tim thay Node.js tren may tinh!
echo Vui long cai dat Node.js tu https://nodejs.org/
echo.
pause
exit /b 1

:npm_error
echo [LOI] Qua trinh npm install gap loi!
echo.
pause
exit /b 1
