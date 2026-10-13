"""The exact replies of the shared commands, which the bot and the console must both produce.

Each case runs against the fakes in fakes.py; `prepare` puts them in the state the case needs.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from lib.commands.service import DB_UNAVAILABLE_MESSAGE

from .fakes import FakeClient, FakeConversations


@dataclass(frozen=True)
class Case:
    id: str
    text: str
    message: str
    success: bool = True
    empty_db: bool = False
    db_down: bool = False
    # The conversation the caller is in before the command runs, and its token usage.
    conversation: str | None = None
    usage: dict = field(default_factory=dict)
    model: str | None = None
    client_error: str | None = None


def prepare(case: Case, conversations: FakeConversations, client: FakeClient) -> None:
    if case.empty_db:
        conversations.conversations = []
    conversations.unavailable = case.db_down
    if case.conversation and case.usage:
        conversations.usage[case.conversation] = case.usage
    if case.model:
        client.model = case.model
    if case.client_error:
        client.error = RuntimeError(case.client_error)


RESUME_LIST = """Recent conversations:

  #1 Topic 1
     Mar 01 09:31 | 1 msgs
     11111111-aaaa

  #2 Topic 2
     Mar 02 09:32 | 2 msgs
     22222222-bbbb

  #3 Untitled
     Mar 03 09:33 | 3 msgs
     33333333-cccc

  #4 Topic 4
     Mar 04 09:34 | 4 msgs
     44444444-dddd

  #5 Topic 5
     Mar 05 09:35 | 5 msgs
     55555555-eeee

Usage: /resume <id> or /resume #<number>"""

SESSIONS_PAGE_1 = """Conversations (page 1):

  #1 Topic 1
     Mar 01 09:31 | 1 msgs
     11111111-aaaa

  #2 Topic 2
     Mar 02 09:32 | 2 msgs
     22222222-bbbb

  #3 Untitled
     Mar 03 09:33 | 3 msgs
     33333333-cccc

  #4 Topic 4
     Mar 04 09:34 | 4 msgs
     44444444-dddd

  #5 Topic 5
     Mar 05 09:35 | 5 msgs
     55555555-eeee

/resume #<number> or /resume <id> to continue
/sessions 2 for next page"""

SESSIONS_PAGE_2 = """Conversations (page 2):

  #6 Topic 6
     Mar 06 09:36 | 6 msgs
     66666666-ffff

/resume #<number> or /resume <id> to continue"""

MODEL_LIST = """Current model: gemini-2.5-flash

Available models:
 -> gemini-2.5-flash - Fast
    gemini-2.5-pro
    plain-model

Usage: /model <name>"""

PROVIDER_LIST = """Current provider: mock

Available providers:
    gemini
 -> mock
    vertex

Usage: /provider <name>"""

STATUS_NEW_SESSION = """Status:
  Provider: mock
  Model:    gemini-2.5-flash
  Session:  None (new session)
  Tokens:   0 in / 0 out / 0 total
  Cost:     ~$0.000000"""

STATUS_FULL = """Status:
  Provider: mock
  Model:    gemini-2.5-flash
  Session:  11111111-aaaa
  Tokens:   10,000 in / 2,345 out (estimated) / 12,345 total (since last compaction), estimated
  Context:  85,000 / 100,000 (85.0%)  ⚠ approaching limit
  History:  ~4,321 ctx tokens
  Cost:     ~$0.014690"""

STATUS_PARTIAL_UNPRICED = """Status:
  Provider: mock
  Model:    unpriced
  Session:  22222222-bbbb
  Tokens:   10 in / 5 out (partial) / 15 total (estimated)"""

STATUS_USAGE_UNAVAILABLE = """Status:
  Provider: mock
  Model:    gemini-2.5-flash
  Session:  11111111-aaaa
  Tokens:   0 in / 0 out / 0 total
  Cost:     ~$0.000000"""

FULL_USAGE = {
    "db_total": 12345,
    "total_input": 10000,
    "total_output": 2345,
    "has_estimates": True,
    "partial_data": False,
    "had_summarization": True,
    "total_context_tokens": 4321,
    "last_input_tokens": 85000,
}

PARTIAL_USAGE = {
    "db_total": 15,
    "total_input": 10,
    "total_output": 5,
    "has_estimates": False,
    "partial_data": True,
    "had_summarization": False,
    "total_context_tokens": 0,
    "last_input_tokens": 1000,
}

