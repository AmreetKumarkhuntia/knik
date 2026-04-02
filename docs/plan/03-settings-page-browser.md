# Plan 03: Settings Page — Browser and App Settings

**Status:** Planning
**Last Updated:** April 2026

---

## Problem

The Sidebar has a `<Settings />` icon button with no `onClick` handler and no route — clicking it does nothing. There is no settings page in the frontend. The admin API (`GET/POST /api/admin/settings`) handles provider, model, voice, api_base, and api_key — but has no browser-related settings. Browser config is only settable via `.env` variables (`KNIK_BROWSER_HEADLESS`, `KNIK_BROWSER_PROFILE_DIR`).

Users currently cannot:
- View or change the active AI model or provider from the UI (except via `.env`)
- Configure browser headless mode or profile directory at runtime
- See any of the current settings in one place

---

## Proposed Approach

1. Create a `Settings` page/modal in the frontend
2. Wire the Sidebar settings button to open it
3. Extend the backend admin settings endpoint to include browser settings
4. Persist browser settings to config at runtime (same pattern as model/api_key)

---

## Key Files

| File | Change |
|------|--------|
| `src/apps/web/frontend/src/lib/sections/layout/Sidebar.tsx` | Add `onClick` to settings icon — open settings modal or navigate to `/settings` |
| `src/apps/web/frontend/src/lib/pages/Settings.tsx` | **New** — settings page component |
| `src/apps/web/frontend/src/lib/sections/settings/` | **New** — settings sections (general, browser, etc.) |
| `src/apps/web/frontend/src/services/api.ts` | Add `settingsApi` methods for GET/POST settings |
| `src/apps/web/frontend/src/App.tsx` | Add `/settings` route if using a page (not a modal) |
| `src/apps/web/backend/routes/admin.py` | Extend `SettingsUpdate` model and `POST /api/admin/settings` to include browser fields |
| `src/lib/core/config.py` | Expose browser config fields as mutable at runtime (similar to model/api_key) |

---

## Rough Steps

1. **Extend backend `SettingsUpdate` model** in `admin.py` to include `browser_headless: bool | None` and `browser_profile_dir: str | None`
2. **Update `POST /api/admin/settings` handler** to apply browser settings to `Config` at runtime
3. **Update `GET /api/admin/settings`** to return current browser settings alongside existing fields
4. **Create `Settings.tsx` page** with sections:
   - **AI**: model selector, provider, api_base, api_key
   - **Browser**: headless toggle, profile directory path input
5. **Create `settingsApi`** in `api.ts` — `getSettings()` and `updateSettings(payload)`
6. **Wire Sidebar settings button** — either navigate to `/settings` route or open as a modal/drawer
7. **Add `/settings` route** in `App.tsx` if using a dedicated page
8. **Test** — change model in UI, verify it takes effect in next chat; toggle headless, verify browser behaviour changes

---

## Notes

- The existing `POST /api/admin/settings` already does runtime mutation of the singleton config (`Config` instance) — follow this same pattern for browser settings
- Browser settings that require a browser restart (e.g., profile_dir) should either restart the browser session automatically or warn the user that changes take effect on next session
- Consider grouping settings into tabs or sections in the UI for future extensibility (more settings will be added over time)
- If this is implemented as a modal, Sidebar state management (open/close) needs to be added — a simple `useState` in Sidebar or a global UI slice is fine
