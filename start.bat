@echo off
title Smart Inventory Management System
cd /d "%~dp0inventory-app"
echo Starting Smart Inventory Management System...
start http://localhost:8000/
powershell -ExecutionPolicy Bypass -File "%~dp0inventory-app\server.ps1"
pause
