"""
MCP utility tool implementations.

Wraps common async functions with sync interfaces for MCP tools.
Functions unique to MCP (calculate) remain inline.
"""

import math

from lib.services.text import string_reverse as _async_string_reverse
from lib.services.time import get_current_date as _async_get_current_date
from lib.services.time import get_current_time as _async_get_current_time
from lib.utils.async_utils import run_async
from lib.utils.printer import printer


# Shared safe functions for both simple and advanced calculations
_SAFE_MATH_FUNCTIONS = {
    "abs": abs,
    "round": round,
    "pow": pow,
    "min": min,
    "max": max,
    "sum": sum,
    "sqrt": math.sqrt,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "asin": math.asin,
    "acos": math.acos,
    "atan": math.atan,
    "log": math.log,
    "log10": math.log10,
    "log2": math.log2,
    "exp": math.exp,
    "ceil": math.ceil,
    "floor": math.floor,
    "factorial": math.factorial,
    "gcd": math.gcd,
    "pi": math.pi,
    "e": math.e,
    "tau": math.tau,
}


def calculate(expression: str, precision: int = -1) -> str:
    """Calculate mathematical expression. Use precision=-1 for no rounding, or specify decimal places."""
    if precision > 0:
        printer.info(f"Calculating: {expression} (precision={precision})")
    else:
        printer.info(f"Calculating: {expression}")

    try:
        safe_dict = {"__builtins__": {}, **_SAFE_MATH_FUNCTIONS}
        result = eval(expression, safe_dict)

        if isinstance(result, int | float) and precision >= 0:
            result = round(result, precision)

        return str(result)
    except Exception as e:
        return f"Error: {str(e)}"


def get_current_time(timezone: str = "UTC") -> str:
    """Get the current date and time in the specified timezone."""
    printer.info(f"Getting current time (timezone: {timezone})")
    return run_async(_async_get_current_time(timezone))


def get_current_date() -> str:
    """Get current date in YYYY-MM-DD format."""
    printer.info("Getting current date")
    return run_async(_async_get_current_date())


def reverse_string(text: str) -> str:
    """Reverse a string."""
    printer.info(f"Reversing string ({len(text)} characters)")
    return run_async(_async_string_reverse(text))


UTILS_IMPLEMENTATIONS = {
    "calculate": calculate,
    "get_current_time": get_current_time,
    "get_current_date": get_current_date,
    "reverse_string": reverse_string,
}
