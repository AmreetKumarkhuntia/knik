"""
Workflow function implementations for FunctionExecutionNode.

These functions are called by workflow engine and are NOT exposed as MCP tools.
All functions are async and return dict results.
"""

import asyncio
import json
import logging
import time
from datetime import datetime
from typing import Any


# Try to import HTTP libraries, fall back to what's available
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


logger = logging.getLogger(__name__)


# ========================
# HTTP FUNCTIONS
# ========================


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


# ========================
# DATA PROCESSING
# ========================


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


# ========================
# STRING/TEXT FUNCTIONS
# ========================


async def string_format(template: str, **kwargs: str | int | float) -> str:
    """Format string using Python format syntax."""
    try:
        return template.format(**kwargs)
    except Exception as e:
        return {"error": f"String format failed: {str(e)}"}


async def string_replace(text: str, old: str, new: str) -> str:
    """Replace all occurrences of substring."""
    return text.replace(old, new)


async def string_concat(*strings: str) -> str:
    """Concatenate multiple strings."""
    return "".join(strings)


async def string_join(separator: str, *strings: str) -> str:
    """Join multiple strings with separator."""
    return separator.join(strings)


async def string_split(text: str, separator: str) -> list[str]:
    """Split string into list by separator."""
    return text.split(separator)


async def string_to_lower(text: str) -> str:
    """Convert string to lowercase."""
    return text.lower()


async def string_to_upper(text: str) -> str:
    """Convert string to uppercase."""
    return text.upper()


async def string_strip(text: str) -> str:
    """Strip whitespace from both ends."""
    return text.strip()


async def string_length(text: str) -> str:
    """Get length of string."""
    return str(len(text))


# ========================
# UTILITY FUNCTIONS
# ========================


async def sleep(seconds: float) -> dict[str, Any]:
    """Async sleep with configurable duration."""
    await asyncio.sleep(seconds)
    return {"slept": seconds}


async def current_timestamp() -> str:
    """Get current ISO 8601 timestamp."""
    return datetime.now().isoformat()


async def uuid_generate() -> str:
    """Generate UUID v4 string."""
    import uuid

    return str(uuid.uuid4())


async def base64_encode(data: str | bytes) -> str:
    """Encode data to Base64 string."""
    import base64

    if isinstance(data, str):
        data = data.encode()
    return base64.b64encode(data).decode()


async def base64_decode(data: str) -> str:
    """Decode Base64 string to original data."""
    import base64

    return base64.b64decode(data).decode()


# ========================
# SHELL FUNCTIONS
# ========================


async def run_shell_command(command: str, timeout: int = 30) -> dict[str, Any]:
    """Run a shell command and return its stdout, stderr, return code, and duration."""
    req_start = time.perf_counter()
    try:
        proc = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout_bytes, stderr_bytes = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        except TimeoutError:
            proc.kill()
            await proc.communicate()
            return {"error": f"Command timed out after {timeout}s: {command}"}

        duration_ms = int((time.perf_counter() - req_start) * 1000)
        stdout = stdout_bytes.decode(errors="replace").strip()
        stderr = stderr_bytes.decode(errors="replace").strip()

        return {
            "result": stdout,
            "stderr": stderr,
            "return_code": proc.returncode,
            "duration_ms": duration_ms,
        }
    except Exception as e:
        return {"error": f"Shell command failed: {str(e)}"}


# ========================
# FUNCTION REGISTRY
# ========================

WORKFLOW_FUNCTIONS = {
    # HTTP Functions
    "http_get": http_get,
    "http_post": http_post,
    "http_request": http_request,
    # Data Processing Functions
    "json_parse": json_parse,
    "json_stringify": json_stringify,
    "dict_get_path": dict_get_path,
    "dict_merge": dict_merge,
    "dict_filter": dict_filter,
    "dict_set_path": dict_set_path,
    # String/Text Functions
    "string_format": string_format,
    "string_replace": string_replace,
    "string_concat": string_concat,
    "string_join": string_join,
    "string_split": string_split,
    "string_to_lower": string_to_lower,
    "string_to_upper": string_to_upper,
    "string_strip": string_strip,
    "string_length": string_length,
    # Utility Functions
    "sleep": sleep,
    "current_timestamp": current_timestamp,
    "uuid_generate": uuid_generate,
    "base64_encode": base64_encode,
    "base64_decode": base64_decode,
    # Shell Functions
    "run_shell_command": run_shell_command,
}
