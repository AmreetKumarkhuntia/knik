"""
Async utility functions for bridging sync and async code.
"""

import asyncio
from typing import Any


def run_async(coro: Any) -> Any:
    """Run an async coroutine synchronously.

    Handles the case where an event loop is already running by applying
    nest_asyncio to allow nested event loops. This is necessary because
    MCP tool implementations are synchronous but need to call async
    scheduler/database code.

    Args:
        coro: An awaitable coroutine to execute synchronously.

    Returns:
        The result of the coroutine execution.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        import nest_asyncio

        nest_asyncio.apply()
        return asyncio.run(coro)
    else:
        return asyncio.run(coro)
