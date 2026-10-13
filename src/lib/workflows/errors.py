"""Errors the workflow and schedule services raise when a request cannot be carried out.

Callers branch on the type, never on the message: ``NotFoundError`` for an id that names nothing,
``ValidationError`` for input the services reject. Both are also ``ValueError``s, the type manual
execution raised for a missing workflow before these existed, so ``except ValueError`` keeps catching them.
"""

from typing import Any


class WorkflowError(Exception):
    """Base class. ``str(error)`` is the message; ``extra`` holds the context the AI tools report with it."""

    def __init__(self, message: str, **extra: Any) -> None:
        super().__init__(message)
        self.message = message
        self.extra = extra

    def to_dict(self) -> dict[str, Any]:
        """The error as the ``{"error": message, **extra}`` dict the AI tools return to the model."""
        return {"error": self.message, **self.extra}


class NotFoundError(WorkflowError, ValueError):
    """No workflow or schedule has the given id."""


class ValidationError(WorkflowError, ValueError):
    """The input is missing or invalid (a workflow definition, schedule description or timezone)."""
