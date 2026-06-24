"""Request models for cron schedule endpoints."""

from pydantic import BaseModel


class ScheduleCreateRequest(BaseModel):
    """Request body for creating a new cron schedule."""

    target_workflow_id: str
    schedule_description: str
    timezone: str = "UTC"


class ScheduleToggleRequest(BaseModel):
    """Request body for toggling a schedule's enabled status."""

    enabled: bool
