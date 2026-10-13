"""Base64 helpers shared by the workflow engine and the tools (async for the workflow function registry)."""

import base64


async def base64_encode(data: str | bytes) -> str:
    """Encode data to Base64 string.

    Args:
        data: String or bytes to encode.

    Returns:
        Base64-encoded string.
    """
    if isinstance(data, str):
        data = data.encode()
    return base64.b64encode(data).decode()


async def base64_decode(data: str) -> str:
    """Decode Base64 string to original data.

    Args:
        data: Base64-encoded string.

    Returns:
        Decoded string.
    """
    return base64.b64decode(data).decode()
