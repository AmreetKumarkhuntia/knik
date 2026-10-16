"""ConversationHistory: how many earlier turns reach the model."""

from console.history import ConversationHistory


def test_the_last_n_turns_become_messages_and_zero_means_none():
    history = ConversationHistory(max_size=10)
    history.add_entry("one", "1")
    history.add_entry("two", "2")

    assert [m.content for m in history.get_messages(last_n=1)] == ["two", "2"]
    assert history.get_messages(last_n=0) == []
