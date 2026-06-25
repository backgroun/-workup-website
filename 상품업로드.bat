@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================
echo   상품 자동 등록을 시작합니다...
echo ========================================
echo.
node scripts\upload-products.mjs
echo.
echo (창을 닫으려면 아무 키나 누르세요)
pause >nul
