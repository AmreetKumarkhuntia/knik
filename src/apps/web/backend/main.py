"""
FastAPI Backend for Knik Web App
Main application entry point with middleware and route registration
"""

import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# Add src to path for imports
src_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(src_path))

from apps.web.backend.config import WebBackendConfig

# Import routers
from apps.web.backend.routes.admin import router as admin_router
from apps.web.backend.routes.chat import router as chat_router
from apps.web.backend.routes.chat_stream import router as chat_stream_router
from apps.web.backend.routes.history import router as history_router
from imports import printer


# Configuration
config = WebBackendConfig()

# Create FastAPI app
app = FastAPI(title="Knik AI Assistant API", description="Simple voice-enabled AI chat API", version="2.0.0")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Register routers
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(chat_stream_router, prefix="/api/chat/stream", tags=["chat-streaming"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])
app.include_router(history_router, prefix="/api/history", tags=["history"])


# Startup and shutdown using lifespan (modern FastAPI pattern)
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup/shutdown"""
    # Startup
    printer.info("Starting Knik FastAPI backend...")
    printer.success(f"Backend ready on http://{config.host}:{config.port}")
    printer.info(f"AI Provider: {config.ai_provider}/{config.ai_model}")
    printer.info(f"TTS Voice: {config.voice_name}")
    yield
    # Shutdown
    printer.info("Shutting down Knik backend...")


app.router.lifespan_context = lifespan


@app.get("/")
async def root():
    """Root endpoint"""
    return {"name": "Knik AI Assistant API", "version": "2.0.0", "status": "running"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    # Run with config settings
    uvicorn.run(
        "apps.web.backend.main:app",  # Import string for reload to work
        host=config.host,
        port=config.port,
        reload=config.reload,
        log_level="info",
    )
