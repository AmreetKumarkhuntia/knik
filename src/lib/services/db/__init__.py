"""PostgreSQL access: the connection pool, row models and one repository per table group.

The one service other services may import. Repositories raise on database errors; callers that must
keep working without Postgres catch ``DB_ERRORS``.
"""

from .connection import DB_ERRORS, DB_OUTAGE_ERRORS, DatabaseUnavailable, PostgresDB
from .models import (
    ApiKey,
    AppSettings,
    Conversation,
    ConversationMessage,
    CreatedApiKey,
    ExecutionRecord,
    McpToolState,
    NodeExecutionRecord,
    Schedule,
    Workflow,
)
from .repositories import ApiKeyDB, ConversationDB, ExecutionDB, McpToolsDB, ScheduleDB, SettingsDB, WorkflowDB


__all__ = [
    "DB_ERRORS",
    "DB_OUTAGE_ERRORS",
    "ApiKey",
    "ApiKeyDB",
    "AppSettings",
    "Conversation",
    "ConversationDB",
    "ConversationMessage",
    "CreatedApiKey",
    "DatabaseUnavailable",
    "ExecutionDB",
    "ExecutionRecord",
    "McpToolState",
    "McpToolsDB",
    "NodeExecutionRecord",
    "PostgresDB",
    "Schedule",
    "ScheduleDB",
    "SettingsDB",
    "Workflow",
    "WorkflowDB",
]
