@echo off
:: Run this file ONCE as Administrator to set custom hostname
:: Right-click → Run as administrator

echo Adding custom hostname to Windows hosts file...
echo 127.0.0.1   candycapturephotography.local >> C:\Windows\System32\drivers\etc\hosts
echo.
echo Done! You can now access the app at:
echo   http://candycapturephotography.local:5173
echo.
echo (Make sure the app is running via START-APP.bat first)
pause
