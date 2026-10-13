# Conventions & Pitfalls

## Commenting on Code

1. Comments should only be allowed if it explains why we are doing some specific thing
2. Comments which explains what is straight up useless and shouldn't be kept at all

## Project-Specific Conventions

1. **Printer vs print:** Use `printer` for internal logging. Use regular `print()` for direct user output (e.g., debug mode)
2. **Voice names:** Female `af_*` (heart, bella, sarah, nicole, sky) vs Male `am_*` (adam, michael, leo, ryan)
3. **Provider naming:** Always lowercase in registry (`vertex`, `gemini`, `zhipuai`, `zai`, `zai_coding`, `custom`, `mock`)
4. **`src/` is the import root:** `python src/main.py` puts it on `sys.path`; run `python -m backend.main` from inside `src/`; pytest gets it from `pythonpath` in `pyproject.toml`. Never add `sys.path.insert` (CI rejects it)
5. **Config classes:** `Config` (`lib/core/config.py`) reads env vars with defaults; the backend, bot and console extend it (`WebBackendConfig`, `BotConfig`, `ConsoleConfig`) and the worker uses it as is
6. **Import hub is for apps only:** apps import through `imports.py`; `lib/` code imports `lib.*` directly and never imports `imports.py` or an app
7. **Dynamic switching:** `/provider` and `/model` swap the provider inside the caller's own `AIClient` (`set_provider`/`set_model`), keeping its registered tools and system instruction
8. **AI methods:** Use `chat()` and `chat_stream()` (not `query()` / `query_stream()`)

## Common Pitfalls

- **Don't forget** `start_async_processing()` before `play_async()` - threads won't start
- **Mock provider confusion:** AIClient auto-switches to mock if real provider unconfigured (check logs)
- **Import errors:** Launch with `python src/main.py --mode ...` from the repo root, or `cd src` before `python -m backend.main`
- **Blocking on TTS:** Always check `is_processing_complete()` or you'll exit before audio plays
- **Tool registration:** Build the registry with `create_tool_registry()` and pass it to `build_client(settings, tool_registry=...)` before AI can use tools
- **Web app startup:** Use `start:web:backend` + `start:web:frontend` separately (no combined `start:web` script)
- **Ports:** Backend runs on 8010 (`KNIK_WEB_PORT`), the frontend dev server on 8020 (not Vite's default 5173)
- **Schedules need the worker:** Schedules only fire while `npm run start:worker` (or `--mode worker`) is running
- **Scheduler uses natural language:** Not cron expressions. Schedule model has `schedule_description` + `recurrence_seconds`, not `cron_expression`
- **Schedule target:** The field is `target_workflow_id`, not `workflow_id`. It is not a database foreign key: `workflow_service.delete_workflow()` deletes a workflow's schedules itself
