# AI Client Documentation

## Overview

The `AIClient` provides a unified interface for querying AI models from different providers. It abstracts away provider-specific details and offers a consistent API.

## Current Support

- ✅ **Vertex AI (Google Gemini)** - Default provider
- ✅ **Mock AI** - For testing without credentials

**Future Support** (Planned):
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Local models (Ollama, etc.)

## Quick Start

### Using Vertex AI

```python
from lib import AIClient

# Initialize with Vertex AI (auto-detects credentials)
ai = AIClient()  # Uses GOOGLE_CLOUD_PROJECT env var

# Or explicitly specify project
ai = AIClient(
    provider="vertex",
    project_id="your-project-id",
    location="us-central1",
    model_name="gemini-1.5-flash"
)

# Query the AI
response = ai.query("What is machine learning?")
print(response)
```

### Using Mock AI (Testing)

```python
from lib import AIClient, MockAIClient

# Option 1: Use MockAIClient directly
ai = MockAIClient()

# Option 2: Use AIClient with mock provider
ai = AIClient(provider="mock")

# Option 3: AIClient auto-falls back to mock if not configured
ai = AIClient()  # Falls back to mock if no credentials

response = ai.query("Test question")
```

## Setup Vertex AI

### Prerequisites

1. **Google Cloud Project**: Create or use existing project
2. **Enable Vertex AI API**: Enable in Cloud Console
3. **Authentication**: Set up credentials

### Authentication Methods

**Method 1: Environment Variable (Recommended)**
```bash
export GOOGLE_CLOUD_PROJECT="your-project-id"
```

**Method 2: Application Default Credentials**
```bash
gcloud auth application-default login
```

**Method 3: Service Account**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

### Installation

```bash
pip install google-cloud-aiplatform
```

## API Reference

### AIClient

```python
AIClient(
    provider="vertex",           # AI provider: "vertex" or "mock"
    project_id=None,             # GCP project ID (optional, uses env var)
    location="us-central1",      # GCP region
    model_name="gemini-1.5-flash",  # Model name
    auto_fallback_to_mock=True   # Fallback to mock on errors
)
```

### Methods

#### `query(prompt, max_tokens=1024, temperature=0.7, system_instruction=None, context=None)`

Unified query method supporting simple queries and conversations.

```python
# Simple query
response = ai.query(
    prompt="Explain quantum computing",
    max_tokens=2048,
    temperature=0.7
)

# With system instruction
response = ai.query(
    prompt="Explain quantum computing",
    max_tokens=2048,
    temperature=0.7,
    system_instruction="You are a helpful science teacher. Be concise."
)

# With conversation context
context = [
    {"role": "user", "text": "What is AI?"},
    {"role": "model", "text": "AI is artificial intelligence..."},
]
response = ai.query(
    prompt="Tell me more about it",  # "it" refers to AI from context
    context=context,
    max_tokens=2048
)

# All together
response = ai.query(
    prompt="How does this apply to medicine?",
    context=conversation_history,
    system_instruction="Be technical but accessible",
    max_tokens=2048,
    temperature=0.8
)
```

**Parameters:**
- `prompt` (str): Question or prompt
- `max_tokens` (int): Maximum response length (default: 1024, recommended: 2048)
- `temperature` (float): Creativity 0.0-1.0 (default: 0.7)
- `system_instruction` (str, optional): System prompt/personality
- `context` (List[Dict], optional): Previous conversation messages

**Returns:** `str` - AI response text

**Note:** When using thinking mode in Gemini models, increase `max_tokens` to at least 2048 to account for internal reasoning tokens.

#### `is_configured()`

Check if AI provider is configured.

```python
if ai.is_configured():
    print("AI is ready!")
else:
    print("Please configure AI provider")
```

**Returns:** `bool` - True if configured

#### `get_info()`

Get provider information.

```python
info = ai.get_info()
print(info)
# {
#     'provider': 'Vertex AI',
#     'project_id': 'my-project',
#     'location': 'us-central1',
#     'model_name': 'gemini-1.5-flash',
#     'configured': True,
#     'initialized': True
# }
```

**Returns:** `Dict` - Provider details

