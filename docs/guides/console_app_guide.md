# Console App Guide

The Knik Console App is an interactive terminal application that allows you to chat with AI models and receive both text and voice responses. It's like having a voice-enabled AI assistant right in your terminal!

## 🚀 Quick Start

### Running the Console App

```bash
# From the project root
python src/main.py --mode console

# Or simply (console is the default mode)
python src/main.py
```

### First Time Setup

1. **Set up Google Cloud credentials** (for Vertex AI):
   ```bash
   export GOOGLE_CLOUD_PROJECT=your-project-id
   ```

2. **Or use Mock AI for testing**:
   ```bash
   # No setup needed - Mock AI is used automatically as fallback
   ```

3. **Optional: Configure voice and other settings**:
   ```bash
   export KNIK_CONSOLE_VOICE=am_adam  # Use male voice
   export KNIK_CONSOLE_ENABLE_VOICE=true  # Enable voice output
   ```

## 📖 Features

### 1. Interactive AI Chat
- Type any question or statement to chat with AI
- Context-aware conversations (remembers previous messages)
- Natural language understanding

### 2. Voice Responses
- Automatic text-to-speech for AI responses
- Multiple voice options (male/female)
- Toggle voice on/off during session

### 3. Special Commands
Access powerful features using commands:

| Command | Description | Example |
|---------|-------------|---------|
| `/help` | Show available commands | `/help` |
| `/exit` or `/quit` | Exit the application | `/exit` |
| `/clear` | Clear conversation history | `/clear` |
| `/history` | Show conversation history | `/history` |
| `/voice <name>` | Change voice | `/voice am_adam` |
| `/info` | Show current configuration | `/info` |
| `/toggle-voice` | Enable/disable voice output | `/toggle-voice` |

### 4. Conversation History
- Maintains context across questions
- View previous conversations with `/history`
- Clear history anytime with `/clear`

## 🎯 Usage Examples

### Basic Usage

```
$ python main.py --mode console

============================================================
🤖 Knik Console - Your AI Assistant with Voice
============================================================

Type '/help' for available commands
Type '/exit' to quit

You: What is the capital of France?

AI: The capital of France is Paris.
🎙️ Generating voice...

You: Tell me more about it.

AI: Paris is the largest city in France and has been the country's 
capital since the 12th century...
🎙️ Generating voice...
```

### Using Commands

```
You: /help

Available Commands:
  /help          - Show this help message
  /exit/quit     - Exit the application
  /clear         - Clear conversation history
  /history       - Show conversation history
  /voice <name>  - Change voice (e.g., af_sarah, am_adam)
  /info          - Show current configuration
  /toggle-voice  - Enable/disable voice output

Just type your question to chat with AI!

You: /voice am_michael
Voice changed to: am_michael 🎙️

You: /info

Current Configuration:
  AI Provider:    vertex
  AI Model:       gemini-1.5-flash
  Voice:          am_michael
  Voice Output:   Enabled
  History Size:   2/50
```

### Viewing History

```
You: /history

📜 Conversation History:

[1] 14:23:45
  You: What is the capital of France?
  AI:  The capital of France is Paris....

[2] 14:24:12
  You: Tell me more about it.
  AI:  Paris is the largest city in France...
```

## ⚙️ Configuration

### Environment Variables

Configure the console app using environment variables:

```bash
# AI Configuration (Required for Vertex AI)
export GOOGLE_CLOUD_PROJECT=your-project-id
export KNIK_AI_MODEL=gemini-1.5-flash
export KNIK_AI_LOCATION=us-central1

# Voice Configuration
export KNIK_CONSOLE_VOICE=af_sarah
export KNIK_CONSOLE_ENABLE_VOICE=true

# History Configuration
export KNIK_CONSOLE_MAX_HISTORY=50
```

### Programmatic Configuration

```python
import sys
sys.path.insert(0, 'src')

from apps.console import ConsoleApp, ConsoleConfig

# Create custom config
config = ConsoleConfig(
    ai_provider="vertex",
    ai_model="gemini-1.5-flash",
    voice_name="am_adam",
    enable_voice_output=True,
    max_history_size=100
)

# Run app with custom config
app = ConsoleApp(config)
app.run()
```

## 🎤 Available Voices

### Female Voices
- `af_sarah` (default) - Clear, professional
- `af_heart` - Warm, friendly
- `af_bella` - Energetic, upbeat
- `af_nicole` - Calm, soothing
- `af_sky` - Bright, cheerful

### Male Voices
- `am_adam` - Professional, authoritative
- `am_michael` - Warm, conversational
- `am_leo` - Deep, commanding
- `am_ryan` - Friendly, casual

