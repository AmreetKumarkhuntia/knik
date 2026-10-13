"""What a streamed chat yields: one small dataclass per kind of event, so consumers match on the type.

A provider's ``chat_stream`` yields ``ProviderEvent``s. ``AIClient.stream_events`` passes them on and turns a
provider failure into a ``StreamError``. ``AIClient.achat_stream`` adds the conversation around them:
``ConversationReady`` first and ``StreamDone`` last.

    async for event in client.achat_stream(prompt, conversation_id=conversation_id):
        match event:
            case TextDelta(text=text) | StreamError(message=text):
                show(text)
            case StreamDone(usage=usage):
                record(usage)
"""

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class TextDelta:
    """The next piece of the reply."""

    text: str


@dataclass(frozen=True)
class ToolCallStarted:
    """The model called a tool; ``ToolCallFinished`` with the same ``tool_call_id`` follows once it returns."""

    tool_name: str
    tool_call_id: str
    tool_args: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ToolCallFinished:
    """A tool returned. ``tool_call_id`` is None when the provider did not report one."""

    tool_name: str
    tool_call_id: str | None
    result_preview: str  # the first 200 characters of the result


@dataclass(frozen=True)
class StreamError:
    """The provider failed mid-stream. It is the provider's last event; ``achat_stream`` still ends with ``StreamDone``.

    ``message`` reads "Chat streaming error: ...". It is part of the reply text, so the apps show it like a
    ``TextDelta`` and ``achat_stream`` saves it with the reply.
    """

    message: str


@dataclass(frozen=True)
class ConversationReady:
    """The conversation the reply belongs to, created if needed. Sent before any text; never sent without a database."""

    conversation_id: str


@dataclass(frozen=True)
class StreamDone:
    """The last event of ``achat_stream``, after the reply is saved. ``usage`` is None if the provider had none."""

    conversation_id: str | None
    usage: dict[str, int] | None
    full_response: str


ProviderEvent = TextDelta | ToolCallStarted | ToolCallFinished
StreamEvent = ConversationReady | TextDelta | ToolCallStarted | ToolCallFinished | StreamError | StreamDone
