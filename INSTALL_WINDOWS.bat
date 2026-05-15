@echo off
title SIMONPRO - Installer
color 0A

echo ============================================
echo   SIMONPRO - Sistem Monitoring Proyek
echo   Installer Otomatis
echo ============================================
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js tidak ditemukan!
    echo.
    echo Silakan install Node.js terlebih dahulu:
    echo https://nodejs.org/en/download
    echo.
    echo Pilih versi LTS (Long Term Support)
    echo.
    pause
    start https://nodejs.org/en/download
    exit /b 1
)

echo [OK] Node.js ditemukan: 
node --version

echo.
echo [1/3] Menginstall packages... (mungkin 2-5 menit)
echo.
npm install --legacy-peer-deps

if %errorlevel% neq 0 (
    echo.
    echo Mencoba metode alternatif...
    npm install --force
)

echo.
echo [2/3] Membangun aplikasi...
npm run build

echo.
echo [3/3] Menjalankan SIMONPRO...
echo.
echo ============================================
echo   SIMONPRO siap digunakan!
echo   Buka browser: http://localhost:3000
echo ============================================
echo.
start http://localhost:3000
npm run dev
