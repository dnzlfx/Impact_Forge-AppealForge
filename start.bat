@echo off
start "Servidor Backend" cmd /k "cd backend && call .venv\Scripts\activate.bat && set PYTHONPATH=. && python -m uvicorn app.main:app --reload --port 8000"
start "Servidor Frontend" cmd /k "cd frontend && npm run dev"