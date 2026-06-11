@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   毎日ニュースまとめ - ローカルサーバー
echo ============================================
echo.
echo  このPC:        http://localhost:8765/
echo  同じWi-Fiの端末: http://(このPCのIPアドレス):8765/
echo.
echo  スマホで見るには、上のIPアドレス付きURLを開いてください。
echo  ※IPは「ipconfig」で確認できます（IPv4アドレス）。
echo  停止するには、このウィンドウで Ctrl+C を押してください。
echo.
python -m http.server 8765 --bind 0.0.0.0
pause
