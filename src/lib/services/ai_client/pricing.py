"""Model pricing lookup.

Fetches per-token rates from the LiteLLM community pricing database
(https://github.com/BerriAI/litellm) on first use and caches the
result for the lifetime of the process.  A bundled static fallback
covers Gemini 1.x models that are absent from the remote source.

Usage::

    from lib.services.ai_client.pricing import get_cost

    cost = get_cost("gemini-2.5-flash", input_tokens=1000, output_tokens=500)
    # cost is a float (USD) or None when the model is unknown / pricing unavailable
"""

from __future__ import annotations

import logging
from typing import Any


logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Remote source
# ---------------------------------------------------------------------------

_LITELLM_URL = "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json"
_FETCH_TIMEOUT_SECONDS = 5

# Module-level cache — None means "not fetched yet", {} means "fetched but empty"
_remote_prices: dict[str, Any] | None = None
_remote_fetch_attempted: bool = False

# ---------------------------------------------------------------------------
# Static fallback for models absent from LiteLLM
# Keys are bare model name strings exactly as used in the codebase.
# Costs are in USD per *single* token.
# Source: https://ai.google.dev/pricing (as of 2025-04)
# ---------------------------------------------------------------------------
_STATIC_PRICES: dict[str, dict[str, float]] = {
    # Gemini 1.5
    "gemini-1.5-flash": {"input": 0.075 / 1_000_000, "output": 0.30 / 1_000_000},
    "gemini-1.5-flash-8b": {"input": 0.0375 / 1_000_000, "output": 0.15 / 1_000_000},
    "gemini-1.5-pro": {"input": 1.25 / 1_000_000, "output": 5.00 / 1_000_000},
    # Gemini 1.0
    "gemini-1.0-pro": {"input": 0.50 / 1_000_000, "output": 1.50 / 1_000_000},
}

# ---------------------------------------------------------------------------
# Providers for which we will never have pricing (skip remote lookup noise)
# ---------------------------------------------------------------------------
_NO_PRICING_MODELS = frozenset({"mock-model"})
_NO_PRICING_PREFIXES = ("glm-",)


def _should_skip(model: str) -> bool:
    """Return True for models we know will never have pricing data."""
    if model in _NO_PRICING_MODELS:
        return True
    lower = model.lower()
    return any(lower.startswith(prefix) for prefix in _NO_PRICING_PREFIXES)


def _fetch_remote() -> dict[str, Any] | None:
    """Fetch the LiteLLM pricing JSON.  Returns the parsed dict or None."""
    try:
        import requests  # already a project dependency

        response = requests.get(_LITELLM_URL, timeout=_FETCH_TIMEOUT_SECONDS)
        response.raise_for_status()
        return response.json()
    except Exception as exc:
        logger.debug("Could not fetch remote pricing data: %s", exc)
        return None


def _get_remote_prices() -> dict[str, Any]:
    """Return the cached remote pricing dict, fetching it on first call."""
    global _remote_prices, _remote_fetch_attempted
    if not _remote_fetch_attempted:
        _remote_fetch_attempted = True
        result = _fetch_remote()
        _remote_prices = result if result is not None else {}
    return _remote_prices or {}


def _lookup(model: str) -> dict[str, float] | None:
    """Return ``{"input": cost_per_token, "output": cost_per_token}`` or None."""
    # 1. Try remote LiteLLM database (covers Gemini 2.x, OpenAI, etc.)
    remote = _get_remote_prices()
    entry = remote.get(model)
    if entry and isinstance(entry, dict):
        input_cost = entry.get("input_cost_per_token")
        output_cost = entry.get("output_cost_per_token")
        if input_cost is not None and output_cost is not None:
            return {"input": float(input_cost), "output": float(output_cost)}

    # 2. Fall back to bundled static table (Gemini 1.x)
    if model in _STATIC_PRICES:
        return _STATIC_PRICES[model]

    return None


def get_cost(model: str, input_tokens: int, output_tokens: int) -> float | None:
    """Calculate the estimated USD cost for a given token usage.

    Args:
        model: Bare model name string, e.g. ``"gemini-2.5-flash"`` or ``"gpt-4o"``.
        input_tokens: Number of input (prompt) tokens consumed.
        output_tokens: Number of output (completion) tokens produced.

    Returns:
        Estimated cost in USD as a float, or ``None`` when the model's
        pricing is unavailable (GLM models, custom deployments, etc.).
    """
    if _should_skip(model):
        return None

    prices = _lookup(model)
    if prices is None:
        return None

    return input_tokens * prices["input"] + output_tokens * prices["output"]
