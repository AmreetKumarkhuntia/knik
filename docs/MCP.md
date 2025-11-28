# MCP Tools System

Model Context Protocol (MCP) tools extend the AI assistant's capabilities with executable functions.

## Overview

The MCP system in Knik allows the AI to:
- Perform calculations
- Process text
- Get current time/date
- Extract information from text
- And more...

## Architecture

```
src/apps/console/mcp/
├── definitions/          # Tool schemas (what AI sees)
│   ├── utils_defs.py    # Utility tool schemas
│   └── text_defs.py     # Text processing schemas
├── implementations/      # Tool code (what executes)
│   ├── utils_impl.py    # Utility functions
│   └── text_impl.py     # Text processing functions
└── index.py             # Registry (connects them)
```

**Key Principle:** Clean separation between interface (definitions) and implementation (code).

## Built-in Tools

### Utility Tools (6)

**calculate**
```python
expression: str  # e.g., "2 + 2", "sqrt(16)"
```
Basic math with operators (+, -, *, /, **, %) and functions (sqrt, sin, cos, log, etc.)

**advanced_calculate**
```python
expression: str
precision: int = 2  # Decimal places
```
Extended math with factorial, gcd, more trig functions, and precision control.

**get_current_time**
```python
timezone: str = "local"
```
Returns current timestamp.

**get_current_date**
```python
# No parameters
```
Returns today's date.

**reverse_string**
```python
text: str
```
Reverses the input text.

**count_words**
```python
text: str
```
Counts words in text.

### Text Processing Tools (5)

**word_count**
```python
text: str
```
Returns detailed statistics: words, characters, characters (no spaces), lines.

**find_and_replace**
```python
text: str
find: str
replace: str
case_sensitive: bool = True
```
Find and replace text with optional case sensitivity.

**extract_emails**
```python
text: str
```
Extracts all email addresses from text.

**extract_urls**
```python
text: str
```
Extracts all URLs from text.

**text_case_convert**
```python
text: str
case_type: str  # upper, lower, title, capitalize, snake, camel, kebab
```
Converts text between different casing styles.

## Using Tools

The AI automatically uses tools when appropriate:

```
You: What's 15 * 8 + 20?
AI: [uses calculate tool]
The result is 140.

You: Extract emails from: contact@example.com and support@demo.org
AI: [uses extract_emails tool]
Found: contact@example.com, support@demo.org

You: Convert "HelloWorld" to snake_case
AI: [uses text_case_convert tool]
Result: hello_world
```

View available tools:
```
You: /tools
```

## Creating Custom Tools

### Step 1: Create Definition

Create `src/apps/console/mcp/definitions/my_tools_defs.py`:

```python
MY_TOOLS_DEFINITIONS = [
    {
        "name": "tool_name",
        "description": "Clear description for AI about when to use this",
        "parameters": {
            "type": "object",
            "properties": {
                "param1": {
                    "type": "string",
                    "description": "What param1 is for"
                },
                "param2": {
                    "type": "integer",
                    "description": "What param2 is for",
                    "default": 10
                }
            },
            "required": ["param1"]
        }
    }
]
```

### Step 2: Create Implementation

Create `src/apps/console/mcp/implementations/my_tools_impl.py`:

```python
def tool_name(param1: str, param2: int = 10) -> str:
    result = f"{param1} processed with {param2}"
    return result

MY_TOOLS_IMPLEMENTATIONS = {
    "tool_name": tool_name,
}
```

### Step 3: Register

Update `definitions/__init__.py`:
```python
from .my_tools_defs import MY_TOOLS_DEFINITIONS

ALL_DEFINITIONS = UTILS_DEFINITIONS + TEXT_DEFINITIONS + MY_TOOLS_DEFINITIONS
```

Update `implementations/__init__.py`:
```python
from .my_tools_impl import MY_TOOLS_IMPLEMENTATIONS

ALL_IMPLEMENTATIONS = {
    **UTILS_IMPLEMENTATIONS, 
    **TEXT_IMPLEMENTATIONS,
    **MY_TOOLS_IMPLEMENTATIONS
}
```

Tools auto-register on startup!

## Tool Schema Reference

### Parameter Types

- `string` - Text input
- `integer` - Whole numbers
- `number` - Integers or floats
- `boolean` - true/false
- `array` - Lists
- `object` - Nested objects

### Required Fields

**Tool Definition:**
- `name` - Unique identifier
- `description` - When/how AI should use it
- `parameters` - JSON Schema object

**Parameters:**
- `type` - Must be "object"
- `properties` - Parameter definitions
- `required` - Array of required param names (optional)

### Best Practices

1. **Clear descriptions** - Help AI understand when to use the tool
2. **Type hints** - Use Python type hints in implementations
3. **Error handling** - Return error messages as strings
4. **Keep focused** - One tool = one purpose
5. **Test edge cases** - Handle invalid inputs gracefully
6. **No comments** - Write self-documenting code

## Examples

### Weather Tool

**Definition:**
```python
{
    "name": "get_weather",
    "description": "Get current weather for a city",
    "parameters": {
        "type": "object",
        "properties": {
            "city": {
                "type": "string",
                "description": "City name"
            },
            "units": {
                "type": "string",
                "description": "Temperature units: celsius or fahrenheit",
                "default": "celsius"
            }
        },
        "required": ["city"]
    }
}
```

**Implementation:**
```python
def get_weather(city: str, units: str = "celsius") -> str:
    # In real implementation, call weather API
    return f"Weather in {city}: 22°C, Sunny"
```

### File Reader Tool

**Definition:**
```python
{
    "name": "read_file",
    "description": "Read contents of a text file",
    "parameters": {
        "type": "object",
        "properties": {
            "filepath": {
                "type": "string",
                "description": "Path to file"
            },
            "max_lines": {
                "type": "integer",
                "description": "Maximum lines to read",
                "default": 100
            }
        },
        "required": ["filepath"]
    }
}
```

**Implementation:**
```python
def read_file(filepath: str, max_lines: int = 100) -> str:
    try:
        with open(filepath, 'r') as f:
            lines = f.readlines()[:max_lines]
        return ''.join(lines)
    except Exception as e:
        return f"Error reading file: {str(e)}"
```

## Debugging

**Check registration:**
```
You: /tools
```

**Enable logs:**
```bash
export KNIK_SHOW_LOGS=True
```

**Test manually:**
```python
from apps.console.mcp.implementations.utils_impl import calculate

result = calculate("2 + 2")
print(result)  # "4"
```

## Security

- Tools run with application permissions
- Sanitize file paths
- Validate inputs
- Avoid shell commands
- Don't expose sensitive data
- Consider rate limiting for expensive operations

## Performance

- Keep tools fast (< 1 second)
- Use async for long operations
- Cache results when appropriate
- Stream large outputs
- Set reasonable defaults

## See Also

- [CONSOLE.md](CONSOLE.md) - Using MCP tools in console
- [API.md](API.md) - AIClient and tool registration API
- [apps/console/MCP_IMPLEMENTATION.md](apps/console/MCP_IMPLEMENTATION.md) - Quick implementation guide
