# Plan 02: Fix Browser/Create Workflow Page

**Status:** Planning
**Last Updated:** April 2026

---

## Problem

The `/workflows/create` route renders `WorkflowBuilder.tsx` which uses `workflowApi.workflows.create()` to persist new workflows. The backend `workflow.py` route file has no `POST /api/workflows` create endpoint — only list, get, delete, execute, history, and node-executions endpoints exist. As a result, creating a workflow from the UI fails silently or with an unhandled error.

Secondary issues to audit:

- The `Canvas` component in `WorkflowBuilder` may have broken wiring for node/edge state
- No navigation back to `/workflows` after a successful save
- Error states are likely not surfaced to the user

---

## Proposed Approach

1. Add a `POST /api/workflows` backend endpoint that creates a workflow record in the database
2. Verify the frontend `workflowApi.create()` call matches the new endpoint shape
3. Fix any broken Canvas state wiring
4. Add success/error feedback and redirect after save

---

## Key Files

| File                                                                          | Change                                                              |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `src/apps/web/backend/routes/workflow.py`                                     | Add `POST /api/workflows` create endpoint                           |
| `src/apps/web/backend/models/`                                                | Add `WorkflowCreate` Pydantic request model if not present          |
| `src/apps/web/frontend/src/services/workflowApi.ts`                           | Verify `create()` method shape matches new endpoint                 |
| `src/apps/web/frontend/src/lib/pages/WorkflowBuilder.tsx`                     | Add save handler, loading state, error display, redirect on success |
| `src/apps/web/frontend/src/lib/sections/workflows/WorkflowBuilder/Canvas.tsx` | Audit node/edge state wiring                                        |

---

## Rough Steps

1. **Inspect the DB layer** — find the workflow model/table (likely in `src/lib/services/` or similar) to understand what fields a workflow record requires
2. **Add `WorkflowCreate` Pydantic model** in the backend models layer with required fields (name, nodes, edges, etc.)
3. **Add `POST /api/workflows`** route in `workflow.py` — validate input, persist to DB, return created workflow
4. **Audit `workflowApi.ts`** — ensure `create(payload)` posts to the correct URL and passes the right shape
5. **Update `WorkflowBuilder.tsx`** — wire the save button to `workflowApi.create()`, handle loading/error states, redirect to `/workflows` on success
6. **Audit `Canvas.tsx`** — verify node and edge state is correctly lifted up to `WorkflowBuilder` for serialization on save
7. **Test end-to-end** — create a workflow, verify it appears in the workflows list

---

## Notes

- Check if there is a workflow DB client similar to `ConversationDB` — follow the same pattern
- The workflow execution endpoint already exists, so the DB schema for workflows is already defined; the create endpoint is the gap
- Avoid duplicating the `_init_clients()` anti-pattern from `chat.py` — use the shared app state from Plan 04 if that refactor happens first
