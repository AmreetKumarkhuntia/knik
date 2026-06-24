"""Response models for analytics endpoints."""

from pydantic import BaseModel


class DashboardResponse(BaseModel):
    """Response containing dashboard metrics, recent workflows, and executions."""

    success: bool
    data: dict


class WorkflowMetricsResponse(BaseModel):
    """Response containing aggregated workflow execution metrics."""

    success: bool
    metrics: dict


class TopWorkflowsResponse(BaseModel):
    """Response containing top performing workflows sorted by execution count."""

    success: bool
    workflows: list[dict]
    total: int


class ActivityResponse(BaseModel):
    """Response containing recent activity feed entries."""

    success: bool
    activities: list[dict]
