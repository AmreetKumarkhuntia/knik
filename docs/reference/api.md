# API Reference

## AIClient

Unified AI client with multiple provider support and MCP tools.

### Constructor

```python
from lib.services.ai_client import AIClient

client = AIClient(
    provider="vertex",               # Provider name (default: "vertex")
    auto_fallback_to_mock=True,      # Fall back to mock if unconfigured
    mcp_registry=None,               # MCPServerRegistry for tool support
    system_instruction=None,         # System prompt for the AI
    tool_callback=None,              # Callback for tool execution events
    **provider_kwargs                # Forwarded to provider constructor
)
```

Provider-specific kwargs are passed through to the underlying provider. For example:

```python
# Vertex AI
client = AIClient(
    provider="vertex",
    project_id="your-project-id",
    location="us-central1",
    model_name="gemini-2.5-flash"
)

# Custom OpenAI-compatible endpoint
client = AIClient(
    provider="custom",
    model_name="llama3.1",
    api_base="http://localhost:11434/v1"
)
```

### Methods

#### `chat(prompt, max_tokens, temperature, history, **kwargs) -> str`

Get complete AI response.

```python
response = client.chat(
    prompt="What is AI?",
    max_tokens=1024,
    temperature=0.7,
    history=[]       # Optional conversation history
)
```

#### `chat_stream(prompt, max_tokens, temperature, history, **kwargs) -> Generator[str]`

Stream AI response chunks.

```python
for chunk in client.chat_stream(prompt="Hello"):
    print(chunk, end="", flush=True)
```

#### `is_configured() -> bool`

Check if the provider is properly configured.

#### `get_info() -> dict`

Get provider info (name, model, configuration details).

#### `get_provider_name() -> str`

Get the active provider name.

#### `list_available_providers() -> list[str]` (static)

List all registered provider names.

```python
providers = AIClient.list_available_providers()
# ["vertex", "gemini", "zhipuai", "zai", "zai_coding", "custom", "mock"]
```

#### `register_tool(tool_dict, implementation)`

Register an MCP tool.

```python
tool_def = {
    "name": "my_tool",
    "description": "Does something useful",
    "parameters": {...}
}

def my_tool_impl(param):
    return f"Result: {param}"

client.register_tool(tool_def, my_tool_impl)
```

#### `get_registered_tools() -> list[dict]`

List all registered tools.

#### `execute_tool(tool_name, **kwargs) -> Any`

Manually execute a registered tool.

```python
result = client.execute_tool("calculate", expression="2 + 2")
```

### Provider Support

| Provider | Registry Key | Backend | Description |
| --- | --- | --- | --- |
| Vertex AI | `vertex` | ChatVertexAI (LangChain) | Google Cloud Vertex AI |
| Gemini | `gemini` | ChatGoogleGenerativeAI (LangChain) | Google AI Studio API |
| ZhipuAI | `zhipuai` | ChatZhipuAI (LangChain) | ZhipuAI GLM models |
| Z.AI | `zai` | ChatOpenAI (LangChain) | Z.AI Platform (OpenAI-compatible) |
| Z.AI Coding | `zai_coding` | ChatOpenAI (LangChain) | Z.AI Coding Plan (coding-optimized endpoint) |
| Custom | `custom` | ChatOpenAI (LangChain) | Any OpenAI-compatible endpoint |
| Mock | `mock` | Built-in | Testing/development (canned responses) |

All LangChain-based providers inherit from `LangChainProvider`, which extends `BaseAIProvider`. The mock provider extends `BaseAIProvider` directly.

### Provider Inheritance

```
BaseAIProvider (ABC)
 +-- LangChainProvider (chat/chat_stream via LangChain invoke/stream)
 |    +-- VertexAIProvider    ("vertex")
 |    +-- GeminiAIProvider    ("gemini")
 |    +-- ZhipuAIProvider     ("zhipuai")
 |    +-- ZAIProvider         ("zai")
 |    +-- ZAICodingProvider   ("zai_coding")
 |    +-- CustomProvider      ("custom")
 +-- MockAIProvider           ("mock")
```

