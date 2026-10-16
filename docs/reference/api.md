# API Reference

## AIClient

Unified AI client over the registered providers (`src/lib/services/ai_client/client.py`). Apps import it from
`imports.py`; library code imports `lib.services.ai_client.client`.

### Building a client

Build clients with `build_client()` (`lib/services/ai_client/factory.py`). It hands each provider only the
settings its constructor declares, passing the model as `model_name`, so a setting one provider does not take
never reaches it.

```python
from imports import ClientSettings, build_client, create_tool_registry

settings = ClientSettings(
    provider="vertex",              # vertex, gemini, zhipuai, zai, zai_coding, custom, mock
    model="gemini-2.5-flash",
    system_instruction=None,
    project_id="your-project-id",   # vertex
    location="us-central1",         # vertex
    api_base=None,                  # custom only (Z.AI reads ZAI_API_BASE / ZAI_CODING_API_BASE)
    api_key=None,                   # custom only
    temperature=None,
    max_tokens=None,
)
client = build_client(settings, tool_registry=create_tool_registry())  # tool_registry=None for no tools
```

`AIClient(provider=..., auto_fallback_to_mock=True, tool_registry=None, system_instruction=None,
tool_callback=None, settings=None, **provider_kwargs)` is the underlying constructor.

### Methods

| Method                                                                                                                 | Does                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `chat(prompt, max_tokens=1024, temperature=0.7, history=None) -> str`                                                  | One reply. Raises what the provider raised                                                                                                |
| `chat_stream(prompt, ..., history=None) -> Generator[str]`                                                             | The reply as text chunks; a provider failure ends it with a `"Chat streaming error: ..."` chunk                                           |
| `stream_events(prompt, ..., history=None)`                                                                             | The reply as typed events (see [Streaming](../development/streaming.md))                                                                  |
| `async achat(prompt, conversation_id=None, user_id=None, source=None, ...)`                                            | `chat()` plus the stored conversation: returns `(text, conversation_id, usage)`; a conversation it creates records `user_id` and `source` |
| `async achat_stream(prompt, conversation_id=None, user_id=None, source=None, ...)`                                     | `stream_events()` plus the stored conversation, from `ConversationReady` to `StreamDone`                                                  |
| `set_model(model_name)`, `set_provider(name, model_name=None)`                                                         | Swap the provider in place, keeping the tool registry and system instruction                                                              |
| `get_provider_name()`, `get_model_name()`, `get_info()`, `is_configured()`                                             | About the active provider                                                                                                                 |
| `list_available_providers()` (static)                                                                                  | Registered provider names                                                                                                                 |
| `list_models_for_provider(name=None)`, `list_all_models()`                                                             | Models from the provider APIs, with a static fallback                                                                                     |
| `get_last_usage()`                                                                                                     | Token usage of the last call                                                                                                              |
| `tool_registry`, `register_tool(definition, implementation)`, `get_registered_tools()`, `execute_tool(name, **kwargs)` | The client's tool registry. The model gets its tools when the provider is built, so register tools before building the client             |

`history` is a list of LangChain messages (`HumanMessage`, `AIMessage`, ...).

```python
for chunk in client.chat_stream(prompt="Hello"):
    print(chunk, end="", flush=True)

AIClient.list_available_providers()
# ['custom', 'gemini', 'mock', 'vertex', 'zai_coding', 'zai', 'zhipuai'] (registration order)
```

### Provider Support

| Provider    | Registry Key | Backend                            | Description                                  |
| ----------- | ------------ | ---------------------------------- | -------------------------------------------- |
| Vertex AI   | `vertex`     | ChatVertexAI (LangChain)           | Google Cloud Vertex AI                       |
| Gemini      | `gemini`     | ChatGoogleGenerativeAI (LangChain) | Google AI Studio API                         |
| ZhipuAI     | `zhipuai`    | ChatZhipuAI (LangChain)            | ZhipuAI GLM models                           |
| Z.AI        | `zai`        | ChatOpenAI (LangChain)             | Z.AI Platform (OpenAI-compatible)            |
| Z.AI Coding | `zai_coding` | ChatOpenAI (LangChain)             | Z.AI Coding Plan (coding-optimized endpoint) |
| Custom      | `custom`     | ChatOpenAI (LangChain)             | Any OpenAI-compatible endpoint               |
| Mock        | `mock`       | Built-in                           | Testing/development (canned responses)       |

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

When `auto_fallback_to_mock=True` (the default, and what `build_client()` uses):

1. If the provider name is unknown, or its constructor raises, the client falls back to `MockAIProvider` with a warning
2. If the provider reports `is_configured() == False`, the client falls back to `MockAIProvider` with a warning
3. Set `auto_fallback_to_mock=False` to raise errors instead

## TTSAsyncProcessor

Speaks text on background threads: one converts text to audio, the other plays it (the console uses it).

```python
import time

from imports import TTSAsyncProcessor   # library code: from lib.services.tts import TTSAsyncProcessor

processor = TTSAsyncProcessor(
    sample_rate=24000,           # Audio sample rate
    play_voice=True,             # Play through the speakers
    sleep_duration=0.3,          # Thread sleep interval
)
processor.start_async_processing()   # before play_async()
processor.play_async("Hello world")  # non-blocking
while not processor.is_processing_complete():
    time.sleep(0.1)
```

