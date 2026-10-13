"""
Workflow function implementations for FunctionExecutionNode.

These functions are called by workflow engine and are NOT exposed as MCP tools.
All functions are async and return dict results.

Functions that overlap with MCP tools (shell, text, time, encoding) are
imported from the service layer (lib.services.shell, lib.services.text, etc.)
to avoid duplication. HTTP and data processing functions remain here as they
are scheduler-specific.
"""

import asyncio
import json
import logging
import time
from typing import Any


try:
    import httpx

    HTTP_LIB_AVAILABLE = True
except ImportError:
    try:
        import aiohttp

        HTTP_LIB_AVAILABLE = True
        httpx = None
    except ImportError:
        try:
            import requests

            HTTP_LIB_AVAILABLE = True
            httpx = None
            aiohttp = None
        except ImportError:
            HTTP_LIB_AVAILABLE = False
            httpx = None
            aiohttp = None
            requests = None

from lib.services.encoding import base64_decode, base64_encode
from lib.services.shell import run_shell_command
from lib.services.text import (
    string_concat,
    string_format,
    string_join,
    string_length,
    string_replace,
    string_split,
    string_strip,
    string_to_lower,
    string_to_upper,
)
from lib.services.time import current_timestamp


logger = logging.getLogger(__name__)


async def http_get(
    url: str,
    headers: dict[str, str] = None,
    timeout: int = 30,
    method: str = None,  # Ignored parameter for backward compatibility
) -> dict[str, Any]:
    """Make HTTP GET request with configurable timeout.

    Note: The 'method' parameter is accepted but ignored for backward compatibility.
    Use http_request() if you need to specify a different HTTP method.
    """
    if method and method.upper() != "GET":
        logger.warning(
            f"http_get called with method='{method}' - parameter ignored. Use http_request() for non-GET methods."
        )

    if not HTTP_LIB_AVAILABLE:
        return {"error": "No HTTP library available (httpx/aiohttp/requests not installed)"}

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            req_start = time.perf_counter()
            response = await client.get(url, headers=headers or {})
            duration_ms = int((time.perf_counter() - req_start) * 1000)
            response.raise_for_status()
            result = {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "duration_ms": duration_ms,
                "content": response.text if response.text else None,
            }
            if response.headers.get("content-type", "").startswith("application/json"):
                result["data"] = response.json()
            return result
    except Exception as e:
        return {"error": f"HTTP GET failed: {str(e)}"}


async def http_post(
    url: str,
    data: dict[str, Any] = None,
    headers: dict[str, str] = None,
    timeout: int = 30,
) -> dict[str, Any]:
    """Make HTTP POST request with JSON body and configurable timeout."""
    if not HTTP_LIB_AVAILABLE:
        return {"error": "No HTTP library available"}

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            req_start = time.perf_counter()
            response = await client.post(url, json=data, headers=headers or {})
            duration_ms = int((time.perf_counter() - req_start) * 1000)
            response.raise_for_status()
            result = {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "duration_ms": duration_ms,
            }
            if response.text:
                result["content"] = response.text
                result["data"] = (
                    response.json() if "application/json" in response.headers.get("content-type", "") else None
                )
            return result
    except Exception as e:
        return {"error": f"HTTP POST failed: {str(e)}"}


async def http_request(
    method: str,
    url: str,
    data: dict[str, Any] = None,
    headers: dict[str, str] = None,
    timeout: int = 30,
) -> dict[str, Any]:
    """Generic HTTP request supporting GET, POST, PUT, DELETE."""
    if not HTTP_LIB_AVAILABLE:
        return {"error": "No HTTP library available"}

    method = method.upper()
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            req_start = time.perf_counter()
            if method == "GET":
                response = await client.get(url, headers=headers or {})
            elif method == "POST":
                response = await client.post(url, json=data, headers=headers or {})
            elif method == "PUT":
                response = await client.put(url, json=data, headers=headers or {})
            elif method == "DELETE":
                response = await client.delete(url, headers=headers or {})
            else:
                return {"error": f"Unsupported HTTP method: {method}"}

            duration_ms = int((time.perf_counter() - req_start) * 1000)
            response.raise_for_status()
            result = {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "duration_ms": duration_ms,
            }
            if response.text:
                result["content"] = response.text
                result["data"] = (
                    response.json() if "application/json" in response.headers.get("content-type", "") else None
                )
            return result
    except Exception as e:
        return {"error": f"HTTP {method} failed: {str(e)}"}


async def json_parse(data: str | dict) -> dict[str, Any]:
    """Parse JSON string to dict, or return dict if already parsed."""
    if isinstance(data, dict):
        return data

    try:
        return json.loads(data)
    except Exception as e:
        return {"error": f"JSON parse failed: {str(e)}"}


async def json_stringify(data: Any, indent: int = 2) -> str:
    """Convert any data type to JSON string."""
    try:
        return json.dumps(data, indent=indent, default=str)
    except Exception as e:
        return {"error": f"JSON stringify failed: {str(e)}"}


async def dict_get_path(data: dict[str, Any], path: str, default: Any = None) -> Any:
    """Get nested value from dict using dot notation (e.g., 'user.address.city')."""
    keys = path.split(".")
    current = data

    for key in keys:
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            return default

    return current


async def dict_merge(*dicts: dict[str, Any]) -> dict[str, Any]:
    """Merge multiple dictionaries (later values override earlier ones)."""
    merged = {}
    for d in dicts:
        if isinstance(d, dict):
            merged.update(d)
    return merged


async def dict_filter(data: dict[str, Any], keys: list[str]) -> dict[str, Any]:
    """Filter dict to only include specified keys."""
    return {k: v for k, v in data.items() if k in keys}


async def dict_set_path(data: dict[str, Any], path: str, value: Any) -> dict[str, Any]:
    """Set nested value in dict using dot notation."""
    keys = path.split(".")
    current = data

    for key in keys[:-1]:
        if not isinstance(current, dict):
            current[key] = {}
        current = current[key]

    if not isinstance(current, dict):
        current = {}

    current[keys[-1]] = value
    return data


async def sleep(seconds: float) -> dict[str, Any]:
    """Async sleep with configurable duration."""
    await asyncio.sleep(seconds)
    return {"slept": seconds}


async def uuid_generate() -> str:
    """Generate UUID v4 string."""
    import uuid

    return str(uuid.uuid4())


WORKFLOW_FUNCTIONS = {
    "http_get": http_get,
    "http_post": http_post,
    "http_request": http_request,
    "json_parse": json_parse,
    "json_stringify": json_stringify,
    "dict_get_path": dict_get_path,
    "dict_merge": dict_merge,
    "dict_filter": dict_filter,
    "dict_set_path": dict_set_path,
    "string_format": string_format,
    "string_replace": string_replace,
    "string_concat": string_concat,
    "string_join": string_join,
    "string_split": string_split,
    "string_to_lower": string_to_lower,
    "string_to_upper": string_to_upper,
    "string_strip": string_strip,
    "string_length": string_length,
    "sleep": sleep,
    "current_timestamp": current_timestamp,
    "uuid_generate": uuid_generate,
    "base64_encode": base64_encode,
    "base64_decode": base64_decode,
    "run_shell_command": run_shell_command,
}
