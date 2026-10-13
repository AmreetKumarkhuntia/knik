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
    "BaseProcessor": ("lib.utils.console_processor", "BaseProcessor"),
    "CommandProcessor": ("lib.utils.console_processor", "CommandProcessor"),
    "ConsoleProcessor": ("lib.utils.console_processor", "ConsoleProcessor"),
    "create_processor": ("lib.utils.console_processor", "create_processor"),
    # commands
    "CommandService": ("lib.commands.service", "CommandService"),
    "CommandDefinition": ("lib.commands.models", "CommandDefinition"),
    "CommandResult": ("lib.commands.models", "CommandResult"),
    # tools
    "register_all_tools": ("lib.tools.index", "register_all_tools"),
    "get_all_tools": ("lib.tools.index", "get_all_tools"),
    "get_tool_info": ("lib.tools.index", "get_tool_info"),
    "ALL_TOOL_CLASSES": ("lib.tools.catalog", "ALL_TOOL_CLASSES"),
    "BrowserTool": ("lib.tools.browser_tool", "BrowserTool"),
    # workflows
    "schedule_service": ("lib.workflows.schedule_service", None),
    "workflow_service": ("lib.workflows.workflow_service", None),
    "Scheduler": ("lib.workflows.scheduler", "Scheduler"),
    "Schedule": ("lib.workflows.models", "Schedule"),
    "Workflow": ("lib.workflows.models", "Workflow"),
    # services: ai_client
    "AIClient": ("lib.services.ai_client.client", "AIClient"),
    "MockAIClient": ("lib.services.ai_client.client", "MockAIClient"),
    "AIClientCache": ("lib.services.ai_client.client_cache", "AIClientCache"),
    "BaseTool": ("lib.services.ai_client.base_tool", "BaseTool"),
    "ConsentRequest": ("lib.services.ai_client.consent", "ConsentRequest"),
    "MCPServerRegistry": ("lib.services.ai_client.registry.mcp_registry", "MCPServerRegistry"),
    "ProviderRegistry": ("lib.services.ai_client.registry.provider_registry", "ProviderRegistry"),
    # services: tts
    "AudioProcessor": ("lib.services.tts", "AudioProcessor"),
    "KokoroVoiceModel": ("lib.services.tts", "KokoroVoiceModel"),
    "TTSAsyncProcessor": ("lib.services.tts", "TTSAsyncProcessor"),
    "VoiceModel": ("lib.services.tts", "VoiceModel"),
    "is_speakable": ("lib.services.tts.utils", "is_speakable"),
    # services: database
    "PostgresDB": ("lib.services.postgres.db", "PostgresDB"),
    "ConversationDB": ("lib.services.conversation.db_client", "ConversationDB"),
    "SchedulerDB": ("lib.services.scheduler.db_client", "SchedulerDB"),
    "SettingsDB": ("lib.services.settings.db_client", "SettingsDB"),
    "ApiKeyDB": ("lib.services.settings.db_client", "ApiKeyDB"),
    "McpToolsDB": ("lib.services.settings.db_client", "McpToolsDB"),
    # services: messaging
    "MessagingClient": ("lib.services.messaging_client.client", "MessagingClient"),
    "IncomingMessage": ("lib.services.messaging_client.models", "IncomingMessage"),
    "MessageResult": ("lib.services.messaging_client.models", "MessageResult"),
}

if TYPE_CHECKING:
    # Explicit `X as X` re-exports give type checkers the real types behind the lazy names.
    from lib.commands.models import CommandDefinition as CommandDefinition
    from lib.commands.models import CommandResult as CommandResult
    from lib.commands.service import CommandService as CommandService
    from lib.core import AudioConfig as AudioConfig
    from lib.core.config import Config as Config
    from lib.services.ai_client.base_tool import BaseTool as BaseTool
    from lib.services.ai_client.client import AIClient as AIClient
    from lib.services.ai_client.client import MockAIClient as MockAIClient
    from lib.services.ai_client.client_cache import AIClientCache as AIClientCache
    from lib.services.ai_client.consent import ConsentRequest as ConsentRequest
    from lib.services.ai_client.registry.mcp_registry import MCPServerRegistry as MCPServerRegistry
    from lib.services.ai_client.registry.provider_registry import ProviderRegistry as ProviderRegistry
    from lib.services.conversation.db_client import ConversationDB as ConversationDB
    from lib.services.messaging_client.client import MessagingClient as MessagingClient
    from lib.services.messaging_client.models import IncomingMessage as IncomingMessage
    from lib.services.messaging_client.models import MessageResult as MessageResult
    from lib.services.postgres.db import PostgresDB as PostgresDB
    from lib.services.scheduler.db_client import SchedulerDB as SchedulerDB
    from lib.services.settings.db_client import ApiKeyDB as ApiKeyDB
    from lib.services.settings.db_client import McpToolsDB as McpToolsDB
    from lib.services.settings.db_client import SettingsDB as SettingsDB
    from lib.services.tts import AudioProcessor as AudioProcessor
    from lib.services.tts import KokoroVoiceModel as KokoroVoiceModel
    from lib.services.tts import TTSAsyncProcessor as TTSAsyncProcessor
    from lib.services.tts import VoiceModel as VoiceModel
    from lib.services.tts.utils import is_speakable as is_speakable
    from lib.tools.browser_tool import BrowserTool as BrowserTool
    from lib.tools.catalog import ALL_TOOL_CLASSES as ALL_TOOL_CLASSES
    from lib.tools.index import get_all_tools as get_all_tools
    from lib.tools.index import get_tool_info as get_tool_info
    from lib.tools.index import register_all_tools as register_all_tools
    from lib.utils.console_processor import BaseProcessor as BaseProcessor
    from lib.utils.console_processor import CommandProcessor as CommandProcessor
    from lib.utils.console_processor import ConsoleProcessor as ConsoleProcessor
    from lib.utils.console_processor import create_processor as create_processor
    from lib.utils.printer import LogLevel as LogLevel
    from lib.utils.printer import Printer as Printer
    from lib.utils.printer import PrinterConfig as PrinterConfig
    from lib.utils.printer import printer as printer
    from lib.workflows import schedule_service as schedule_service
    from lib.workflows import workflow_service as workflow_service
    from lib.workflows.models import Schedule as Schedule
    from lib.workflows.models import Workflow as Workflow
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
