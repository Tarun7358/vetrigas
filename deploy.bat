@echo off
echo ===================================================
echo VETRI INDANE PLATFORM - PRODUCTION DEPLOYMENT BUILD
echo Developed by RDK Technologies
echo ===================================================
echo.

echo [1/3] Building React Frontend Production Bundle...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed.
    exit /b %errorlevel%
)
cd ..

echo.
echo [2/3] Building Node Backend TypeScript Server...
cd backend
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed.
    exit /b %errorlevel%
)
cd ..

echo.
echo [3/3] Checking Docker status...
docker --version >nul 2>&1
if %errorlevel% neq 0 goto nodocker

echo Docker detected. Launching container stack...
docker-compose up -d --build
goto end

:nodocker
echo Docker is not running or not installed.
echo Production build artifacts compiled successfully:
echo  - Frontend: frontend\dist
echo  - Backend:  backend\dist

:end
echo.
echo ===================================================
echo SUCCESS: Vetri Indane Production Build Complete!
echo Web Dev Server: http://localhost:5173
echo ===================================================
