@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo  AppealForge - Inicializacion y Lanzamiento (Windows)
echo ========================================================

:: 1. Verificar o solicitar variables de entorno
if not exist "backend\.env" (
    echo Configuracion inicial requerida ^(archivo .env no detectado^)
    echo --------------------------------------------------------
    set /p API_KEY="Introduce tu FEATHERLESS_API_KEY: "
    set /p BASE_URL="Introduce FEATHERLESS_BASE_URL [Presiona Enter para usar default]: "
    
    if "!BASE_URL!"=="" set BASE_URL=https://api.featherless.ai/v1
    
    echo FEATHERLESS_API_KEY=!API_KEY!> backend\.env
    echo FEATHERLESS_BASE_URL=!BASE_URL!>> backend\.env
    
    echo Archivo .env creado exitosamente en backend\.env
    echo --------------------------------------------------------
) else (
    echo Configuracion existente encontrada en backend\.env
)

:: 2. Detectar modo Docker
if "%1"=="--docker" (
    echo Levantando servicios con Docker Compose...
    docker compose -f docker-compose.yml up --build -d
    timeout /t 3 >nul
    start http://localhost:5173
    exit /b
)

:: 3. Ejecucion Local
echo Iniciando backend (FastAPI)...
start "Backend API" cmd /k "cd backend && call .venv\Scripts\activate.bat && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

:: Verificar si falta instalar frontend
if not exist "frontend\node_modules\" (
    echo Instalando dependencias de frontend...
    start /wait "Instalando Frontend" cmd /c "cd frontend && npm install"
)

echo Iniciando frontend (Vite)...
start "Frontend UI" cmd /k "cd frontend && npm run dev -- --host"

echo --------------------------------------------------------
echo  AppealForge esta ejecutandose:
echo  -^> Frontend: http://localhost:5173
echo  -^> Backend:  http://localhost:8000/docs
echo  (Cierra las ventanas negras emergentes para detenerlos)
echo --------------------------------------------------------

:: Esperar 2 segundos y abrir el navegador automaticamente
timeout /t 2 >nul
start http://localhost:5173