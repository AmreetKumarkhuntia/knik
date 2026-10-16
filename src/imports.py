"""Import hub for the apps (backend, bot, worker, console).

Apps import library names from here instead of deep ``lib.*`` paths, so a library
module can move without touching every app. Library code under ``lib/`` never
imports this module. Names resolve lazily on first access, so an app only loads the
integrations it actually uses.
"""

from __future__ import annotations

import importlib
from typing import TYPE_CHECKING, Any


# name -> (module, attribute); attribute None means the module itself.
_EXPORTS: dict[str, tuple[str, str | None]] = {
    # core / utils
    "Config": ("lib.core.config", "Config"),
    "AudioConfig": ("lib.core", "AudioConfig"),
    "printer": ("lib.utils.printer", "printer"),
    "Printer": ("lib.utils.printer", "Printer"),
    "PrinterConfig": ("lib.utils.printer", "PrinterConfig"),
    "LogLevel": ("lib.utils.printer", "LogLevel"),
    # commands
    "CommandService": ("lib.commands.service", "CommandService"),
    "CommandDefinition": ("lib.commands.models", "CommandDefinition"),
    "CommandResult": ("lib.commands.models", "CommandResult"),
    "CommandRegistry": ("lib.commands.registry", "CommandRegistry"),
    "CommandDispatcher": ("lib.commands.registry", "CommandDispatcher"),
    "register_shared_commands": ("lib.commands.handlers", "register_shared_commands"),
    # tools
    "ToolRegistry": ("lib.tools.registry", "ToolRegistry"),
    "cleanup_all_tools": ("lib.tools.registry", "cleanup_all_tools"),
    "create_tool_registry": ("lib.tools.index", "create_tool_registry"),
    "build_workflow_client": ("lib.tools.index", "build_workflow_client"),
    "register_all_tools": ("lib.tools.index", "register_all_tools"),
    "get_all_tools": ("lib.tools.index", "get_all_tools"),
    "get_tool_info": ("lib.tools.index", "get_tool_info"),
    "ALL_TOOL_CLASSES": ("lib.tools.catalog", "ALL_TOOL_CLASSES"),
    "ConsentRequest": ("lib.tools.consent", "ConsentRequest"),
    "format_consent_prompt": ("lib.tools.consent", "format_consent_prompt"),
    "parse_consent_reply": ("lib.tools.consent", "parse_consent_reply"),
    # workflows
    "schedule_service": ("lib.workflows.schedule_service", None),
    "workflow_service": ("lib.workflows.workflow_service", None),
    "Scheduler": ("lib.workflows.scheduler", "Scheduler"),
    "WorkflowError": ("lib.workflows.errors", "WorkflowError"),
    "NotFoundError": ("lib.workflows.errors", "NotFoundError"),
    "ValidationError": ("lib.workflows.errors", "ValidationError"),
    "Schedule": ("lib.services.db.models", "Schedule"),
    "Workflow": ("lib.services.db.models", "Workflow"),
    # services: ai_client
    "AIClient": ("lib.services.ai_client.client", "AIClient"),
    "MockAIClient": ("lib.services.ai_client.client", "MockAIClient"),
    "AIClientCache": ("lib.services.ai_client.client_cache", "AIClientCache"),
    "cleanup_client_tools": ("lib.services.ai_client.client_cache", "cleanup_client_tools"),
    "ClientSettings": ("lib.services.ai_client.factory", "ClientSettings"),
    "build_client": ("lib.services.ai_client.factory", "build_client"),
    "ProviderRegistry": ("lib.services.ai_client.registry.provider_registry", "ProviderRegistry"),
    "ConversationReady": ("lib.services.ai_client.stream_events", "ConversationReady"),
    "StreamDone": ("lib.services.ai_client.stream_events", "StreamDone"),
    "StreamError": ("lib.services.ai_client.stream_events", "StreamError"),
    "TextDelta": ("lib.services.ai_client.stream_events", "TextDelta"),
    "ToolCallFinished": ("lib.services.ai_client.stream_events", "ToolCallFinished"),
    "ToolCallStarted": ("lib.services.ai_client.stream_events", "ToolCallStarted"),
    # services: tts
    "AudioProcessor": ("lib.services.tts", "AudioProcessor"),
    "KokoroVoiceModel": ("lib.services.tts", "KokoroVoiceModel"),
    "TTSAsyncProcessor": ("lib.services.tts", "TTSAsyncProcessor"),
    "VoiceModel": ("lib.services.tts", "VoiceModel"),
    "is_speakable": ("lib.services.tts.utils", "is_speakable"),
    # services: database
    "PostgresDB": ("lib.services.db.connection", "PostgresDB"),
    "DatabaseUnavailable": ("lib.services.db.connection", "DatabaseUnavailable"),
    "DB_ERRORS": ("lib.services.db.connection", "DB_ERRORS"),
    "UndefinedTable": ("lib.services.db.connection", "UndefinedTable"),
    "ConversationDB": ("lib.services.db.repositories.conversations", "ConversationDB"),
    "ConversationScope": ("lib.services.db.repositories.conversations", "ConversationScope"),
    "UserDB": ("lib.services.db.repositories.users", "UserDB"),
    "WorkflowDB": ("lib.services.db.repositories.workflows", "WorkflowDB"),
    "ScheduleDB": ("lib.services.db.repositories.schedules", "ScheduleDB"),
    "ExecutionDB": ("lib.services.db.repositories.executions", "ExecutionDB"),
    "SettingsDB": ("lib.services.db.repositories.settings", "SettingsDB"),
    "ApiKeyDB": ("lib.services.db.repositories.settings", "ApiKeyDB"),
    "McpToolsDB": ("lib.services.db.repositories.settings", "McpToolsDB"),
    # services: telegram
    "TelegramClient": ("lib.services.telegram.client", "TelegramClient"),
    "BotCommand": ("lib.services.telegram.models", "BotCommand"),
    "IncomingMessage": ("lib.services.telegram.models", "IncomingMessage"),
    "MessageResult": ("lib.services.telegram.models", "MessageResult"),
    # services: browser
    "browser": ("lib.services.browser", None),
}

