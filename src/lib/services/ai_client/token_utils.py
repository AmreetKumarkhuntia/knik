"""Token counting utilities using tiktoken.

Provides functions for counting tokens in text and message lists,
used for context window management and summarization triggering.

Context window sizes are resolved in this priority order:
1. Runtime cache — populated by provider ``get_models()`` API calls
2. ``Config.AI_MODELS_CONTEXT_WINDOWS`` — configurable static fallback
3. ``DEFAULT_CONTEXT_WINDOW`` — conservative last-resort value
"""

from __future__ import annotations

import json
from typing import Any

from ...core.config import Config


try:
    import tiktoken

    TIKTOKEN_AVAILABLE = True
except ImportError:
    TIKTOKEN_AVAILABLE = False


_DEFAULT_ENCODING = "cl100k_base"
_encoder_cache: dict[str, Any] = {}


def _get_encoder(model: str) -> Any:
    """Get a tiktoken encoder for the given model.

    Falls back to cl100k_base for models not recognized by tiktoken
    (e.g., Gemini, GLM, ZhipuAI models).
    """
    if not TIKTOKEN_AVAILABLE:
        return None

    if model in _encoder_cache:
        return _encoder_cache[model]

    try:
        encoder = tiktoken.encoding_for_model(model)
    except KeyError:
        encoder = tiktoken.get_encoding(_DEFAULT_ENCODING)

    _encoder_cache[model] = encoder
    return encoder


def count_tokens(text: str, model: str = "gpt-4") -> int:
    """Count the number of tokens in a text string.

    Args:
        text: The text to count tokens for.
        model: The model name (used to select the right tokenizer).
               Falls back to cl100k_base for unknown models.

    Returns:
        Token count. Returns an approximate word-based estimate if
        tiktoken is not installed.
    """
    encoder = _get_encoder(model)
    if encoder is None:
        # Rough fallback: ~4 chars per token for English text
        return max(1, len(text) // 4)

    return len(encoder.encode(text))


def count_message_tokens(messages: list[dict[str, Any]], model: str = "gpt-4") -> int:
    """Count tokens for a list of chat messages.

    Accounts for the per-message overhead that chat models add
    (role tokens, formatting tokens, etc.).

    Each message contributes:
      - 4 tokens of overhead (role, delimiters)
      - tokens for the content
      - tokens for any tool_calls (serialized as JSON)

    Plus 3 tokens for the overall reply priming.

    Args:
        messages: List of message dicts with at least "role" and "content" keys.
        model: The model name for tokenizer selection.

    Returns:
        Total token count including overhead.
    """
    encoder = _get_encoder(model)
    if encoder is None:
        total = 0
        for msg in messages:
            content = msg.get("content", "")
            if isinstance(content, str):
                total += max(1, len(content) // 4)
            tool_calls = msg.get("tool_calls")
            if tool_calls:
                total += max(1, len(json.dumps(tool_calls)) // 4)
        return total + len(messages) * 4 + 3

    tokens_per_message = 4

    total = 0
    for msg in messages:
        total += tokens_per_message

        content = msg.get("content", "")
        if isinstance(content, str) and content:
            total += len(encoder.encode(content))
        elif isinstance(content, list):
            for part in content:
                if isinstance(part, dict) and part.get("type") == "text":
                    text = part.get("text", "")
                    if text:
                        total += len(encoder.encode(text))

        role = msg.get("role", "")
        if role:
            total += len(encoder.encode(role))

        name = msg.get("name", "")
        if name:
            total += len(encoder.encode(name)) + 1  # +1 for name separator

        tool_calls = msg.get("tool_calls")
        if tool_calls:
            tool_calls_str = json.dumps(tool_calls)
            total += len(encoder.encode(tool_calls_str))

    # Every reply is primed with 3 tokens: <|start|>assistant<|message|>
    total += 3

    return total


# ---------------------------------------------------------------------------
# Context window resolution
# ---------------------------------------------------------------------------

# Runtime cache populated by provider get_models() API calls.
# Highest priority — always checked first.
_context_window_cache: dict[str, int] = {}

DEFAULT_CONTEXT_WINDOW = 8_192


def register_context_window(model_id: str, context_window: int) -> None:
    """Register a dynamically-discovered context window size.

    Called by providers after a successful ``get_models()`` API call so
    that ``get_context_window()`` returns real values without relying on
    the static fallback.
    """
    if model_id and context_window and context_window > 0:
        _context_window_cache[model_id] = context_window


def get_context_window(model: str) -> int:
    """Get the context window size for a model.

    Resolution order:
    1. Runtime cache (populated by provider API discovery)
    2. Config.AI_MODELS_CONTEXT_WINDOWS (configurable static fallback)
    3. DEFAULT_CONTEXT_WINDOW (conservative last-resort)

    Args:
        model: The model name/ID.

    Returns:
        Context window size in tokens.
    """
    # 1. Runtime cache — populated dynamically from provider APIs
    if model in _context_window_cache:
        return _context_window_cache[model]

    # 2. Static fallback from Config
    if model in Config.AI_MODELS_CONTEXT_WINDOWS:
        return Config.AI_MODELS_CONTEXT_WINDOWS[model]

    # 3. Last-resort default
    return DEFAULT_CONTEXT_WINDOW