- `voice_model` is accepted but not applied: speech uses the Kokoro default voice, `af_heart`.
- `set_save_dir(path)` saves the audio segments to a directory.
- `is_text_queue_empty()`, `is_audio_queue_empty()`, `is_processing_complete()` report progress.
- `set_voice()` and `set_language()` do not work yet: the audio processor they call has no such methods.

The web backend speaks through `KokoroVoiceModel` directly (`generate(text)` returns the audio and its sample
rate).

## ConsoleApp

Interactive AI console with voice (`src/console/`).

```python
from console import ConsoleApp, ConsoleConfig   # from src/

ConsoleApp(ConsoleConfig()).run()
```

Run it with `python src/main.py --mode console` or `npm run start:console`. See the
[Console guide](../guides/console.md) for its commands.

- **app.py** - `ConsoleApp`
- **history.py** - `ConversationHistory`, the in-memory history (`add_entry`, `get_messages(last_n)`, `get_context(last_n)`, `get_all_entries()`, `clear()`)
- **commands/** - `/help` and the shared command dispatcher
- **tools/** - console-only commands (`index.py` registers them; one `*_cmd.py` each) and `consent_gate.py`

## Available Voices

**Female:** `af_heart`, `af_bella`, `af_sarah`, `af_nicole`, `af_sky`

**Male:** `am_adam`, `am_michael`, `am_leo`, `am_ryan`

## Web API Endpoints (36 under `/api`)

`GET /` and `GET /health` answer without an API key. With `KNIK_WEB_REQUIRE_API_KEY=true` every `/api` route
needs `X-API-Key` (see [API keys](environment-variables.md#api-keys)). A database failure answers `503`.

### Chat (`/api/chat`)

| Method | Path                | Description                                                                       |
| ------ | ------------------- | --------------------------------------------------------------------------------- |
| POST   | `/api/chat/`        | Send a message; returns the reply text, its speech and usage                      |
| POST   | `/api/chat/stream/` | Stream the reply as Server-Sent Events ([Streaming](../development/streaming.md)) |

### Admin (`/api/admin`)

| Method | Path                           | Description                                                                                                                                                                           |
| ------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/admin/settings`          | Every user setting: `{"settings": [{key, type, label, description, group, options, secret, default, value, source}]}`; `source` is `db`, `env` or `default`; secrets read back masked |
| POST   | `/api/admin/settings`          | Save and apply `{key: value, ...}`; 422 names an unknown key, a wrong type or a value outside its options                                                                             |
| DELETE | `/api/admin/settings/{key}`    | Forget the stored value; the env or built-in default applies again                                                                                                                    |
| GET    | `/api/admin/mcp-tools`         | Tool groups with their tool counts and whether they are enabled                                                                                                                       |
| PUT    | `/api/admin/mcp-tools/{group}` | Enable or disable a tool group for web chats: `{"enabled": false}`                                                                                                                    |
| GET    | `/api/admin/api-keys`          | API keys (never the secrets)                                                                                                                                                          |
| POST   | `/api/admin/api-keys`          | Create a key: `{"label": "...", "scopes": []}`; the key is returned once                                                                                                              |
| DELETE | `/api/admin/api-keys/{key_id}` | Delete a key                                                                                                                                                                          |

### Workflows (`/api/workflows`) and schedules (`/api/cron`)

See [Workflow Scheduler](../guides/scheduler.md#web-api).

### Analytics (`/api/analytics`)

| Method | Path                            | Description                          |
| ------ | ------------------------------- | ------------------------------------ |
| GET    | `/api/analytics/dashboard`      | Get dashboard summary                |
| GET    | `/api/analytics/metrics`        | Get system metrics                   |
| GET    | `/api/analytics/top-workflows`  | Get top workflows by execution count |
| GET    | `/api/analytics/executions`     | Get paginated execution records      |
| GET    | `/api/analytics/workflows/list` | Get workflows list for analytics     |
| GET    | `/api/analytics/activity`       | Get activity timeline                |

### Conversations (`/api/conversations`)

| Method | Path                               | Description                                                     |
| ------ | ---------------------------------- | --------------------------------------------------------------- |
| GET    | `/api/conversations/`              | List conversations (supports `limit` and `offset` query params) |
| POST   | `/api/conversations/`              | Create a new empty conversation (optional `title` in body)      |
| GET    | `/api/conversations/{id}`          | Get a conversation with all its messages                        |
| DELETE | `/api/conversations/{id}`          | Delete a conversation                                           |
| PATCH  | `/api/conversations/{id}`          | Update a conversation's title                                   |
| GET    | `/api/conversations/{id}/messages` | Get messages for a conversation (optional `last_n` query param) |

Each conversation records its owner (`user_id`, a `users` row) and `source` (`web`, `telegram` or `console`); both appear in the
conversation objects. The web lists and opens only the conversations it started (`source` web) and older ones saved before
ownership was recorded. A Telegram user's conversation answers 404 on every `/api/conversations/{id}` route, and on
`/api/chat/` and `/api/chat/stream/` when its id is given as `conversation_id`. If a database error stops that check, the chat
still answers but saves nothing and returns no `conversation_id`.

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
