@echo off
git add .

git diff --cached --quiet
if %errorlevel%==0 (
    echo Aucun changement a envoyer.
    pause
    exit /b
)

git commit -m "auto update"
git pull origin main --rebase
git push origin main

echo.
echo Sync complete
pause