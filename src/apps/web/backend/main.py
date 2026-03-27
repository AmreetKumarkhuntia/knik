"""
FastAPI Backend for Knik Web App
Main application entry point with middleware and route registration
"""

import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


src_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(src_path))

from apps.web.backend.config import WebBackendConfig
from apps.web.backend.routes.admin import router as admin_router
from apps.web.backend.routes.analytics import router as analytics_router
from apps.web.backend.routes.chat import router as chat_router
from apps.web.backend.routes.chat_stream import router as chat_stream_router
from apps.web.backend.routes.conversations import router as conversations_router
from apps.web.backend.routes.cron import router as cron_router
from apps.web.backend.routes.history import router as history_router
from apps.web.backend.routes.workflow import router as workflow_router
from imports import printer
from lib.services.postgres.db import PostgresDB


config = WebBackendConfig()

app = FastAPI(title="Knik AI Assistant API", description="Simple voice-enabled AI chat API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(chat_stream_router, prefix="/api/chat/stream", tags=["chat-streaming"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])
app.include_router(history_router, prefix="/api/history", tags=["history"])
app.include_router(conversations_router, prefix="/api/conversations", tags=["conversations"])
app.include_router(cron_router, prefix="/api/cron", tags=["cron"])
app.include_router(workflow_router, prefix="/api/workflows", tags=["workflows"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup/shutdown"""
    printer.info("Starting Knik FastAPI backend...")

    try:
        await PostgresDB.initialize()
        printer.success("PostgreSQL connection pool initialized")
    except Exception as e:
        printer.warning(f"PostgreSQL init failed (conversations will not persist): {e}")

    printer.success(f"Backend ready on http://{config.host}:{config.port}")
    printer.info(f"AI Provider: {config.ai_provider}/{config.ai_model}")
    printer.info(f"TTS Voice: {config.voice_name}")
    yield
    printer.info("Shutting down Knik backend...")
    try:
        await PostgresDB.close()
        printer.info("PostgreSQL connection pool closed")
    except Exception:
        pass


app.router.lifespan_context = lifespan


@app.get("/")
async def root():
    return {"name": "Knik AI Assistant API", "version": "2.0.0", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "apps.web.backend.main:app",  # Import string for reload to work
        host=config.host,
        port=config.port,
        reload=config.reload,
        log_level="info",
    )
