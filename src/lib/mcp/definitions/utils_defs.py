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
