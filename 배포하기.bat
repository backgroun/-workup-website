@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ====================================
echo   GitHub 배포 (한 번에 몰아서 올리기)
echo ====================================
echo.

REM 변경된 파일 먼저 보여주기
git status --short
echo.

REM 변경사항이 없으면 종료
for /f %%i in ('git status --porcelain') do goto :HAS_CHANGES
echo 변경된 내용이 없습니다. 올릴 게 없어요.
echo.
pause
exit /b 0

:HAS_CHANGES
REM 커밋 메시지 입력 (비워두면 기본 메시지)
set "MSG="
set /p "MSG=커밋 메시지 (그냥 Enter 치면 자동 메시지): "
if "%MSG%"=="" set "MSG=update: 작업 내용 반영"

echo.
echo [1/3] 변경사항 추가 중...
git add .

echo [2/3] 커밋 중...
git commit -m "%MSG%"

echo [3/3] GitHub 업로드 중...
git push origin main
if %ERRORLEVEL% neq 0 (
    echo.
    echo 업로드 실패 — 최신 코드 먼저 받고 다시 시도합니다...
    git pull --rebase origin main
    git push origin main
)

echo.
echo ====================================
echo   배포 완료! Vercel이 빌드를 시작합니다.
echo ====================================
echo.
pause