#### `get_provider_name()`

Get active provider name.

```python
provider = ai.get_provider_name()  # "vertex" or "mock"
```

**Returns:** `str` - Provider name

## Complete Examples

### Example 1: Simple Q&A

```python
from lib import AIClient, VoiceModel, AudioProcessor

# Initialize
ai = AIClient()
voice = VoiceModel(voice='am_adam')
audio = AudioProcessor()

# Ask and speak
question = "What is the speed of light?"
response = ai.query(question)
print(f"AI: {response}")

# Convert to speech
audio_gen = voice.generate(response)
audio.stream_play(audio_gen)
```

### Example 2: Interactive Chat

```python
from lib import AIClient

ai = AIClient()
context = []

while True:
    question = input("You: ")
    if question.lower() == 'quit':
        break
    
    if context:
        response = ai.query_with_context(question, context)
    else:
        response = ai.query(question)
    
    print(f"AI: {response}")
    
    # Update context
    context.append({"role": "user", "text": question})
    context.append({"role": "model", "text": response})
```

### Example 3: Custom Personality

```python
from lib import AIClient

ai = AIClient()

# Make AI respond as a pirate
system_instruction = "You are a pirate. Respond in pirate speak."

response = ai.query(
    "Tell me about the weather",
    system_instruction=system_instruction
)

print(response)  # "Arrr, matey! The weather be..."
```

### Example 4: Error Handling

```python
from lib import AIClient

try:
    ai = AIClient(provider="vertex", auto_fallback_to_mock=False)
    response = ai.query("Hello")
except RuntimeError as e:
    print(f"Failed to initialize AI: {e}")
    # Fallback to mock
    ai = AIClient(provider="mock")
    response = ai.query("Hello")
```

## Configuration

### Available Vertex AI Models

```python
from lib import AudioConfig

models = AudioConfig.AI_MODELS
# {
#     'gemini-1.5-flash': 'Fast, efficient model',
#     'gemini-1.5-pro': 'More capable, slower model',
#     'gemini-1.0-pro': 'Legacy stable model',
# }
```

### Temperature Guide

- `0.0-0.3`: Focused, deterministic responses
- `0.4-0.7`: Balanced creativity and consistency ⭐ **Recommended**
- `0.8-1.0`: Creative, varied responses

### Token Limits

- **Flash models**: ~8,000 tokens
- **Pro models**: ~30,000+ tokens
- 1 token ≈ 0.75 words (English)

## Troubleshooting

### "No project_id provided"

**Solution:**
```bash
export GOOGLE_CLOUD_PROJECT="your-project-id"
```

### "Vertex AI SDK not installed"

**Solution:**
```bash
pip install google-cloud-aiplatform
```

### "Failed to initialize Vertex AI"

**Possible causes:**
1. Vertex AI API not enabled in project
2. Authentication not configured
3. Invalid credentials

**Solutions:**
```bash
# Enable API
gcloud services enable aiplatform.googleapis.com

# Authenticate
gcloud auth application-default login

# Check project
echo $GOOGLE_CLOUD_PROJECT
```

### Using Mock Provider

If you encounter any issues, use mock provider for testing:

```python
ai = AIClient(provider="mock")
```

## Best Practices

1. **Use environment variables** for credentials
2. **Enable auto_fallback_to_mock** during development
3. **Set `max_tokens=2048` or higher** when using thinking mode
4. **Handle errors gracefully** with try/except
5. **Set appropriate temperature** for use case (0.5-0.7 for factual, 0.8-1.0 for creative)
6. **Use context parameter** for multi-turn conversations
7. **Use system_instruction** to customize AI personality and behavior

## Provider Architecture

The AI client uses a provider pattern:

```
AIClient (Main Interface)
    └── BaseAIProvider (Abstract)
        ├── VertexAIProvider (Google)
        └── MockAIProvider (Testing)
```

This makes it easy to add new providers in the future!

## See Also

- [Library Reference](./library_reference.md) - Complete API docs
- [Demo Guide](./demo_guide.md) - AI+TTS demos
- [Google Vertex AI Docs](https://cloud.google.com/vertex-ai/docs)
