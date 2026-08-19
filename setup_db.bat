@echo off
title e-Office DMS - Cau Hinh Database
cd /d "%~dp0"

echo ================================================================
echo     KHOI TAO VA NAP DU LIEU MAU DATABASE - e-Office DMS
echo ================================================================
echo.

REM 1. Dong bo cau truc bang vao MySQL
echo [1/4] Dang dong bo cau truc Database: prisma db push...
call npx prisma db push
if %ERRORLEVEL% neq 0 goto :db_error

REM 2. Prisma Generate
echo [2/4] Dang cap nhat Prisma Client: prisma generate...
call npx prisma generate

REM 3. Seed du lieu goc
echo [3/4] Dang nap du lieu phan quyen va tai khoan mac dinh...
call node prisma/seed.js

REM 4. Seed co quan va du lieu mau
echo [4/4] Dang nap danh muc co quan va van ban mau...
if exist "prisma/seed-orgs.js" call node prisma/seed-orgs.js
if exist "prisma/add-mock.js" call node prisma/add-mock.js

echo.
echo ================================================================
echo  [THANH CONG] Du lieu mau da duoc nap hoan tat!
echo  Ban co the chay start.bat de mo ung dung va test.
echo ================================================================
echo.
pause
exit /b 0

:db_error
echo.
echo [LOI] Khong the ket noi hoac cap nhat Database.
echo Vui long kiem tra MySQL Server va DATABASE_URL trong file .env!
echo.
pause
exit /b 1
