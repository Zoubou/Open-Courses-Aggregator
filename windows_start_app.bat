@echo off

REM Start backend
cd ./Backend
start cmd /k "npm start"

REM Wait a bit
timeout /t 3 >nul

REM Start frontend
cd ../frontend
start cmd /k "npm run dev"
