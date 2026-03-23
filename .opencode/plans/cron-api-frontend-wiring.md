# Cron API & Frontend Wiring Fix

## Branch: `fix/cron-api-frontend-wiring`

## Problem
The cron/scheduling system backend engine is fully built but the REST API and frontend are incomplete:
- REST API `POST /api/cron/` doesn't accept `schedule_description`, so schedules have no timing and never fire
- Frontend types use stale field names (`workflow_id`, `trigger_workflow_id`) instead of `target_workflow_id`
- ScheduleForm has no schedule description input
- ScheduleCard doesn't show schedule timing info
- `list_schedules` response is missing key fields

## Files to Change (6 files, 0 new)

### 1. `src/apps/web/backend/routes/cron.py` (Backend API)
- **`ScheduleCreateRequest`**: Replace `trigger_workflow_id` with `target_workflow_id`, add `schedule_description: str`
- **`POST /`**: Import `_calculate_first_run` and `_parse_recurrence_seconds` from `lib.mcp.implementations.workflow_impl`. Parse `schedule_description` to compute `next_run_at` and `recurrence_seconds`. Return them in response.
- **`GET /`**: Add `schedule_description`, `next_run_at`, `recurrence_seconds`, `enabled` to serialized output. Fix field name to `target_workflow_id`.
- **`PATCH /{id}/toggle`**: Fix response field names, add full schedule serialization.
- Add `_serialize_schedule()` helper for consistent JSON output.

### 2. `src/apps/web/frontend/src/types/workflow.ts` (TypeScript Types)
- **`Schedule` interface (lines 65-74)**:
  - Remove `workflow_id`, `trigger_workflow_id`
  - Add `target_workflow_id: string`, `schedule_description?: string`, `next_run_at?: string`, `recurrence_seconds?: number`
- **`ScheduleCreateRequest` (lines 151-155)**:
  - Remove `workflow_id`, `trigger_workflow_id`
  - Add `target_workflow_id: string`, `schedule_description: string`
- **`ScheduleCreateResponse` (lines 157-161)**:
  - Remove `workflow_id`
  - Add `next_run_at?: string`, `recurrence_seconds?: number`

### 3. `src/apps/web/frontend/src/types/sections/schedule-manager.ts`
- Remove `triggerWorkflowName?: string` from `ScheduleCardProps`

### 4. `src/apps/web/frontend/src/lib/sections/workflows/ScheduleManager/ScheduleForm.tsx`
- Replace dual "Workflow"/"Trigger Workflow" selectors with single "Target Workflow" selector (`target_workflow_id`)
- Add "Schedule" text input for `schedule_description` with placeholder `"e.g. every 5 minutes, daily at 9am"`
- Update `formData` state to new `ScheduleCreateRequest` shape

### 5. `src/apps/web/frontend/src/lib/sections/workflows/ScheduleManager/ScheduleCard.tsx`
- Replace `schedule.workflow_id` / `schedule.trigger_workflow_id` with `schedule.target_workflow_id`
- Display `schedule.schedule_description` as subtitle
- Show `next_run_at` formatted as human-readable date
- Show recurrence info (convert `recurrence_seconds` to "every X minutes/hours/days")
- Remove `triggerWorkflowName` prop

### 6. `src/apps/web/frontend/src/lib/sections/workflows/ScheduleManager/ScheduleList.tsx`
- Replace `schedule.workflow_id` with `schedule.target_workflow_id`
- Remove `triggerWorkflowName` prop from `ScheduleCard`

## Key Imports (Backend)
```python
from lib.mcp.implementations.workflow_impl import _calculate_first_run, _parse_recurrence_seconds
```

These functions already exist and are used by the MCP tool implementation. They handle:
- `_calculate_first_run(description, timezone)` -> `datetime` (timezone-aware)
- `_parse_recurrence_seconds(description)` -> `int | None`

## Backend Schedule Model (no changes needed)
```python
@dataclass
class Schedule:
    id: int
    target_workflow_id: str
    enabled: bool = True
    timezone: str = "UTC"
    schedule_description: str | None = None
    next_run_at: datetime | None = None
    recurrence_seconds: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    last_executed_at: datetime | None = None
```

## DB Client (no changes needed)
`SchedulerDB.create_schedule()` already accepts all fields including `schedule_description`, `next_run_at`, `recurrence_seconds`.
