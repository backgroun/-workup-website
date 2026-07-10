@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ====================================
echo  Cloudinary -^> ImageKit 1 dan-gye (upload only)
echo  DB not changed yet. Safe to run.
echo ====================================
echo.
node scripts\cloudinary-imagekit-migrate.mjs
echo.
echo Done. To apply to the live site, run this command yourself in a terminal:
echo   node scripts\cloudinary-imagekit-migrate.mjs --apply-db
echo.
echo Press any key to close this window...
pause >nul
