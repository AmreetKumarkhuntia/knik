# Knik - AI Coding Agent Instructions

Knik is a multi-interface AI assistant with Text-to-Speech (TTS) capabilities. Built with Python, it features async audio processing, 6 pluggable AI providers (including any OpenAI-compatible endpoint), 31 MCP tools across 7 categories, and a React + FastAPI web app with workflow scheduling.

## Contents

| Document | Description |
|---|---|
| [Architecture](contribution-guidelines/architecture.md) | Three-layer structure, key components (TTS, AI client, apps, scheduler, providers, MCP tools, console commands) |
| [Patterns](contribution-guidelines/patterns.md) | Import conventions, registry patterns, async TTS workflow, adding console commands/MCP tools, coding patterns |
| [Development](contribution-guidelines/development.md) | Running the app, code quality commands, environment setup, cache management |
| [Conventions](contribution-guidelines/conventions.md) | Project-specific conventions and common pitfalls |
| [File Navigation](contribution-guidelines/file-navigation.md) | Key directories, entry points, documentation map |
| [Commit Format](contribution-guidelines/commit-format.md) | Commit message format rules and examples |
