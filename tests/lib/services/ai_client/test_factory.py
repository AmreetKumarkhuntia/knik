"""Tests for build_client: the chosen model and settings reach every provider the same way.

The LangChain chat classes are replaced with a recorder and model discovery is stubbed, so nothing
touches the network; the provider classes themselves are the real ones.
"""

import pytest

from lib.services.ai_client.factory import ClientSettings, build_client, provider_kwargs
from lib.services.ai_client.providers import (
    custom_provider,
    gemini_provider,
    vertex_provider,
    zai_coding_provider,
    zai_provider,
    zhipuai_provider,
)


class RecordingLLM:
    created: list["RecordingLLM"] = []

    def __init__(self, **kwargs) -> None:
        self.kwargs = kwargs
        RecordingLLM.created.append(self)

    def bind_tools(self, tools):
        return self


# provider name -> (provider module, LangChain class attribute, keyword the LLM receives the model under)
LANGCHAIN_PROVIDERS = {
    "vertex": (vertex_provider, "ChatVertexAI", "model_name"),
    "gemini": (gemini_provider, "ChatGoogleGenerativeAI", "model"),
    "zhipuai": (zhipuai_provider, "ChatZhipuAI", "model"),
    "zai": (zai_provider, "ChatOpenAI", "model"),
    "zai_coding": (zai_coding_provider, "ChatOpenAI", "model"),
    "custom": (custom_provider, "ChatOpenAI", "model"),
}

FULL_SETTINGS = {
    "model": "chosen-model",
    "system_instruction": "Be brief.",
    "project_id": "proj",
    "location": "europe-west4",
    "api_base": "http://localhost:9/v1",
    "api_key": "settings-key",
}


@pytest.fixture(autouse=True)
def offline_providers(monkeypatch):
    RecordingLLM.created = []
    for module, llm_attr, _model_key in LANGCHAIN_PROVIDERS.values():
        monkeypatch.setattr(module, llm_attr, RecordingLLM)
    for cls in (
        vertex_provider.VertexAIProvider,
        gemini_provider.GeminiAIProvider,
        zhipuai_provider.ZhipuAIProvider,
        zai_provider.ZAIProvider,
        zai_coding_provider.ZAICodingProvider,
        custom_provider.CustomProvider,
    ):
        monkeypatch.setattr(cls, "get_models", lambda self: [])
    for key in ("GEMINI_API_KEY", "ZHIPUAI_API_KEY", "ZAI_API_KEY", "ZAI_CODING_API_KEY"):
        monkeypatch.setenv(key, "env-key")
    monkeypatch.delenv("KNIK_CUSTOM_API_BASE", raising=False)


@pytest.mark.parametrize("provider", sorted(LANGCHAIN_PROVIDERS))
def test_the_chosen_model_reaches_the_llm_and_is_reported(provider):
    _module, _llm_attr, model_key = LANGCHAIN_PROVIDERS[provider]

    client = build_client(ClientSettings(provider=provider, **FULL_SETTINGS))

    # No fallback to mock: the settings the provider does not declare never reach it.
    assert client.provider_name == provider
    assert client.get_model_name() == "chosen-model"
    [llm] = RecordingLLM.created
    assert llm.kwargs[model_key] == "chosen-model"
    if model_key == "model_name":
        assert "model" not in llm.kwargs


@pytest.mark.parametrize("provider", sorted(LANGCHAIN_PROVIDERS))
def test_set_model_after_build_takes_effect(provider):
    client = build_client(ClientSettings(provider=provider, **FULL_SETTINGS))

    client.set_model("other-model")

    assert client.get_model_name() == "other-model"


@pytest.mark.parametrize("start", ["gemini", "custom", "zai"])
def test_switching_provider_passes_the_new_one_its_own_settings(start):
    client = build_client(ClientSettings(provider=start, **FULL_SETTINGS))
    RecordingLLM.created = []

    client.set_provider("vertex", model_name="vertex-model")

    assert client.provider_name == "vertex"
    [llm] = RecordingLLM.created
    # The location and project the starting provider did not take still reach Vertex.
    assert (llm.kwargs["project"], llm.kwargs["location"]) == ("proj", "europe-west4")
    assert client.get_model_name() == "vertex-model"


def test_switching_away_from_custom_leaves_its_api_key_behind():
    client = build_client(ClientSettings(provider="custom", **FULL_SETTINGS))

    client.set_provider("zai")

    # zai reads its key from the environment; custom's key would collide with it.
    assert client.provider_name == "zai"
    assert RecordingLLM.created[-1].kwargs["api_key"] == "env-key"
    assert client.get_model_name() == "chosen-model"


def test_provider_specific_settings_go_only_to_providers_that_declare_them():
    build_client(ClientSettings(provider="vertex", **FULL_SETTINGS))
    build_client(ClientSettings(provider="custom", **FULL_SETTINGS))
    build_client(ClientSettings(provider="zai", **FULL_SETTINGS))
    vertex_llm, custom_llm, zai_llm = RecordingLLM.created

    assert (vertex_llm.kwargs["project"], vertex_llm.kwargs["location"]) == ("proj", "europe-west4")
    assert "api_key" not in vertex_llm.kwargs and "api_base" not in vertex_llm.kwargs
    assert (custom_llm.kwargs["base_url"], custom_llm.kwargs["api_key"]) == ("http://localhost:9/v1", "settings-key")
    assert zai_llm.kwargs["api_key"] == "env-key"


def test_temperature_and_max_tokens_are_passed_only_when_set():
    assert "temperature" not in provider_kwargs(ClientSettings(provider="gemini"))
    assert "max_tokens" not in provider_kwargs(ClientSettings(provider="gemini"))
    assert provider_kwargs(ClientSettings(provider="gemini", temperature=0.2, max_tokens=256)) == {
        "temperature": 0.2,
        "max_tokens": 256,
    }

    build_client(ClientSettings(provider="gemini", model="m"))
    build_client(ClientSettings(provider="gemini", model="m", temperature=0.2, max_tokens=256))
    default_llm, tuned_llm = RecordingLLM.created

    assert (default_llm.kwargs["temperature"], default_llm.kwargs["max_output_tokens"]) == (0.7, None)
    assert (tuned_llm.kwargs["temperature"], tuned_llm.kwargs["max_output_tokens"]) == (0.2, 256)


def test_unset_model_leaves_the_provider_default():
    client = build_client(ClientSettings(provider="zai"))

    assert client.get_model_name() == "glm-5"


def test_mock_gets_only_what_it_declares():
    assert provider_kwargs(ClientSettings(provider="mock", **FULL_SETTINGS, temperature=0.1, max_tokens=9)) == {}

    client = build_client(ClientSettings(provider="mock", **FULL_SETTINGS, temperature=0.1))

    assert client.provider_name == "mock"
    # Built directly rather than through the error fallback, which drops the system instruction.
    assert client._provider.system_instruction == "Be brief."


def test_tool_registry_is_handed_to_the_client_and_provider():
    class Registry:
        def create_langchain_tools(self):
            return []

        def register_tool(self, tool_dict, implementation=None):
            pass

        def get_tools(self):
            return []

        def execute_tool(self, tool_name, **kwargs):
            return None

        def cleanup_tools(self):
            pass

    registry = Registry()

    client = build_client(ClientSettings(provider="mock"), tool_registry=registry)

    assert client.tool_registry is registry
    assert client._provider.tool_registry is registry


def test_unknown_provider_falls_back_to_mock():
    client = build_client(ClientSettings(provider="nope", model="m"))

    assert client.provider_name == "mock"
