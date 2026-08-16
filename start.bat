@echo off
echo ========================================================
echo Encendiendo el entorno de desarrollo...
echo ========================================================

:: Iniciar el Backend (Uvicorn) en una nueva ventana
start "Backend - FastAPI" cmd /k "cd backend && call .venv\Scripts\activate.bat && set PYTHONPATH=. && python -m uvicorn app.main:app --reload --port 8000"

:: Iniciar el Frontend (Vite/Node) en una nueva ventana
start "Frontend - Vite" cmd /k "cd frontend && npm run dev"