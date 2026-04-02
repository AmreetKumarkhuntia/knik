# Conventions & Pitfalls

## Project-Specific Conventions

1. **Printer vs print:** Use `printer` for internal logging. Use regular `print()` for direct user output (e.g., debug mode)
2. **Voice names:** Female `af_*` (heart, bella, sarah, nicole, sky) vs Male `am_*` (adam, michael, leo, ryan)
3. **Provider naming:** Always lowercase in registry (`vertex`, `gemini`, `zhipuai`, `zai`, `custom`, `mock`)
4. **Run from src/:** Most import paths assume `src/` as working directory
5. **Config classes:** Each app has a Config class reading from env vars with defaults
6. **Dynamic switching:** `/provider` and `/model` commands recreate AIClient to apply changes while preserving MCP tools and system instructions
7. **AI methods:** Use `chat()` and `chat_stream()` (not `query()` / `query_stream()`)

## Common Pitfalls

- **Don't forget** `start_async_processing()` before `play_async()` - threads won't start
- **Mock provider confusion:** AIClient auto-switches to mock if real provider unconfigured (check logs)
- **Import errors:** Run from `src/` directory, not project root
- **Blocking on TTS:** Always check `is_processing_complete()` or you'll exit before audio plays
- **MCP tool registration:** Must call `register_all_tools(ai_client)` before AI can use tools
- **Web app startup:** Use `start:web:backend` + `start:web:frontend` separately (no combined `start:web` script)
- **Frontend port:** Dev server runs on port 12414, not 5173
- **Scheduler uses natural language:** Not cron expressions. Schedule model has `schedule_description` + `recurrence_seconds`, not `cron_expression`
- **Schedule foreign key:** Field is `target_workflow_id`, not `workflow_id`