if TYPE_CHECKING:
    # Explicit `X as X` re-exports give type checkers the real types behind the lazy names.
    from lib.commands.handlers import register_shared_commands as register_shared_commands
    from lib.commands.models import CommandDefinition as CommandDefinition
    from lib.commands.models import CommandResult as CommandResult
    from lib.commands.registry import CommandDispatcher as CommandDispatcher
    from lib.commands.registry import CommandRegistry as CommandRegistry
    from lib.commands.service import CommandService as CommandService
    from lib.core import AudioConfig as AudioConfig
    from lib.core.config import Config as Config
    from lib.services import browser as browser
    from lib.services.ai_client.client import AIClient as AIClient
    from lib.services.ai_client.client import MockAIClient as MockAIClient
    from lib.services.ai_client.client_cache import AIClientCache as AIClientCache
    from lib.services.ai_client.client_cache import cleanup_client_tools as cleanup_client_tools
    from lib.services.ai_client.factory import ClientSettings as ClientSettings
    from lib.services.ai_client.factory import build_client as build_client
    from lib.services.ai_client.registry.provider_registry import ProviderRegistry as ProviderRegistry
    from lib.services.ai_client.stream_events import ConversationReady as ConversationReady
    from lib.services.ai_client.stream_events import StreamDone as StreamDone
    from lib.services.ai_client.stream_events import StreamError as StreamError
    from lib.services.ai_client.stream_events import TextDelta as TextDelta
    from lib.services.ai_client.stream_events import ToolCallFinished as ToolCallFinished
    from lib.services.ai_client.stream_events import ToolCallStarted as ToolCallStarted
    from lib.services.db.connection import DB_ERRORS as DB_ERRORS
    from lib.services.db.connection import DatabaseUnavailable as DatabaseUnavailable
    from lib.services.db.connection import PostgresDB as PostgresDB
    from lib.services.db.connection import UndefinedTable as UndefinedTable
    from lib.services.db.models import Schedule as Schedule
    from lib.services.db.models import Workflow as Workflow
    from lib.services.db.repositories.conversations import ConversationDB as ConversationDB
    from lib.services.db.repositories.conversations import ConversationScope as ConversationScope
    from lib.services.db.repositories.executions import ExecutionDB as ExecutionDB
    from lib.services.db.repositories.schedules import ScheduleDB as ScheduleDB
    from lib.services.db.repositories.settings import ApiKeyDB as ApiKeyDB
    from lib.services.db.repositories.settings import McpToolsDB as McpToolsDB
    from lib.services.db.repositories.settings import SettingsDB as SettingsDB
    from lib.services.db.repositories.users import UserDB as UserDB
    from lib.services.db.repositories.workflows import WorkflowDB as WorkflowDB
    from lib.services.telegram.client import TelegramClient as TelegramClient
    from lib.services.telegram.models import BotCommand as BotCommand
    from lib.services.telegram.models import IncomingMessage as IncomingMessage
    from lib.services.telegram.models import MessageResult as MessageResult
    from lib.services.tts import AudioProcessor as AudioProcessor
    from lib.services.tts import KokoroVoiceModel as KokoroVoiceModel
    from lib.services.tts import TTSAsyncProcessor as TTSAsyncProcessor
    from lib.services.tts import VoiceModel as VoiceModel
    from lib.services.tts.utils import is_speakable as is_speakable
    from lib.tools.catalog import ALL_TOOL_CLASSES as ALL_TOOL_CLASSES
    from lib.tools.consent import ConsentRequest as ConsentRequest
    from lib.tools.consent import format_consent_prompt as format_consent_prompt
    from lib.tools.consent import parse_consent_reply as parse_consent_reply
    from lib.tools.index import build_workflow_client as build_workflow_client
    from lib.tools.index import create_tool_registry as create_tool_registry
    from lib.tools.index import get_all_tools as get_all_tools
    from lib.tools.index import get_tool_info as get_tool_info
    from lib.tools.index import register_all_tools as register_all_tools
    from lib.tools.registry import ToolRegistry as ToolRegistry
    from lib.tools.registry import cleanup_all_tools as cleanup_all_tools
    from lib.utils.printer import LogLevel as LogLevel
    from lib.utils.printer import Printer as Printer
    from lib.utils.printer import PrinterConfig as PrinterConfig
    from lib.utils.printer import printer as printer
    from lib.workflows import schedule_service as schedule_service
    from lib.workflows import workflow_service as workflow_service
    from lib.workflows.errors import NotFoundError as NotFoundError
    from lib.workflows.errors import ValidationError as ValidationError
    from lib.workflows.errors import WorkflowError as WorkflowError
    from lib.workflows.scheduler import Scheduler as Scheduler


__all__ = sorted(_EXPORTS)  # pyright: ignore[reportUnsupportedDunderAll]


def __getattr__(name: str) -> Any:
    try:
        module_name, attribute = _EXPORTS[name]
    except KeyError:
        raise AttributeError(f"module 'imports' has no attribute {name!r}") from None
    module = importlib.import_module(module_name)
    value = module if attribute is None else getattr(module, attribute)
    globals()[name] = value
    return value


def __dir__() -> list[str]:
    return __all__
