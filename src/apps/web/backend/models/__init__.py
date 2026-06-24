"""Pydantic request/response models for the web backend, grouped by domain."""

from apps.web.backend.models.admin import ApiKeyCreate, McpToolToggle, SettingsUpdate
from apps.web.backend.models.analytics import (
    ActivityResponse,
    DashboardResponse,
    TopWorkflowsResponse,
    WorkflowMetricsResponse,
)
from apps.web.backend.models.chat import SimpleChatRequest, StreamChatRequest
from apps.web.backend.models.conversations import ConversationCreate, ConversationUpdate
from apps.web.backend.models.cron import ScheduleCreateRequest, ScheduleToggleRequest
from apps.web.backend.models.history import MessageAdd
from apps.web.backend.models.workflow import (
    WorkflowCreateRequest,
    WorkflowExecuteRequest,
    WorkflowUpdateRequest,
)


__all__ = [
    "ActivityResponse",
    "ApiKeyCreate",
    "ConversationCreate",
    "ConversationUpdate",
    "DashboardResponse",
    "McpToolToggle",
    "MessageAdd",
    "ScheduleCreateRequest",
    "ScheduleToggleRequest",
    "SettingsUpdate",
    "SimpleChatRequest",
    "StreamChatRequest",
    "TopWorkflowsResponse",
    "WorkflowCreateRequest",
    "WorkflowExecuteRequest",
    "WorkflowMetricsResponse",
    "WorkflowUpdateRequest",
]