### Auto-Fallback Behavior

When `auto_fallback_to_mock=True` (default):

1. If the provider reports `is_configured() == False`, silently switches to `MockAIProvider`
2. If the provider constructor throws an exception, catches it and falls back to `MockAIProvider`
3. Set `auto_fallback_to_mock=False` to raise errors instead

## TTSAsyncProcessor

Handles async voice processing with background threads.

### Initialization

```python
from lib import TTSAsyncProcessor

processor = TTSAsyncProcessor(
    sample_rate=24000,           # Audio sample rate
    voice_model="af_sarah",      # Voice name
    play_voice=True,             # Enable playback
    sleep_duration=0.3           # Thread sleep interval
)
processor.start_async_processing()
```

### Methods

#### `play_async(text: str)`

Add text to processing queue (non-blocking).

```python
processor.play_async("Hello world")
```

#### `is_processing_complete() -> bool`

Check if all processing is done (queues empty + not playing).

#### `set_voice(voice: str)`

Change voice model.

```python
processor.set_voice("am_adam")
```

#### `set_save_dir(save_dir: str)`

Save audio segments to directory.

### State Checks

```python
processor.is_text_queue_empty()    # Text queue status
processor.is_audio_queue_empty()   # Audio queue status
processor.is_processing_complete() # All done?
```

## ConsoleApp

Interactive AI console with voice.

### Initialization

```python
from apps.console import ConsoleApp, ConsoleConfig

config = ConsoleConfig(
    voice_name="af_sarah",
    enable_voice_output=True
)
app = ConsoleApp(config)
app.run()
```

### Architecture

