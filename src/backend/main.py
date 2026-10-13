"""
FastAPI Backend for Knik Web App
Main application entry point with middleware and route registration
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend import state
from backend.config import WebBackendConfig
from backend.routes.admin import router as admin_router
from backend.routes.analytics import router as analytics_router
from backend.routes.chat import router as chat_router
from backend.routes.chat_stream import router as chat_stream_router
from backend.routes.conversations import router as conversations_router
from backend.routes.cron import router as cron_router
from backend.routes.workflow import router as workflow_router
from imports import DB_ERRORS, DatabaseUnavailable, PostgresDB, SettingsDB, printer


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
app.include_router(conversations_router, prefix="/api/conversations", tags=["conversations"])
app.include_router(cron_router, prefix="/api/cron", tags=["cron"])
app.include_router(workflow_router, prefix="/api/workflows", tags=["workflows"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])


async def database_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Any database failure a route lets through: 503, so clients can tell it from a bug and retry later."""
    printer.warning(f"{request.method} {request.url.path} failed, database error: {exc}")
    detail = "Database unavailable" if isinstance(exc, DatabaseUnavailable) else f"Database error: {exc}"
    return JSONResponse(status_code=503, content={"detail": detail})


# DB_ERRORS is DatabaseUnavailable plus psycopg.Error (which covers the pool's PoolTimeout).
for _error in DB_ERRORS:
    app.add_exception_handler(_error, database_error_handler)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup/shutdown"""
    printer.info("Starting Knik FastAPI backend...")

    try:
        await PostgresDB.initialize()
        printer.success("PostgreSQL connection pool initialized")
    except DB_ERRORS as e:
        # Queries reconnect lazily (at most every 30 s), so the backend recovers once Postgres is up.
        printer.warning(f"PostgreSQL init failed (conversations will not persist): {e}")

    try:
        persisted = await SettingsDB.get()
        if persisted:
            state.set_persisted_overrides(persisted.to_dict())
            printer.info(f"Loaded persisted settings: {persisted.provider}/{persisted.model}")
    except DB_ERRORS as e:
        printer.warning(f"Could not load persisted settings: {e}")

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
    """Return basic API identity and status."""
    return {"name": "Knik AI Assistant API", "version": "2.0.0", "status": "running"}


@app.get("/health")
async def health_check():
    """Return health status for uptime monitoring."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=config.host,
        port=config.port,
        reload=config.reload,
        log_level="info",
    )