Change voice anytime: `/voice am_adam`

## 🤖 AI Providers

### Vertex AI (Google Gemini)
- **Setup Required**: Google Cloud project with Vertex AI enabled
- **Models**: gemini-1.5-flash, gemini-1.5-pro
- **Best For**: Production use, high-quality responses

```bash
export GOOGLE_CLOUD_PROJECT=your-project-id
python main.py --mode console
```

### Mock AI
- **Setup Required**: None
- **Best For**: Testing, development, demos
- **Auto-fallback**: Used automatically if Vertex AI not configured

## 🔧 Advanced Usage

### Running Demos

```bash
# Interactive demo
python demo/console/console_app_demo.py

# Simple console demo
python demo/console/simple_console_demo.py

# Console processor demo
python demo/console/console_processor_demo.py
```

### Logging

The console app uses dual-output:
1. **User Terminal**: Clean chat interface (your input/output)
2. **System Logs**: Status messages, errors, debug info

Logs appear in the same terminal but are clearly marked:
- `[INFO]` - General information
- `[SUCCESS]` - Successful operations
- `[WARNING]` - Non-critical issues
- `[ERROR]` - Critical errors

### Disabling Voice Output

For text-only mode:

```bash
# Via environment variable
export KNIK_CONSOLE_ENABLE_VOICE=false
python src/main.py --mode console

# Or toggle during session
You: /toggle-voice
Voice output disabled 🔊
```

## 🐛 Troubleshooting

### Issue: "AI client is not properly configured"

**Solution**: Set up Google Cloud credentials
```bash
export GOOGLE_CLOUD_PROJECT=your-project-id
# Or use Mock AI - it auto-fallbacks
```

### Issue: No voice output

**Possible causes**:
1. Voice output is disabled
   - Check: `/info`
   - Fix: `/toggle-voice`

2. Audio device not available
   - Check: System audio settings
   - Try: Different audio output

3. Missing dependencies
   - Fix: `pip install -r requirements.txt`

### Issue: "Failed to import console app"

**Solution**: Run from the project root
```bash
# Run from project root, not from src/
python src/main.py --mode console
```

### Issue: Slow responses

**Possible causes**:
1. Using gemini-1.5-pro (slower, more capable)
   - Switch to: `export KNIK_AI_MODEL=gemini-1.5-flash`

2. Voice generation taking time
   - Disable temporarily: `/toggle-voice`

3. Network latency
   - Check internet connection

### Issue: Context not maintained

**Solution**: Check history size
```bash
You: /info
# If history is full, increase size:
export KNIK_CONSOLE_MAX_HISTORY=100
```

## 💡 Tips & Tricks

1. **Faster Responses**: Use gemini-1.5-flash model
2. **Better Quality**: Use gemini-1.5-pro model
3. **Save Bandwidth**: Disable voice with `/toggle-voice`
4. **Clear Context**: Use `/clear` to start fresh conversation
5. **Quick Exit**: Press `Ctrl+C` or type `/exit`
6. **Change Voice**: Try different voices to find your favorite
7. **View History**: Use `/history` to review past questions

## 📚 Examples

### Example 1: Research Assistant
```
You: What is quantum computing?
AI: Quantum computing is a type of computing that uses...

You: How is it different from classical computing?
AI: Great question! Classical computers use bits (0 or 1)...

You: What are some real-world applications?
AI: Quantum computing has several promising applications...
```

### Example 2: Creative Writing
```
You: Write a short poem about coding
AI: In lines of code, ideas take flight...

You: Make it more technical
AI: In binary streams and function calls...

You: /clear
Conversation history cleared! 🗑️

You: Now write about AI
AI: Artificial minds, learning and growing...
```

### Example 3: Quick Facts
```
You: /voice af_sky
Voice changed to: af_sky 🎙️

You: Tell me an interesting fact about space
AI: Did you know that a day on Venus is longer than...

You: Another one!
AI: The footprints on the Moon will last for millions...
```

## 🔗 See Also

- [AI Client Guide](./ai_client_guide.md) - Deep dive into AI providers
- [Environment Variables](../ENVIRONMENT_VARIABLES.md) - All configuration options
- [Library Reference](../library/library_reference.md) - API documentation
- [Demo Guide](./demo_guide.md) - Other demo applications

## 🆘 Getting Help

If you encounter issues:
1. Check this troubleshooting guide
2. Review environment variables
3. Try Mock AI mode for testing
4. Check logs for error messages

---

**Happy chatting! 🤖✨**
