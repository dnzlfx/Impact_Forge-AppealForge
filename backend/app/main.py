import logging
from logging.handlers import RotatingFileHandler
import os
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router

log_dir = "/tmp/appealforge_logs"
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "appealforge.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    handlers=[
        RotatingFileHandler(log_file, maxBytes=5 * 1024 * 1024, backupCount=3),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("appealforge")

app = FastAPI(title="AppealForge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"--> [REQ] {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        logger.info(f"<-- [RES] {request.method} {request.url.path} status={response.status_code} ({process_time:.1f}ms)")
        return response
    except Exception as e:
        process_time = (time.time() - start_time) * 1000
        logger.exception(f"<-- [ERR] {request.method} {request.url.path} failed after {process_time:.1f}ms: {e}")
        raise e

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "AppealForge API is running", "docs": "/docs", "health": "/health", "logs": log_file}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


