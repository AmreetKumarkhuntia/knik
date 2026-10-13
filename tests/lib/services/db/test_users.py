"""UserDB against a real database: one row per (source, external id), so a sender keeps their id."""

import pytest

from lib.services.db import PostgresDB, UserDB
from tests.db_support import requires_db


pytestmark = [requires_db, pytest.mark.asyncio]


async def test_get_or_create_makes_one_user_per_sender(db):
    first = await UserDB.get_or_create("telegram", "42", "Ada")
    again = await UserDB.get_or_create("telegram", "42", "Ada")
    other = await UserDB.get_or_create("telegram", "43")
    elsewhere = await UserDB.get_or_create("web", "42")

    assert again.id == first.id
    assert first.id.startswith("usr_") and len(first.id) == len("usr_") + 12
    assert len({first.id, other.id, elsewhere.id}) == 3
    assert (first.source, first.external_id, first.display_name) == ("telegram", "42", "Ada")
    assert await PostgresDB.fetch_val("SELECT count(*) FROM users") == 3


async def test_get_or_create_touches_last_seen_and_keeps_created(db):
    first = await UserDB.get_or_create("telegram", "42")
    await PostgresDB.execute("UPDATE users SET last_seen_at = last_seen_at - interval '1 day'")
    before = await UserDB.get(first.id)
    assert before is not None and before.last_seen_at is not None

    again = await UserDB.get_or_create("telegram", "42")

    assert again.created_at == first.created_at
    assert again.last_seen_at is not None and again.last_seen_at > before.last_seen_at


async def test_a_new_display_name_replaces_the_old_and_none_keeps_it(db):
    await UserDB.get_or_create("telegram", "42", "Ada")

    assert (await UserDB.get_or_create("telegram", "42")).display_name == "Ada"
    assert (await UserDB.get_or_create("telegram", "42", "Ada L.")).display_name == "Ada L."


async def test_get_by_id(db):
    user = await UserDB.get_or_create("telegram", "42", "Ada")

    assert await UserDB.get(user.id) == user
    assert await UserDB.get("usr_missing") is None
