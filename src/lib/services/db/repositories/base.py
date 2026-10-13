"""Helpers shared by the repositories: row-to-model mapping and JSONB parameters."""

import json
from collections.abc import Callable, Iterable
from typing import Any


Row = dict[str, Any]


def to_model[T](from_row: Callable[[Row], T], row: Row | None) -> T | None:
    return from_row(row) if row else None


def to_models[T](from_row: Callable[[Row], T], rows: Iterable[Row]) -> list[T]:
    return [from_row(row) for row in rows]


def json_param(value: Any, default: Callable[[Any], Any] | None = None) -> str:
    """Encode a value for a JSONB column; `default` is passed to json.dumps for values it cannot encode."""
    return json.dumps(value, default=default)
