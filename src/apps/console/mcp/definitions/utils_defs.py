UTILS_DEFINITIONS = [
    {
        "name": "calculate",
        "description": "Safely evaluate mathematical expressions. Supports basic operations (+, -, *, /, **, %), and functions like sqrt, sin, cos, log, etc.",
        "parameters": {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "Mathematical expression to evaluate (e.g., '2 + 2', 'sqrt(16)', 'sin(pi/2)')"
                }
            },
            "required": ["expression"]
        }
    },
    {
        "name": "advanced_calculate",
        "description": "Advanced calculator supporting complex mathematical expressions with functions like sqrt, sin, cos, tan, log, factorial, etc. Includes precision control.",
        "parameters": {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "Mathematical expression to evaluate"
                },
                "precision": {
                    "type": "integer",
                    "description": "Decimal precision for result (default: 2)",
                    "default": 2
                }
            },
            "required": ["expression"]
        }
    },
    {
        "name": "get_current_time",
        "description": "Get the current time",
        "parameters": {
            "type": "object",
            "properties": {
                "timezone": {
                    "type": "string",
                    "description": "Timezone (default: 'local')",
                    "default": "local"
                }
            }
        }
    },
    {
        "name": "get_current_date",
        "description": "Get the current date",
        "parameters": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "reverse_string",
        "description": "Reverse a string",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "String to reverse"
                }
            },
            "required": ["text"]
        }
    },
    {
        "name": "count_words",
        "description": "Count words in a text",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "Text to count words in"
                }
            },
            "required": ["text"]
        }
    }
]
