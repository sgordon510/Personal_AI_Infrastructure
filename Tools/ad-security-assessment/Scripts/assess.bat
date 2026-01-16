@echo off
REM AD/Azure Security Assessment - Windows Launcher
REM Wrapper for running the assessment on Windows with WSL or Git Bash

setlocal enabledelayedexpansion

echo ===============================================================
echo  AD/Azure Security Assessment - Windows Launcher
echo ===============================================================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set ASSESSMENT_ROOT=%SCRIPT_DIR%..

REM Check if running in WSL
where wsl >nul 2>&1
if %errorlevel% == 0 (
    echo Using WSL to run assessment...
    echo.
    wsl bash "%SCRIPT_DIR%assess-standalone.sh"
    goto :END
)

REM Check if Git Bash is available
if exist "C:\Program Files\Git\bin\bash.exe" (
    echo Using Git Bash to run assessment...
    echo.
    "C:\Program Files\Git\bin\bash.exe" "%SCRIPT_DIR%assess-standalone.sh"
    goto :END
)

if exist "C:\Program Files (x86)\Git\bin\bash.exe" (
    echo Using Git Bash to run assessment...
    echo.
    "C:\Program Files (x86)\Git\bin\bash.exe" "%SCRIPT_DIR%assess-standalone.sh"
    goto :END
)

REM No bash found
echo ERROR: Neither WSL nor Git Bash found
echo.
echo This tool requires Bash to run. Please install one of:
echo   1. Windows Subsystem for Linux (WSL) - Recommended
echo      Install: wsl --install
echo.
echo   2. Git for Windows (includes Git Bash)
echo      Download: https://git-scm.com/download/win
echo.
echo After installation, run this script again.
pause
exit /b 1

:END
echo.
pause
