# Knik Development Roadmap

**Last Updated:** March 2026

This document tracks what has been built and what's planned for Knik -- a JARVIS-like AI assistant.

---

## Current State

### What We Have Built

#### Core TTS System

- High-quality text-to-speech with Kokoro-82M (82M parameters)
- 9 voices: 5 female (`af_heart`, `af_bella`, `af_sarah`, `af_nicole`, `af_sky`), 4 male (`am_adam`, `am_michael`, `am_leo`, `am_ryan`)
- Async audio processing with dual-thread architecture (`TTSAsyncProcessor`)
- Real-time streaming playback
- WAV file export capability

#### AI Integration

- Unified `AIClient` with 6 providers via registry pattern:
  - `vertex` -- Google Vertex AI (default)
  - `gemini` -- Google AI Studio
  - `glm` -- ZhipuAI (GLM models)
  - `zai` -- ZAI
  - `custom` -- Any OpenAI-compatible API (Ollama, LM Studio, Groq, etc.)
  - `mock` -- Testing/fallback
- Streaming responses with `chat_stream()`
- Non-streaming responses with `chat()`
- Dynamic provider and model switching at runtime
- Function calling with MCP tool integration
- Configurable system instructions
- Auto-fallback to mock provider when initialization fails

#### MCP Tools System (31 Tools, 7 Categories)

| Category | Count | Tools |
| --- | --- | --- |
| Utils | 4 | calculator, timer, random_number, uuid_generator |
| Text | 5 | word_count, text_transform, regex_search, summarize, translate |
| Shell | 1 | execute_command |
| File | 8 | read_file, write_file, list_directory, create_directory, delete_file, move_file, file_info, search_files |
| Browser | 6 | open_url, search_web, scrape_page, screenshot, click_element, type_text |
| Cron | 3 | schedule_task, list_schedules, delete_schedule |
| Workflow | 4 | create_workflow, execute_workflow, list_workflows, get_workflow |

#### Four Application Interfaces

**Console App:**
- 14 built-in commands: `/help`, `/exit`, `/quit`, `/clear`, `/history`, `/voice`, `/info`, `/toggle-voice`, `/tools`, `/agent`, `/provider`, `/model`, `/debug`, `/workflow`
- Conversation history with configurable context size
- Command registry pattern for extensibility

**GUI App (CustomTkinter):**
- Animated gradient background with smooth color transitions
- Dynamic theme system (Dark, Light, System modes)
- Real-time AI streaming with messenger-style chat bubbles
- Settings panel: AI provider, model, temperature, voice, theme

**Web App (React + FastAPI):**
- Ultra-glassmorphism UI with 60fps animations
- 5 pages: Home (chat), Workflows, WorkflowBuilder, ExecutionDetail, AllExecutions
- 29 reusable React components
- 7 backend route files, 22 API endpoints
- SSE streaming for text + audio
- Workflow engine with visual graph builder

**Electron Desktop:**
- Packages web app as native desktop application
- macOS (dmg + zip), Windows (NSIS + portable), Linux (AppImage + deb)
- Hardened runtime and code signing support

#### Workflow & Scheduler Engine

- Visual workflow builder with ReactFlow canvas
- Node types: AI, Function, Condition, Loop, Input, Output
- Natural language schedule descriptions (not cron expressions)
- Automatic execution with recurrence support
- Execution history and analytics dashboard

#### Architecture

- Three-layer structure: `lib/` (reusable), `apps/` (applications), `imports.py` (import hub)
- Registry pattern for providers and MCP tools
- 11 path aliases for clean frontend imports
- Graph data structure library with d3-force layout

---

## What We Can Build Next

### Phase 2: Speech-to-Text & Voice Input

**Goal:** Enable voice commands and conversations

- STT implementation (Whisper, faster-whisper, or SpeechRecognition)
- Hotword detection ("Hey Jarvis")
- Push-to-talk button in GUI/Web
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

| Priority | Items |
| --- | --- |
| High | STT integration, system monitoring tools, web search |
| Medium | Productivity tools, vision/OCR, proactive assistance, memory system |
| Low | Smart home integration, cloud sync, multi-user support |

---

## Related Documentation

- [MCP Tools](../guides/mcp.md)
- [Console App](../guides/console.md)
- [API Reference](../reference/api.md)
- [Environment Variables](../reference/environment-variables.md)
- [Setup Guide](setup.md)
- [Web App](../guides/web-app.md)
- [Scheduler](../guides/scheduler.md)
