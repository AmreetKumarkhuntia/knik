# Plan 07: MCP Authentication — Per-Tool Credentials

**Status:** Planning
**Last Updated:** April 2026

---

## Problem

Currently there is no per-MCP/per-tool authentication in Knik. All tools are registered and available unconditionally. The browser tool relies on a persistent Playwright profile to retain login state (cookies/sessions), which is a workaround rather than a proper auth mechanism.

There is no way to:
- Store credentials for a specific MCP tool (e.g., an API key for a search tool, OAuth tokens for a calendar tool)
- Authenticate a user to an external service through the Knik UI
- Restrict which tools are available based on whether credentials are provided
- Rotate or revoke per-tool credentials at runtime

The existing `SettingsUpdate` model has `api_key` for the AI provider — this pattern could be extended but is not sufficient on its own for per-tool credentials.

---

## Proposed Approach

Introduce a **credential store** for MCP tools: a DB-backed key-value store mapping `(tool_name, credential_key)` → encrypted value. Tools declare what credentials they need; the `MCPServerRegistry` checks whether required credentials are present before registering a tool, and injects them into tool execution context.

### Phases

**Phase 1 — Credential storage and injection**
- DB table: `tool_credentials (tool_name, key, encrypted_value, created_at, updated_at)`
- Backend API: `GET/POST/DELETE /api/admin/tools/:tool_name/credentials`
- `BaseTool` (from Plan 01) declares `required_credentials: list[str]`
- `MCPServerRegistry` reads credentials from DB and passes them to `execute()`

**Phase 2 — Browser OAuth flow (optional)**
- Add an OAuth callback endpoint to the web backend
- A tool can declare `oauth_config` with authorize URL, token URL, scopes
- The settings UI shows an "Authorize" button per tool that opens the OAuth flow

---

## Key Files

| File | Change |
|------|--------|
| `src/lib/services/tool_credentials/` | **New** — credential store service (`db_client.py`, `models.py`, `encryption.py`) |
| `src/lib/services/ai_client/registry/mcp_registry.py` | Load credentials from store before registering tools; pass to `execute()` |
| `src/lib/tools/base.py` | Add `required_credentials` and `optional_credentials` class attributes |
| `src/apps/web/backend/routes/admin.py` | Add `GET/POST/DELETE /api/admin/tools/:name/credentials` endpoints |
| `src/apps/web/backend/routes/` | Optionally add `oauth.py` for OAuth callback handling (Phase 2) |
| `src/apps/web/frontend/src/lib/pages/Settings.tsx` | Add "Tools" tab showing per-tool credential status and input forms |
| `src/apps/web/frontend/src/services/api.ts` | Add `toolCredentialsApi` methods |

---

## Rough Steps

**Phase 1:**

1. **Design DB schema** — `tool_credentials` table with `tool_name TEXT`, `key TEXT`, `encrypted_value TEXT`, `created_at`, `updated_at`; primary key on `(tool_name, key)`
2. **Create credential service** in `src/lib/services/tool_credentials/`:
   - `db_client.py` — CRUD operations on `tool_credentials` table
   - `encryption.py` — symmetric encryption/decryption using a key derived from a `KNIK_SECRET_KEY` env var (use `cryptography` library's Fernet or similar)
   - `models.py` — `ToolCredential` dataclass
3. **Update `BaseTool`** (Plan 01 prerequisite) — add `required_credentials: list[str] = []` and `optional_credentials: list[str] = []` class attributes
4. **Update `MCPServerRegistry`** — before registering a tool, load its credentials from the store; pass as a `credentials: dict[str, str]` argument to `execute()`; if required credentials are missing, register the tool as "unavailable" with a descriptive error
5. **Add admin API endpoints** — `GET /api/admin/tools` (list all tools with credential status), `POST /api/admin/tools/:name/credentials` (set a credential), `DELETE /api/admin/tools/:name/credentials/:key` (revoke)
6. **Add Tools tab to Settings UI** — list registered tools, show which credentials are set vs. missing, provide input fields to set credentials
7. **Test** — add a credential via the UI, verify tool becomes available; remove it, verify tool is marked unavailable

**Phase 2 (OAuth — optional):**

8. **Add `oauth_config` to `BaseTool`** — `authorize_url`, `token_url`, `scopes`, `callback_path`
9. **Add OAuth callback route** — `GET /api/oauth/callback/:tool_name` — exchanges code for token, stores in credential store
10. **Add "Authorize" button** in Settings UI for tools with `oauth_config`

---

## Notes

- Credential encryption is important — even if the DB is local, values should not be stored in plaintext
- `KNIK_SECRET_KEY` must be set in `.env`; generate a warning at startup if it is missing
- This plan has a soft dependency on Plan 01 (Tool base class) — the `required_credentials` declaration on `BaseTool` is cleaner than adding it to the existing `ToolSessionManager`
- This plan also has a soft dependency on Plan 03 (Settings page) — the Tools tab in settings is an extension of the settings page
- For the browser tool specifically, per-tool auth is less critical because the Playwright profile already persists sessions; focus Phase 1 on tools that need API keys
