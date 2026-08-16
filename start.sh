#!/usr/bin/env bash
set -e

# Base directory
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
ENV_FILE="$BACKEND_DIR/.env"

echo "========================================================"
echo " AppealForge - Inicialización y Lanzamiento"
echo "========================================================"

# Verificar o solicitar variables de entorno
if [ ! -f "$ENV_FILE" ]; then
    echo "Configuración inicial requerida (archivo .env no detectado)"
    echo "--------------------------------------------------------"
    read -r -p "Introduce tu FEATHERLESS_API_KEY: " API_KEY
    read -r -p "Introduce FEATHERLESS_BASE_URL [https://api.featherless.ai/v1]: " BASE_URL
    BASE_URL=${BASE_URL:-https://api.featherless.ai/v1}

    cat <<EOF > "$ENV_FILE"
FEATHERLESS_API_KEY=$API_KEY
FEATHERLESS_BASE_URL=$BASE_URL
EOF
    echo "Archivo .env creado en $ENV_FILE"
    echo "--------------------------------------------------------"
else
    echo "Configuración existente encontrada en $ENV_FILE"
fi

# Detectar modo de ejecución: Docker Compose si está disponible o proceso local
USE_DOCKER=false
if command -v docker >/dev/null 2>&1 && command -v docker-compose >/dev/null 2>&1 || docker compose version >/dev/null 2>&1; then
    if docker info >/dev/null 2>&1; then
        USE_DOCKER=true
    fi
fi

open_browser() {
    local url="$1"
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$url" >/dev/null 2>&1 &
    elif command -v open >/dev/null 2>&1; then
        open "$url" >/dev/null 2>&1 &
    fi
}

if [ "$USE_DOCKER" = true ] && [ "$1" = "--docker" ]; then
    echo "Levantando servicios con Docker Compose..."
    docker compose -f "$ROOT_DIR/docker-compose.yml" up --build -d
    echo "Servicios levantados:"
    echo " - Frontend: http://localhost:5173"
    echo " - Backend:  http://localhost:8000/docs"
    open_browser "http://localhost:5173"
    exit 0
fi

# Ejecución local rápida
echo "Iniciando backend (FastAPI)..."
cd "$BACKEND_DIR"

if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Iniciando frontend (Vite)..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias de frontend..."
    npm install
fi

npm run dev -- --host &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true" EXIT INT TERM

echo "--------------------------------------------------------"
echo " AppealForge está ejecutándose:"
echo " -> Frontend: http://localhost:5173"
echo " -> Backend:  http://localhost:8000/docs"
echo " (Presiona Ctrl+C para detener ambos servicios)"
echo "--------------------------------------------------------"

sleep 2
open_browser "http://localhost:5173"

wait