- **app.py** - Main ConsoleApp class
- **history.py** - ConversationHistory for context management
- **tools/** - Command handlers with registry pattern
  - **index.py** - Command registry (`get_command_registry()`, `register_commands()`)
  - Individual command files (`*_cmd.py`)

### Console Commands (14)

| Command | Description |
| --- | --- |
| `/help` | Show available commands |
| `/exit` | Exit the application |
| `/quit` | Alias for exit |
| `/clear` | Clear the screen |
| `/history` | Show conversation history |
| `/voice` | Change voice settings |
| `/info` | Show system information |
| `/toggle-voice` | Enable/disable TTS output |
| `/tools` | List registered MCP tools |
| `/agent` | Agent mode settings |
| `/provider` | Switch AI provider |
| `/model` | Switch AI model |
| `/debug` | Toggle debug mode |
| `/workflow` | Workflow management |

### ConversationHistory

```python
from apps.console.history import ConversationHistory

history = ConversationHistory(max_size=50)
history.add_entry("user input", "ai response")
context = history.get_context(last_n=3)  # Get last 3 exchanges
entries = history.get_all_entries()       # Get all entries
history.clear()                           # Clear history
```

## Available Voices

**Female:** `af_heart`, `af_bella`, `af_sarah`, `af_nicole`, `af_sky`

**Male:** `am_adam`, `am_michael`, `am_leo`, `am_ryan`

## Web API Endpoints (32)

### Chat (`/api/chat`)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/chat/` | Send a chat message and get a response |

### Chat Stream (`/api/chat/stream`)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/chat/stream/` | Stream a chat response via SSE |

### Admin (`/api/admin`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/admin/settings` | Get current settings |
| POST | `/api/admin/settings` | Update settings |
| GET | `/api/admin/providers` | List available AI providers |
| GET | `/api/admin/models` | List available AI models |
| GET | `/api/admin/voices` | List available voices |

### History (`/api/history`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/history/` | Get conversation history |
| POST | `/api/history/add` | Add a message to history |
| POST | `/api/history/clear` | Clear conversation history |

### Workflows (`/api/workflows`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/workflows/` | List all workflows |
| GET | `/api/workflows/{id}` | Get a specific workflow |
| DELETE | `/api/workflows/{id}` | Delete a workflow |
| POST | `/api/workflows/{id}/execute` | Execute a workflow |
| GET | `/api/workflows/{id}/history` | Get workflow execution history |
| GET | `/api/workflows/{id}/executions/{eid}/nodes` | Get node execution details |

### Cron (`/api/cron`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/cron/` | List all schedules |
| POST | `/api/cron/` | Add a new schedule |
| DELETE | `/api/cron/{id}` | Remove a schedule |
| PATCH | `/api/cron/{id}/toggle` | Toggle schedule enabled/disabled |

### Analytics (`/api/analytics`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/analytics/dashboard` | Get dashboard summary |
| GET | `/api/analytics/metrics` | Get system metrics |
| GET | `/api/analytics/top-workflows` | Get top workflows by execution count |
| GET | `/api/analytics/executions` | Get paginated execution records |
| GET | `/api/analytics/workflows/list` | Get workflows list for analytics |
| GET | `/api/analytics/activity` | Get activity timeline |

### Conversations (`/api/conversations`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/conversations/` | List conversations (supports `limit` and `offset` query params) |
| POST | `/api/conversations/` | Create a new empty conversation (optional `title` in body) |
| GET | `/api/conversations/{id}` | Get a conversation with all its messages |
| DELETE | `/api/conversations/{id}` | Delete a conversation |
| PATCH | `/api/conversations/{id}` | Update a conversation's title |
| GET | `/api/conversations/{id}/messages` | Get messages for a conversation (optional `last_n` query param) |

## File System Tools

### `read_file`

Read the complete contents of a file or a specific line range.

**Parameters:**

- `file_path` (string): Path to the file to read.
- `encoding` (string, optional): File encoding (default: 'utf-8').
- `start_line` (integer, optional): Starting line number.
- `end_line` (integer, optional): Ending line number.

### `list_directory`

List all files and directories in a given path.

**Parameters:**

- `directory_path` (string): Path to the directory to list.
- `recursive` (boolean, optional): Whether to list files recursively.
- `pattern` (string, optional): Glob pattern to filter files.

### `search_in_files`

Search for a pattern across multiple files in a directory.

**Parameters:**

- `directory_path` (string): Directory to search in.
- `pattern` (string): Text or regex pattern to search for.
- `file_pattern` (string, optional): Glob pattern for files to search.
- `is_regex` (boolean, optional): Whether the pattern is a regex.
- `case_sensitive` (boolean, optional): Whether the search is case sensitive.
- `max_results` (integer, optional): Maximum number of matches to return.

### `file_info`

Get detailed information about a file or directory.

**Parameters:**

- `path` (string): Path to the file or directory.

### `write_file`

Write content to a file.

**Parameters:**

- `file_path` (string): Path where the file should be written.
- `content` (string): Content to write to the file.
- `encoding` (string, optional): File encoding (default: 'utf-8').

### `append_to_file`

Append content to an existing file.

**Parameters:**

- `file_path` (string): Path to the file to append to.
- `content` (string): Content to append.
- `encoding` (string, optional): File encoding (default: 'utf-8').

### `find_in_file`

Search for a pattern within a specific file.

**Parameters:**

- `file_path` (string): Path to the file to search in.
- `pattern` (string): Text pattern or regex to search for.
- `is_regex` (boolean, optional): Whether the pattern is a regular expression.
- `case_sensitive` (boolean, optional): Whether the search should be case-sensitive.
- `max_results` (integer, optional): Maximum number of matches to return.
- `show_context` (boolean, optional): Whether to show context lines around matches.
- `context_lines` (integer, optional): Number of context lines to show.

### `count_in_file`

Count how many times a pattern appears in a file.

**Parameters:**

- `file_path` (string): Path to the file to analyze.
- `pattern` (string): Text pattern or regex to count.
- `is_regex` (boolean, optional): Whether the pattern is a regular expression.
- `case_sensitive` (boolean, optional): Whether the count should be case-sensitive.
