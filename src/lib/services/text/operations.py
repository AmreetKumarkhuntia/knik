"""
Common string/text manipulation functions.

Provides async string utilities shared between the scheduler workflow engine
and MCP tool layer.
"""


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


async def string_reverse(text: str) -> str:
    """Reverse a string."""
    return text[::-1]