# Every shared command except /new and /help, whose replies differ per app.
SHARED_CASES = [
    Case("resume-list", "/resume", RESUME_LIST),
    Case("resume-list-empty", "/resume", "No previous conversations found.", empty_db=True),
    Case("resume-list-db-down", "/resume", "No previous conversations found.", db_down=True),
    Case("resume-by-index", "/resume #3", "Resumed: Untitled (3 messages)"),
    Case("resume-by-prefix", "/resume 2222", "Resumed: Topic 2 (2 messages)"),
    Case("resume-by-id", "/resume 66666666-ffff", "Resumed: Topic 6 (6 messages)"),
    Case("resume-unknown", "/resume nope", "Could not find conversation: nope", success=False),
    Case("resume-index-out-of-range", "/resume #9", "Could not find conversation: #9", success=False),
    Case("resume-bad-index", "/resume #x", "Could not find conversation: #x", success=False),
    Case("resume-db-down", "/resume 2222", DB_UNAVAILABLE_MESSAGE, success=False, db_down=True),
    Case("sessions-page-1", "/sessions", SESSIONS_PAGE_1),
    Case("sessions-page-0-is-1", "/sessions 0", SESSIONS_PAGE_1),
    Case("sessions-page-2", "/sessions 2", SESSIONS_PAGE_2),
    Case("sessions-past-the-end", "/sessions 3", "No conversations on page 3."),
    Case("sessions-empty", "/sessions", "No conversations found.", empty_db=True),
    Case("sessions-db-down", "/sessions", "No conversations found.", db_down=True),
    Case("sessions-bad-page", "/sessions two", "Usage: /sessions [page]\nExample: /sessions 2", success=False),
    Case("model-list", "/model", MODEL_LIST),
    Case("model-switch", "/model gemini-2.5-pro", "Model switched to gemini-2.5-pro"),
    Case(
        "model-switch-fails", "/model x", "Failed to switch model: quota exceeded", False, client_error="quota exceeded"
    ),
    Case("provider-list", "/provider", PROVIDER_LIST),
    Case("provider-switch", "/provider vertex", "Provider switched to vertex"),
    Case("provider-unknown", "/provider nope", "Unknown provider: nope. Available: gemini, mock, vertex", False),
    Case("provider-switch-fails", "/provider gemini", "Failed to switch provider: boom", False, client_error="boom"),
    Case("status-new-session", "/status", STATUS_NEW_SESSION),
    Case("status-full", "/status", STATUS_FULL, conversation="11111111-aaaa", usage=FULL_USAGE),
    Case(
        "status-partial-unpriced",
        "/status",
        STATUS_PARTIAL_UNPRICED,
        conversation="22222222-bbbb",
        usage=PARTIAL_USAGE,
        model="unpriced",
    ),
    Case("status-usage-db-down", "/status", STATUS_USAGE_UNAVAILABLE, conversation="11111111-aaaa", db_down=True),
    Case("command-name-is-case-insensitive", "/SESSIONS 2", SESSIONS_PAGE_2),
]

CONSOLE_NEW = "New session started. Send a message to begin."

BOT_NEW = """New session started.

Available commands:
  /new - Start fresh conversation
  /resume <id> - Resume a conversation
  /sessions - List recent conversations
  /model [name] - Show or switch model
  /provider [name] - Show or switch provider
  /status - Current configuration
  /revoke - Revoke all tool approvals
  /help - Show this message"""

BOT_HELP = """Available commands:

  /new - Start a fresh conversation
  /resume [id|#number] - Resume a previous conversation
  /sessions - List recent conversations
  /model [name] - Show current or switch AI model
  /provider [name] - Show current or switch AI provider
  /status - Show current configuration
  /revoke - Revoke all tool approvals
  /help - Show this message
"""

BOT_REVOKE = "All tool approvals revoked. Each tool will ask for permission again."

CONSOLE_HELP = """Shared commands:

  /new - Start a fresh conversation
  /resume [id|#number] - Resume a previous conversation
  /sessions [page] - List recent conversations
  /model [name] - Show current or switch AI model
  /provider [name] - Show current or switch AI provider
  /status - Show current configuration
  /help - Show this message

Console commands:

  /exit, /quit - Exit the application
  /clear - Clear conversation history
  /history - Show conversation history
  /voice <name> - Change voice
  /toggle-voice - Enable/disable voice output
  /tools - Show available MCP tools
  /agent <query> - Execute query using agent
  /debug [on|off] - Toggle debug mode
  /workflow list|run <id> - Manage workflows
"""

STATUS_FULL_DATA = {
    "provider": "mock",
    "model": "gemini-2.5-flash",
    "conversation_id": "11111111-aaaa",
    "total_tokens": 12345,
    "input_tokens": 10000,
    "output_tokens": 2345,
    "has_estimates": True,
    "has_partial_data": False,
    "had_summarization": True,
    "estimated_cost_usd": 0.01469,
    "context_tokens": 4321,
    "last_input_tokens": 85000,
    "context_window_size": 100000,
}
