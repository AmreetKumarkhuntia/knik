"""Users of the apps that tell their users apart, one row per (source, external id)."""

import uuid

from ..connection import PostgresDB
from ..models import User
from .base import to_model


class UserDB:
    @staticmethod
    async def get_or_create(source: str, external_id: str, display_name: str | None = None) -> User:
        """The user with this id in `source`, created the first time it is seen; either way last seen now.

        A display name replaces the stored one, since people rename themselves; None keeps it.
        """
        row = await PostgresDB.fetch_one(
            """
            INSERT INTO users (id, source, external_id, display_name)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (source, external_id) DO UPDATE
            SET last_seen_at = CURRENT_TIMESTAMP,
                display_name = COALESCE(EXCLUDED.display_name, users.display_name)
            RETURNING *
            """,
            (f"usr_{uuid.uuid4().hex[:12]}", source, external_id, display_name),
        )
        return User.from_row(row)

    @staticmethod
    async def get(user_id: str) -> User | None:
        row = await PostgresDB.fetch_one("SELECT * FROM users WHERE id = %s", (user_id,))
        return to_model(User.from_row, row)
