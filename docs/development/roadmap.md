# Knik Development Roadmap

**Last Updated:** October 2026

This document tracks what has been built and what's planned for Knik -- a JARVIS-like AI assistant.

---

## Current State

### What We Have Built

#### Core TTS System

- Text-to-speech with Kokoro-82M (82M parameters), American English
- 9 voices: 5 female (`af_heart`, `af_bella`, `af_sarah`, `af_nicole`, `af_sky`), 4 male (`am_adam`, `am_michael`, `am_leo`, `am_ryan`)
- Async audio processing with dual-thread architecture (`TTSAsyncProcessor`) in the console
- Per-sentence speech streamed over SSE by the web backend

#### AI Integration

- `AIClient`, built only by `build_client(ClientSettings, tool_registry=...)`, with 7 providers via the registry pattern:
  - `vertex` -- Google Vertex AI (default)
  - `gemini` -- Google AI Studio
  - `zhipuai` -- ZhipuAI (GLM models)
  - `zai` -- Z.AI
  - `zai_coding` -- Z.AI Coding Plan
  - `custom` -- Any OpenAI-compatible API (Ollama, LM Studio, Groq, etc.)
  - `mock` -- Testing/fallback
- Typed streaming events (`TextDelta`, `ToolCallStarted`, `ToolCallFinished`, ...) and `chat()` / `chat_stream()` / `achat_stream()`
- Provider and model switching at runtime (`/provider`, `/model`)
- Tool calling through LangChain agents
- Auto-fallback to the mock provider when a provider is unknown or unconfigured

#### Tools (30, 7 Groups)

An in-process LangChain tool registry (`src/lib/tools`), not Model Context Protocol. See [Tools](../guides/mcp.md).

| Group    | Count | Tools                                                                                                                                   |
| -------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Utils    | 4     | calculate, get_current_time, get_current_date, reverse_string                                                                           |
| Text     | 5     | word_count, find_and_replace, extract_emails, extract_urls, text_case_convert                                                           |
| Shell    | 1     | run_shell_command                                                                                                                       |
| File     | 8     | read_file, list_directory, search_in_files, file_info, write_file, append_to_file, find_in_file, count_in_file                          |
| Browser  | 5     | browser_navigate, browser_get_text, browser_get_links, browser_click, browser_type (`browser_screenshot` is defined but not registered) |
| Cron     | 3     | add_cron_schedule, list_cron_schedules, remove_cron_schedule                                                                            |
| Workflow | 4     | create_workflow, remove_workflow, list_workflows, get_workflow_templates                                                                |

#### Applications

**Console:** shared commands (`/new`, `/resume`, `/sessions`, `/model`, `/provider`, `/status`), `/help` and
console commands (`/exit`, `/quit`, `/clear`, `/history`, `/voice`, `/toggle-voice`, `/tools`, `/agent`, `/debug`,
`/workflow`); in-memory history with a configurable context size.

**Web backend (FastAPI, port 8010):** 7 route files with 36 endpoints under `/api`, SSE streaming of text, tool
calls and audio, an optional API key check, CORS limited to configured origins, and admin switches for tool
groups.

**Web frontend (React, port 8020):** chat, workflows, workflow builder, executions, schedules and settings
pages, currently running on an in-memory demo session.

**Electron:** wraps the frontend; macOS (dmg + zip), Windows (NSIS + portable), Linux (AppImage + deb) targets.

**Telegram bot:** long-running daemon (`--mode bot`), one AI client and tool registry per user, a busy reply for
a chat whose previous reply is still running, at most `KNIK_BOT_CONCURRENT_LIMIT` replies at once, and live
draft streaming in private chats.

**Worker:** runs workflow schedules (`--mode worker`).

#### Context Management

- Model discovery from provider APIs with a static fallback for context windows
- Per-turn token usage tracking (input, output, total)
- Blocking conversation compaction when context use reaches 95% of the model's window (`KNIK_COMPACTION_*`)

#### Tool Consent

- Tool groups declare `consent_required_for`; `ToolRegistry.execute_tool()` asks the app's consent gate
- The bot asks in the chat and waits for the user's reply; the console asks with `input()`
- Web chats cannot ask yet: `KNIK_WEB_TOOL_CONSENT` (`deny` by default) answers

#### Workflow & Scheduler Engine

- Visual workflow builder (frontend)
- Node types: Function, AI, Conditional branch, Flow merge, Start, End
- Natural language schedule descriptions (not cron expressions), claimed atomically so each due run happens once
- Execution history and analytics endpoints

#### Architecture

- `src/` holds the apps (`backend`, `bot`, `worker`, `console`), the layered `lib/` and the `imports.py` hub;
  import-linter enforces the rules (see `contribution-guidelines/architecture.md`)
- Registry pattern for providers, tools and commands
- 9 path aliases for frontend imports

---

## What We Can Build Next

### Phase 2: Speech-to-Text & Voice Input

**Goal:** Enable voice commands and conversations

- STT implementation (Whisper, faster-whisper, or SpeechRecognition)
- Hotword detection ("Hey Jarvis")
- Push-to-talk button in the console and web app
- Always-on listening mode
- Audio input visualization

### Phase 3: Extended MCP Tools

**Goal:** Add system monitoring, productivity, and vision capabilities

- System & hardware tools (CPU, RAM, battery, processes, clipboard)
- Web & internet tools (search, fetch, download)
- Productivity tools (reminders, timers, notes, todos)
- Communication tools (email, notifications)
- AI vision tools (image analysis, OCR, object detection)

### Phase 4: Advanced Intelligence

**Goal:** Proactive assistance and context awareness

- Proactive monitoring (calendar, system health, network)
- Enhanced context awareness (active window, files, patterns)
- Memory & knowledge system (vector DB, semantic search)
- Screen analysis (periodic capture, contextual help)

### Phase 5: Polish & Production

**Goal:** Production-ready with extensibility

- Plugin architecture with hot-reload
- Multi-language UI support (i18n)
- Cloud sync (optional)
- Comprehensive test suite (>80% coverage)
- User guide and video tutorials

---

## Priority Matrix

| Priority | Items                                                               |
| -------- | ------------------------------------------------------------------- |
| High     | STT integration, system monitoring tools, web search                |
| Medium   | Productivity tools, vision/OCR, proactive assistance, memory system |
| Low      | Smart home integration, cloud sync, multi-user support              |

---

## Related Documentation

- [MCP Tools](../guides/mcp.md)
- [Console App](../guides/console.md)
- [API Reference](../reference/api.md)
- [Environment Variables](../reference/environment-variables.md)
- [Setup Guide](setup.md)
- [Web App](../guides/web-app.md)
- [Scheduler](../guides/scheduler.md)
