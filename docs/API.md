# API Reference

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

```python
if processor.is_processing_complete():
    print("All done!")
```

#### `set_voice(voice: str)`
Change voice model.

```python
processor.set_voice("am_adam")
```

#### `set_save_dir(save_dir: str)`
Save audio segments to directory.

```python
processor.set_save_dir("./output")
```

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

The console app uses a modular design with:
- **app.py** - Main ConsoleApp class
- **history.py** - ConversationHistory for context management
- **tools/** - Command handlers with registry pattern
  - **index.py** - Command registry (`get_command_registry()`, `register_commands()`)
  - Individual command files (`*_cmd.py`)

### Methods

#### `wait_until(condition_fn, timeout, check_interval)`
Wait for a condition to be met.

```python
app.wait_until(
    condition_fn=lambda: app.tts_processor.is_processing_complete(),
    timeout=30.0,
    check_interval=0.1
)
```

### ConversationHistory

Manages conversation context (located in `apps/console/history.py`):

```python
from apps.console.history import ConversationHistory

history = ConversationHistory(max_size=50)
history.add_entry("user input", "ai response")
context = history.get_context(last_n=3)  # Get last 3 exchanges
entries = history.get_all_entries()       # Get all entries
history.clear()                           # Clear history
```

## Available Voices

**Female:**
- `af_sarah`, `af_nicole`, `af_sky`, `af_bella`, `af_heart`

**Male:**
- `am_adam`, `am_michael`, `bm_george`, `bm_lewis`

## AIClient

Unified AI client with multiple provider support and MCP tools.

### Initialization

```python
from lib.services.ai_client import AIClient

client = AIClient(
    provider="vertex",
    project_id="your-project-id",
    location="us-central1",
    model_name="gemini-2.5-flash"
)
```

### Methods

#### `query(prompt, use_tools, max_tokens, temperature, system_instruction, context)`
Get complete AI response.

```python
response = client.query(
    prompt="What is AI?",
    use_tools=True,
    max_tokens=1024,
    temperature=0.7
)
```

#### `query_stream(prompt, use_tools, ...)`
Stream AI response chunks.

```python
for chunk in client.query_stream(prompt="Hello", use_tools=True):
    print(chunk, end="", flush=True)
```

#### `register_tool(tool_dict, implementation)`
Register MCP tool.

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

#### `get_registered_tools()`
List all registered tools.

```python
tools = client.get_registered_tools()
for tool in tools:
    print(tool['name'])
```

#### `execute_tool(tool_name, **kwargs)`
Manually execute a tool.

```python
result = client.execute_tool("calculate", expression="2 + 2")
```

### Provider Support

- **vertex** - Google Vertex AI with LangChain (recommended)
- **mock** - Testing/development

List providers:
```python
AIClient.list_available_providers()
```

## Examples

### Simple TTS

```python
from lib import TTSAsyncProcessor
import time

processor = TTSAsyncProcessor(
    sample_rate=24000,
    voice_model="af_sarah"
)
processor.start_async_processing()

processor.play_async("Hello world")

while not processor.is_processing_complete():
    time.sleep(0.1)
```

### Console with Wait

```python
class ConsoleApp:
    def _handle_user_input(self, user_input: str):
        for chunk in self._stream_response(user_input):
            print(chunk, end="", flush=True)
            self._enqueue_voice(chunk)
        
        # Wait for audio to finish
        self.wait_until(
            lambda: self.tts_processor.is_processing_complete()
        )
```

### Change Voice

```python
processor.set_voice("am_adam")
processor.play_async("I sound different now")
```

### Save Audio

```python
processor.set_save_dir("./recordings")
processor.play_async("This will be saved")
# Creates: ./recordings/segment_<timestamp>.wav
```
