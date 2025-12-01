# MCP Tools with LangChain Standard Pattern

## Overview

This document explains how Knik implements MCP tool binding following LangChain's standard pattern of binding tools at LLM initialization time rather than at query time.

## Architecture Change

### Before (Query-Time Binding)
```python
# Tools were passed at query time
ai_client.query("prompt", use_tools=True, mcp_registry=MCPServerRegistry)
```

### After (Construction-Time Binding) ✅
```python
# Tools are bound at AIClient initialization
ai_client = AIClient(provider="vertex", mcp_registry=MCPServerRegistry)
ai_client.query("prompt", use_tools=True)  # Tools already bound
```

## Why This Change?

### Follows LangChain Standards
LangChain's recommended pattern is to bind tools to an LLM at initialization:

```python
# LangChain standard pattern
llm = ChatVertexAI(...)
llm_with_tools = llm.bind_tools(tools)  # Bind once at initialization
```

### Benefits
1. **Performance**: Tools are converted and bound once, not on every query
2. **Clean API**: Simpler query interface without registry parameter
3. **Standard Pattern**: Aligns with LangChain ecosystem conventions
4. **Type Safety**: Registry type is checked at initialization, not runtime

## Implementation Details

### 1. BaseAIProvider & LangChainProvider

**BaseAIProvider** abstract methods no longer require `mcp_registry` parameter:
```python
@abstractmethod
def query(self, prompt: str, use_tools: bool = False, **kwargs) -> str:
    pass
```

**LangChainProvider** accepts `mcp_registry` in constructor and binds tools immediately:
```python
def __init__(self, llm, agent, provider_name: str, mcp_registry: Optional['MCPServerRegistry'] = None, **config):
    self._llm_raw = llm  # Raw LLM without tools
    self.mcp_registry = mcp_registry
    
    # Bind tools at initialization following LangChain standard pattern
    if mcp_registry:
        tools = self._create_tool_wrappers(mcp_registry)
        self.llm = llm.bind_tools(tools)  # Tool-bound LLM
    else:
        self.llm = llm
```

**Query methods** use stored registry and bound LLM:
```python
def query(self, prompt: str, use_tools: bool = False, **kwargs) -> str:
    # Use tool-bound LLM if tools requested, otherwise raw LLM
    llm = self.llm if (use_tools and self.mcp_registry) else self._llm_raw
    response = llm.invoke(messages, **kwargs)
    return self._extract_text_from_content(response.content)
```

### 2. Provider Implementations

All provider classes accept `mcp_registry` in constructor:

**VertexAIProvider**:
```python
def __init__(self, ..., mcp_registry: Optional['MCPServerRegistry'] = None, **kwargs):
    llm = ChatVertexAI(...)
    super().__init__(llm=llm, agent=None, provider_name="vertex", 
                     mcp_registry=mcp_registry, ...)
```

**LangChainVertexProvider**:
```python
def __init__(self, ..., mcp_registry: Optional['MCPServerRegistry'] = None, **kwargs):
    llm = ChatVertexAI(...)
    super().__init__(llm=llm, agent=None, provider_name="langchain_vertex",
                     mcp_registry=mcp_registry, ...)
```

**MockAIProvider** (for consistency):
```python
def __init__(self, mcp_registry: 'MCPServerRegistry' = None):
    self.mcp_registry = mcp_registry
    # Mock provider doesn't use tools but accepts registry for consistent interface
```

### 3. AIClient

**Constructor** accepts `mcp_registry` and passes to provider:
```python
def __init__(self, provider: str = "vertex", mcp_registry = None, **provider_kwargs):
    # Pass mcp_registry to provider constructor
    if mcp_registry:
        provider_kwargs['mcp_registry'] = mcp_registry
    
    self._provider = provider_class(**provider_kwargs)
```

**Query methods** simplified (no registry parameter):
```python
def query(self, prompt: str, use_tools: bool = False, **kwargs) -> str:
    return self._provider.query(prompt=prompt, use_tools=use_tools, **kwargs)
```

### 4. Console App Workflow

Simplified registration and initialization:

