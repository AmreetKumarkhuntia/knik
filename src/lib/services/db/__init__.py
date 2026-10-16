"""PostgreSQL access: the connection pool, row models and one repository per table group.

The one service other services may import. Repositories raise on database errors; callers that must
keep working without Postgres catch ``DB_ERRORS``.
"""

from .connection import DB_ERRORS, DB_OUTAGE_ERRORS, DatabaseUnavailable, PostgresDB
from .models import (
    ApiKey,
    Conversation,
    ConversationMessage,
    CreatedApiKey,
    ExecutionRecord,
    McpToolState,
    NodeExecutionRecord,
    Schedule,
    User,
    Workflow,
)
from .repositories import (
    ApiKeyDB,
    ConversationDB,
    ConversationScope,
    ExecutionDB,
    McpToolsDB,
    ScheduleDB,
    SettingsDB,
    UserDB,
    WorkflowDB,
)


__all__ = [
    "DB_ERRORS",
    "DB_OUTAGE_ERRORS",
    "ApiKey",
    "ApiKeyDB",
    "Conversation",
    "ConversationDB",
    "ConversationMessage",
    "ConversationScope",
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
    "User",
    "UserDB",
    "Workflow",
    "WorkflowDB",
]
