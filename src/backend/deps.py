"""FastAPI dependencies: the shared AppState, and the API key check every /api route runs.

The chat routes get their AI client from ``AppState.get_client`` inside the route rather than through a
dependency: a dependency would have to read the request body too, and FastAPI then validates the body once
per reader, doubling every entry of a 422 response.
"""

from fastapi import Depends, HTTPException, Request
from fastapi.security import APIKeyHeader

from backend.state import AppState
from imports import ApiKeyDB


_api_key_header = APIKeyHeader(
    name="X-API-Key",
    auto_error=False,
    description="An API key from /api/admin/api-keys. Checked only when KNIK_WEB_REQUIRE_API_KEY is on.",
)


def get_state(request: Request) -> AppState:
    """The AppState the lifespan built (see main.py)."""
    return request.app.state.knik


async def require_api_key(api_key: str | None = Depends(_api_key_header), state: AppState = Depends(get_state)) -> None:
    """With KNIK_WEB_REQUIRE_API_KEY on, the request must carry a stored key in X-API-Key.

    A key that cannot be checked because the database is down raises the database error, which main.py turns
    into a 503.
    """
    if not state.config.require_api_key:
        return
    if not api_key:
        raise _unauthorized("Missing API key")
    key_id = await ApiKeyDB.find_id(api_key)
    if key_id is None:
        raise _unauthorized("Invalid API key")
    state.record_api_key_use(key_id)


def _unauthorized(detail: str) -> HTTPException:
    # A 401 must name a scheme; API keys have no standard one, so this is the value FastAPI's APIKeyHeader uses.
    return HTTPException(status_code=401, detail=detail, headers={"WWW-Authenticate": "APIKey"})
