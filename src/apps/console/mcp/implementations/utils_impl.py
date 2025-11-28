import operator
import math
from datetime import datetime


def calculate(expression: str) -> str:
    safe_functions = {
        'abs': abs,
        'round': round,
        'sqrt': math.sqrt,
        'sin': math.sin,
        'cos': math.cos,
        'tan': math.tan,
        'log': math.log,
        'log10': math.log10,
        'exp': math.exp,
        'ceil': math.ceil,
        'floor': math.floor,
        'pi': math.pi,
        'e': math.e,
    }
    
    try:
        safe_dict = {"__builtins__": {}}
        safe_dict.update(safe_functions)
        result = eval(expression, safe_dict)
        return str(result)
    except Exception as e:
        return f"Error calculating '{expression}': {str(e)}"


def advanced_calculate(expression: str, precision: int = 2) -> str:
    safe_functions = {
        'abs': abs,
        'round': round,
        'sqrt': math.sqrt,
        'sin': math.sin,
        'cos': math.cos,
        'tan': math.tan,
        'asin': math.asin,
        'acos': math.acos,
        'atan': math.atan,
        'log': math.log,
        'log10': math.log10,
        'log2': math.log2,
        'exp': math.exp,
        'ceil': math.ceil,
        'floor': math.floor,
        'factorial': math.factorial,
        'gcd': math.gcd,
        'pi': math.pi,
        'e': math.e,
        'tau': math.tau,
        'pow': pow,
        'min': min,
        'max': max,
        'sum': sum,
    }
    
    try:
        safe_dict = {"__builtins__": {}}
        safe_dict.update(safe_functions)
        result = eval(expression, safe_dict)
        
        if isinstance(result, (int, float)) and precision > 0:
            result = round(result, precision)
        
        return str(result)
    except Exception as e:
        return f"Error: {str(e)}"


def get_current_time(timezone: str = "local") -> str:
    now = datetime.now()
    return now.strftime("%Y-%m-%d %H:%M:%S")


def get_current_date() -> str:
    now = datetime.now()
    return now.strftime("%Y-%m-%d")


def reverse_string(text: str) -> str:
    return text[::-1]


def count_words(text: str) -> str:
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
