@echo off
echo ========================================================
echo Configurando el proyecto por primera vez...
echo ========================================================

echo.
echo [1/2] Configurando el Backend...
cd backend
echo Creando el entorno virtual (.venv)...
python -m venv .venv
echo Activando entorno e instalando librerias de Python...
call .venv\Scripts\activate.bat
pip install -r requirements.txt
cd ..

echo.
echo [2/2] Configurando el Frontend...
cd frontend
echo Descargando dependencias de Node.js (Esto puede tardar)...
npm install
cd ..

echo.
echo ========================================================
echo Instalacion completada exitosamente.
echo Ahora puedes hacer doble clic en tu script de desarrollo para iniciar.
echo ========================================================
pause