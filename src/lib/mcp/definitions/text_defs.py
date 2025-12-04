TEXT_DEFINITIONS = [
    {
        "name": "word_count",
        "description": "Count words, characters, and lines in text",
        "parameters": {
            "type": "object",
            "properties": {"text": {"type": "string", "description": "Text to analyze"}},
            "required": ["text"],
        },
    },
    {
        "name": "find_and_replace",
        "description": "Find and replace text in a string",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to process"},
                "find": {"type": "string", "description": "Text to find"},
                "replace": {"type": "string", "description": "Text to replace with"},
                "case_sensitive": {
                    "type": "boolean",
                    "description": "Whether search is case-sensitive (default: true)",
                    "default": True,
                },
            },
            "required": ["text", "find", "replace"],
        },
    },
    {
        "name": "extract_emails",
        "description": "Extract email addresses from text",
        "parameters": {
            "type": "object",
            "properties": {"text": {"type": "string", "description": "Text to extract emails from"}},
            "required": ["text"],
        },
    },
    {
        "name": "extract_urls",
        "description": "Extract URLs from text",
        "parameters": {
            "type": "object",
            "properties": {"text": {"type": "string", "description": "Text to extract URLs from"}},
            "required": ["text"],
        },
    },
    {
        "name": "text_case_convert",
        "description": "Convert text to different cases (upper, lower, title, capitalize, snake_case, camelCase, kebab-case)",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to convert"},
                "case_type": {
                    "type": "string",
                    "description": "Case type: upper, lower, title, capitalize, snake, camel, kebab",
                },
            },
            "required": ["text", "case_type"],
        },
    },
]
