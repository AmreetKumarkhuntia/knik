"""FastAPI dependencies: the shared AppState.

The chat routes get their AI client from ``AppState.get_client`` inside the route rather than through a
dependency: a dependency would have to read the request body too, and FastAPI then validates the body once
per reader, doubling every entry of a 422 response.
"""

from fastapi import Request

from backend.state import AppState


def get_state(request: Request) -> AppState:
    """The AppState the lifespan built (see main.py)."""
    return request.app.state.knik
