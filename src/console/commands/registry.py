"""The console's command dispatcher: runs the async shared commands from the console's blocking input loop."""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING

from imports import CommandDispatcher


if TYPE_CHECKING:
    from imports import CommandResult


CONSOLE_USER_ID = "console_user"


class ConsoleCommandDispatcher(CommandDispatcher):
    def try_dispatch(self, text: str) -> CommandResult | None:
        """None when the text is not a shared command, so a console-only command can take it."""
        if not self.handles(text):
            return None
        return asyncio.run(self.dispatch(text, CONSOLE_USER_ID))
