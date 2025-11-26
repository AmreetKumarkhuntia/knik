# AI Client - Quick Reference

## Overview

Clean, minimal AI client with proper exception handling and provider abstraction.

## Usage

### Basic Query

```python
import sys
sys.path.insert(0, 'src')

from lib import AIClient

ai = AIClient()  # Auto-falls back to mock if not configured
response = ai.query("What is AI?", max_tokens=2048)
print(response)
```

### With Vertex AI

```python
import sys
sys.path.insert(0, 'src')

from lib import AIClient

# Set env var first
# export GOOGLE_CLOUD_PROJECT="your-project-id"

ai = AIClient(
    provider="vertex",
    project_id="your-project-id",
    location="us-central1",
    model_name="gemini-1.5-flash"
)
response = ai.query("Explain machine learning", max_tokens=2048)
```

### With Conversation Context

```python
import sys
sys.path.insert(0, 'src')

from lib import AIClient

ai = AIClient()
context = [
    {"role": "user", "text": "What is AI?"},
    {"role": "model", "text": "AI is..."}
]
response = ai.query("Tell me more", context=context, max_tokens=2048)
```

### With System Instruction

```python
import sys
sys.path.insert(0, 'src')

from lib import AIClient

ai = AIClient()
system_instruction = "You are a helpful coding assistant. Be concise."
response = ai.query(
    "Explain Python classes",
    system_instruction=system_instruction,
    max_tokens=2048,
    temperature=0.7
)
```

### Mock for Testing

```python
import sys
sys.path.insert(0, 'src')

from lib import MockAIClient

ai = MockAIClient()  # No credentials needed
response = ai.query("Test query")
```

## Configuration

### Environment Variable

```bash
export GOOGLE_CLOUD_PROJECT="your-project-id"
```

### In Code

```python
import sys
sys.path.insert(0, 'src')

from lib import AIClient

ai = AIClient(
    provider="vertex",
    project_id="your-project-id",
    location="us-central1",
    model_name="gemini-1.5-flash"
)
```

## Features

✅ **Clean & Concise** - Minimal comments, focused code  
✅ **Proper Exception Handling** - All exceptions chain with `from e`  
✅ **Auto-Fallback** - Falls back to mock if not configured  
✅ **Provider Pattern** - Easy to add new AI providers  
✅ **Lazy Loading** - Initializes only when needed  

## Architecture

```
AIClient (Unified Interface)
├── VertexAIProvider (Google Gemini)
└── MockAIProvider (Testing)
```

Add new providers by extending `BaseAIProvider`.

## Exception Handling

All exceptions properly chain:
```python
try:
    response = ai.query("test")
except RuntimeError as e:
    print(f"Error: {e}")
    # Shows full exception chain
```

## Info

```python
info = ai.get_info()
# {
#   'provider': 'Vertex AI',
#   'project_id': '...',
#   'configured': True,
#   'initialized': True
# }
```

## See Also

- [AI Client Guide](./ai_client_guide.md) - Complete documentation
- [Library Reference](./library_reference.md) - API reference
