@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================
echo   Cloudinary -^> ImageKit 자산 이전 (1단계: 업로드만)
echo   DB는 아직 바뀌지 않습니다. 안전합니다.
echo ========================================
echo.
node scripts\cloudinary-imagekit-migrate.mjs
echo.
echo 위 결과를 확인하셨다면, 실제 사이트에 반영하려면
echo 아래 명령을 콘솔에서 직접 실행해주세요:
echo   node scripts\cloudinary-imagekit-migrate.mjs --apply-db
echo.
echo (창을 닫으려면 아무 키나 누르세요)
pause >nul
