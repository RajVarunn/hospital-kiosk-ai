@echo off
echo Killing processes on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Found process: %%a
    taskkill /F /PID %%a
    echo Process %%a killed
)
echo Done