```python
from lib.services.ai_client.registry import MCPServerRegistry
from lib.mcp import register_all_tools

# Step 1: Register all tools to MCPServerRegistry
tools_registered = register_all_tools(MCPServerRegistry)

# Step 2: Initialize AIClient with registry (tools bound at LLM init)
ai_client = AIClient(
    provider="vertex",
    mcp_registry=MCPServerRegistry,  # Tools bound here
    project_id="...",
    model_name="gemini-2.5-flash"
)

# Step 3: Use AI with tools (already bound)
response = ai_client.query("What's 2+2?", use_tools=True)
```

### 5. MCP Registration Helper

Updated `register_all_tools()` to work directly with registry:

```python
def register_all_tools(registry = None) -> int:
    """Register all MCP tools to the registry."""
    if registry is None:
        from lib.services.ai_client.registry import MCPServerRegistry
        registry = MCPServerRegistry
    
    count = 0
    for tool_def in ALL_DEFINITIONS:
        tool_name = tool_def["name"]
        implementation = ALL_IMPLEMENTATIONS.get(tool_name)
        if implementation:
            registry.register_tool(tool_def, implementation)
            count += 1
    
    return count
```

## Usage Examples

### Basic Usage
```python
from lib.services.ai_client import AIClient
from lib.services.ai_client.registry import MCPServerRegistry
from lib.mcp import register_all_tools

# Register tools first
register_all_tools(MCPServerRegistry)

# Initialize with tools bound
ai_client = AIClient(provider="vertex", mcp_registry=MCPServerRegistry)

# Query with tools (already bound at initialization)
response = ai_client.query("Calculate 15 * 23", use_tools=True)
```

### Without Tools
```python
# Initialize without tools
ai_client = AIClient(provider="vertex")  # No mcp_registry

# Query without tools
response = ai_client.query("Hello, how are you?")
```

### Streaming with Tools
```python
# Tools already bound at initialization
for chunk in ai_client.query_stream("What's the date today?", use_tools=True):
    print(chunk, end="", flush=True)
```

## Migration Guide

If you have existing code using the old pattern:

### Old Pattern ❌
```python
ai_client = AIClient(provider="vertex")
register_all_tools(ai_client)  # Register via AIClient
response = ai_client.query("prompt", use_tools=True, mcp_registry=MCPServerRegistry)
```

### New Pattern ✅
```python
register_all_tools(MCPServerRegistry)  # Register to registry
ai_client = AIClient(provider="vertex", mcp_registry=MCPServerRegistry)  # Bind at init
response = ai_client.query("prompt", use_tools=True)  # No registry param
```

## Benefits Summary

1. **LangChain Standard**: Follows established LangChain patterns for tool binding
2. **One-Time Binding**: Tools converted and bound once at initialization
3. **Cleaner API**: Query methods don't need registry parameter
4. **Better Performance**: No repeated tool conversion on each query
5. **Type Safety**: Registry validated at construction time
6. **Consistent Interface**: All providers follow same pattern

## Technical Notes

- **Tool Binding**: Uses LangChain's `llm.bind_tools()` method
- **Raw LLM Storage**: Both `_llm_raw` (no tools) and `llm` (with tools) are stored
- **Conditional Usage**: `use_tools` flag determines which LLM variant to use
- **TYPE_CHECKING**: Uses `if TYPE_CHECKING` to avoid circular imports
- **Registry as Class**: MCPServerRegistry is passed as class, not instance

## Files Modified

1. `src/lib/services/ai_client/providers/base_provider.py` - Updated signatures and tool binding
2. `src/lib/services/ai_client/providers/vertex_provider.py` - Added mcp_registry param
3. `src/lib/services/ai_client/providers/langchain_vertex_provider.py` - Added mcp_registry param
4. `src/lib/services/ai_client/providers/mock_provider.py` - Added mcp_registry param for consistency
5. `src/lib/services/ai_client/client.py` - Updated to pass registry to providers
6. `src/lib/mcp/index.py` - Simplified register_all_tools function
7. `src/apps/console/app.py` - Updated initialization workflow

## See Also

- [LangChain Tool Calling Documentation](https://python.langchain.com/docs/how_to/tool_calling/)
- [LangChain bind_tools() Reference](https://python.langchain.com/api_reference/core/language_models/langchain_core.language_models.chat_models.BaseChatModel.html)
- [Knik MCP Documentation](./MCP.md)
- [Knik Console App Documentation](./CONSOLE.md)
