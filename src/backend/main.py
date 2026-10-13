"""
FastAPI Backend for Knik Web App
Main application entry point with middleware and route registration
"""

import asyncio
import contextlib
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import WebBackendConfig
from backend.routes.admin import router as admin_router
from backend.routes.analytics import router as analytics_router
from backend.routes.chat import router as chat_router
from backend.routes.chat_stream import router as chat_stream_router
from backend.routes.conversations import router as conversations_router
from backend.routes.cron import router as cron_router
from backend.routes.workflow import router as workflow_router
from backend.state import AppState
from imports import DB_ERRORS, DatabaseUnavailable, PostgresDB, browser, printer


# The one config instance: it sizes the server below and the lifespan hands it to the AppState.
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


# How often idle browser sessions (launched by the browser tools) are looked for and closed.
BROWSER_CLEANUP_INTERVAL = 300


async def _close_idle_browsers() -> None:
    while True:
        await asyncio.sleep(BROWSER_CLEANUP_INTERVAL)
        try:
            await asyncio.to_thread(browser.cleanup_idle)
        except Exception as e:
            printer.warning(f"Browser idle cleanup failed: {e}")


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

    # Routes reach it through deps.get_state. Built after the pool, since it reads the persisted settings.
    state = await AppState.create(config)
    app.state.knik = state

    client_settings = state.settings.client_settings
    printer.success(f"Backend ready on http://{config.host}:{config.port}")
    printer.info(f"AI Provider: {client_settings.provider}/{client_settings.model}")
    printer.info(f"TTS Voice: {state.settings.voice}")
    browser_cleaner = asyncio.create_task(_close_idle_browsers(), name="browser-idle-cleaner")
    yield
    printer.info("Shutting down Knik backend...")
    browser_cleaner.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await browser_cleaner
    try:
        await state.close()
    except Exception as e:
        printer.warning(f"Tool cleanup failed: {e}")
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
