# Console App Quick Reference

Quick commands and usage for the Knik Console App.

## Start Console

```bash
cd src
python main.py --mode console
```

## Commands

| Command | Action |
|---------|--------|
| `/help` | Show help |
| `/exit` or `/quit` | Exit app |
| `/clear` | Clear history |
| `/history` | Show conversation history |
| `/voice <name>` | Change voice (e.g., `/voice am_adam`) |
| `/info` | Show configuration |
| `/toggle-voice` | Enable/disable voice |

## Available Voices

**Female**: `af_sarah`, `af_heart`, `af_bella`, `af_nicole`, `af_sky`  
**Male**: `am_adam`, `am_michael`, `am_leo`, `am_ryan`

## Setup Google Cloud (Optional)

For real AI responses with Vertex AI:

```bash
export GOOGLE_CLOUD_PROJECT=your-project-id
export KNIK_AI_MODEL=gemini-1.5-flash
```

Without this, Mock AI is used automatically.

## Examples

```
You: What is machine learning?
AI: [AI explains machine learning with voice]

You: /voice am_adam
Voice changed to: am_adam 🎙️

You: Tell me more
AI: [Continues conversation with new voice]

You: /exit
Goodbye! 👋
```

## Troubleshooting

- **No voice?** Check `/info` and try `/toggle-voice`
- **Mock AI only?** Set `GOOGLE_CLOUD_PROJECT` for real AI
- **Import error?** Run from `src/` directory

For full guide: [Console App Guide](./console_app_guide.md)
