import math

from lib.services.ai_client.base_tool import BaseTool


UTILS_DEFINITIONS = [
    {
        "name": "calculate",
        "description": "Safely evaluate mathematical expressions. Supports basic operations (+, -, *, /, **, %), and functions like sqrt, sin, cos, log, etc. Use precision=-1 for no rounding, or specify decimal places.",
        "parameters": {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "Mathematical expression to evaluate (e.g., '2 + 2', 'sqrt(16)', 'sin(pi/2)')",
                },
                "precision": {
                    "type": "integer",
                    "description": "Decimal precision for result (default: -1 for no rounding)",
                    "default": -1,
                },
            },
            "required": ["expression"],
        },
    },
    {
        "name": "get_current_time",
        "description": "Get the current time",
        "parameters": {
            "type": "object",
            "properties": {
                "timezone": {"type": "string", "description": "Timezone (default: 'local')", "default": "local"}
            },
        },
    },
    {
        "name": "get_current_date",
        "description": "Get the current date",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "name": "reverse_string",
        "description": "Reverse a string",
        "parameters": {
            "type": "object",
            "properties": {"text": {"type": "string", "description": "String to reverse"}},
            "required": ["text"],
        },
    },
]
from lib.services.text import string_reverse as _async_string_reverse
from lib.services.time import get_current_date as _async_get_current_date
from lib.services.time import get_current_time as _async_get_current_time
from lib.utils.async_utils import run_async
from lib.utils.printer import printer


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


class UtilsTool(BaseTool):
    @property
    def name(self) -> str:
        return "utils"

    def get_definitions(self):
        return UTILS_DEFINITIONS

    def get_implementations(self):
        return {
            "calculate": self._calculate,
            "get_current_time": self._get_current_time,
            "get_current_date": self._get_current_date,
            "reverse_string": self._reverse_string,
        }

    @staticmethod
    def _calculate(expression: str, precision: int = -1) -> str:
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

    @staticmethod
    def _get_current_time(timezone: str = "UTC") -> str:
        printer.info(f"Getting current time (timezone: {timezone})")
        return run_async(_async_get_current_time(timezone))

    @staticmethod
    def _get_current_date() -> str:
        printer.info("Getting current date")
        return run_async(_async_get_current_date())

    @staticmethod
    def _reverse_string(text: str) -> str:
        printer.info(f"Reversing string ({len(text)} characters)")
        return run_async(_async_string_reverse(text))
