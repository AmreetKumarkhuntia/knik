# MCP Tools

Model Context Protocol tools for the Knik console application.

## Structure

```
mcp/
├── definitions/          # Tool schemas (JSON)
│   ├── utils_defs.py    # Utility tools
│   └── text_defs.py     # Text processing tools
├── implementations/      # Function implementations
│   ├── utils_impl.py
│   └── text_impl.py
└── index.py             # Registry
```

## Adding Tools

### 1. Add definition

In `definitions/your_category_defs.py`:

```python
YOUR_DEFINITIONS = [
    {
        "name": "tool_name",
        "description": "What the tool does",
        "parameters": {
            "type": "object",
            "properties": {
                "param": {"type": "string", "description": "..."}
            },
            "required": ["param"]
        }
    }
]
```

### 2. Add implementation

In `implementations/your_category_impl.py`:

```python
def tool_name(param: str) -> str:
    return f"Result: {param}"

YOUR_IMPLEMENTATIONS = {"tool_name": tool_name}
```

### 3. Register

Update `definitions/__init__.py`:
```python
from .your_category_defs import YOUR_DEFINITIONS
ALL_DEFINITIONS = ... + YOUR_DEFINITIONS
```

Update `implementations/__init__.py`:
```python
from .your_category_impl import YOUR_IMPLEMENTATIONS
ALL_IMPLEMENTATIONS = {**..., **YOUR_IMPLEMENTATIONS}
```

Done! Tools auto-register on startup.

## Guidelines

- Keep functions simple and fast
- Return strings (even for errors)
- Use type hints
- Self-documenting code (no comments)
- Handle errors gracefully

## See Also

- [docs/MCP.md](../../../docs/MCP.md) - Complete MCP documentation
- [docs/CONSOLE.md](../../../docs/CONSOLE.md) - Using tools in console
