@echo off
title SIMONPRO
color 0A
echo.
echo  ================================
echo    SIMONPRO - Memulai Aplikasi
echo  ================================
echo.

node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ERROR: Node.js belum diinstall!
    echo.
    echo Download di: https://nodejs.org
    echo Pilih versi LTS
    echo.
    pause
    start https://nodejs.org/en/download
    exit /b
)

if not exist "node_modules" (
    echo Menginstall packages pertama kali...
    echo Harap tunggu 2-5 menit...
    echo.
    npm install --legacy-peer-deps
    echo.
)

echo Membuka browser otomatis dalam 3 detik...
timeout /t 3 >nul
start http://localhost:3000
echo.
echo Aplikasi berjalan di: http://localhost:3000
echo Tekan CTRL+C untuk menghentikan
echo.
npm run dev
