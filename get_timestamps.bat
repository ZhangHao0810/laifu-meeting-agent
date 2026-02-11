@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo    北京时间 13位毫秒级时间戳工具
echo ========================================
echo.

:: 获取当前时间
for /f "tokens=1-6 delims=/:. " %%a in ("%date% %time%") do (
    set year=%%a
    set month=%%b
    set day=%%c
    set hour=%%d
    set minute=%%e
    set second=%%f
)

:: 处理月份、日期、小时、分钟、秒的前导零
set month=!month: =0!
set day=!day: =0!
set hour=!hour: =0!
set minute=!minute: =0!
set second=!second: =0!

:: 使用 PowerShell 计算当前时间的时间戳
for /f %%i in ('powershell -command "[Math]::Floor((Get-Date).ToUniversalTime().Subtract((Get-Date '1970-01-01')).TotalMilliseconds)"') do set current_timestamp=%%i

:: 使用 PowerShell 计算今早7点的时间戳
for /f %%i in ('powershell -command "$today7am = Get-Date -Hour 7 -Minute 0 -Second 0 -Millisecond 0; [Math]::Floor($today7am.ToUniversalTime().Subtract((Get-Date '1970-01-01')).TotalMilliseconds)"') do set today_7am_timestamp=%%i

:: 使用 PowerShell 计算今晚9点的时间戳
for /f %%i in ('powershell -command "$today9pm = Get-Date -Hour 21 -Minute 0 -Second 0 -Millisecond 0; [Math]::Floor($today9pm.ToUniversalTime().Subtract((Get-Date '1970-01-01')).TotalMilliseconds)"') do set today_9pm_timestamp=%%i

:: 获取可读的时间格式
for /f "tokens=*" %%i in ('powershell -command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss'"') do set current_time=%%i
for /f "tokens=*" %%i in ('powershell -command "Get-Date -Hour 7 -Minute 0 -Second 0 -Format 'yyyy-MM-dd HH:mm:ss'"') do set today_7am_time=%%i
for /f "tokens=*" %%i in ('powershell -command "Get-Date -Hour 21 -Minute 0 -Second 0 -Format 'yyyy-MM-dd HH:mm:ss'"') do set today_9pm_time=%%i

:: 显示结果
echo [当前时间]
echo 时间: !current_time!
echo 时间戳: !current_timestamp!
echo.
echo [今早 7:00]
echo 时间: !today_7am_time!
echo 时间戳: !today_7am_timestamp!
echo.
echo [今晚 21:00]
echo 时间: !today_9pm_time!
echo 时间戳: !today_9pm_timestamp!
echo.
echo ========================================

pause
