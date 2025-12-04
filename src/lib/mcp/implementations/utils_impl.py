import math
from datetime import datetime

from ...utils.printer import printer


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
        printer.info(f"🔧 Calculating: {expression} (precision={precision})")
    else:
        printer.info(f"🔧 Calculating: {expression}")

    try:
        safe_dict = {"__builtins__": {}, **_SAFE_MATH_FUNCTIONS}
        result = eval(expression, safe_dict)

        if isinstance(result, (int, float)) and precision >= 0:
            result = round(result, precision)

        return str(result)
    except Exception as e:
        return f"Error: {str(e)}"


def advanced_calculate(expression: str, precision: int = 2) -> str:
    """Wrapper for calculate() with default precision=2 for backward compatibility."""
    return calculate(expression, precision)


def get_current_time(timezone: str = "local") -> str:
    printer.info(f"🔧 Getting current time (timezone: {timezone})")
    now = datetime.now()
    return now.strftime("%Y-%m-%d %H:%M:%S")


def get_current_date() -> str:
    printer.info("🔧 Getting current date")
    now = datetime.now()
    return now.strftime("%Y-%m-%d")


def reverse_string(text: str) -> str:
    printer.info(f"🔧 Reversing string ({len(text)} characters)")
    return text[::-1]


def count_words(text: str) -> str:
    printer.info("🔧 Counting words in text")
    words = text.split()
    return str(len(words))


UTILS_IMPLEMENTATIONS = {
    "calculate": calculate,
    "advanced_calculate": advanced_calculate,
    "get_current_time": get_current_time,
    "get_current_date": get_current_date,
    "reverse_string": reverse_string,
    "count_words": count_words,
}
