"""Tests for WorkflowTool: workflow creation, listing, removal, and templates."""

import importlib
import importlib.util
import os
import sys
from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest


# ---------------------------------------------------------------------------
# Direct module loading — bypass __init__.py chains to avoid circular imports.
# ---------------------------------------------------------------------------

_SRC = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "src")
_SRC = os.path.abspath(_SRC)

if _SRC not in sys.path:
    sys.path.insert(0, _SRC)


def _load_module(name: str, filepath: str):
    if name in sys.modules:
        return sys.modules[name]
    spec = importlib.util.spec_from_file_location(name, filepath)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


# Load BaseTool first
_base_tool_mod = _load_module(
    "lib.services.ai_client.base_tool",
    os.path.join(_SRC, "lib", "services", "ai_client", "base_tool.py"),
)
BaseTool = _base_tool_mod.BaseTool

# Stub printer
if "lib.utils.printer" not in sys.modules:
    _printer_stub = type(sys)("lib.utils.printer")
    _printer_stub.printer = MagicMock()
    sys.modules["lib.utils.printer"] = _printer_stub

# Stub Config
if "lib.core.config" not in sys.modules:
    _config_stub_mod = type(sys)("lib.core.config")

    class _StubConfig:
        browser_headless = True
        browser_profile_dir = "/tmp/test-browser-profile"

    _config_stub_mod.Config = _StubConfig
    sys.modules["lib.core.config"] = _config_stub_mod

# Package chain stubs
for pkg in ("lib", "lib.mcp", "lib.mcp.tools", "lib.core", "lib.services", "lib.services.ai_client", "lib.utils"):
    if pkg not in sys.modules:
        sys.modules[pkg] = type(sys)(pkg)

# Wire BaseTool
sys.modules["lib.services.ai_client"].base_tool = sys.modules["lib.services.ai_client.base_tool"]
sys.modules["lib.services.ai_client.base_tool"] = _base_tool_mod

# Stub lib.cron and lib.cron.workflow_service
_cron_stub = type(sys)("lib.cron")
_workflow_service_stub = type(sys)("lib.cron.workflow_service")
_workflow_service_stub.create_workflow = MagicMock()
_workflow_service_stub.list_workflows = MagicMock()
_workflow_service_stub.delete_workflow = MagicMock()
_cron_stub.workflow_service = _workflow_service_stub
sys.modules["lib.cron"] = _cron_stub
sys.modules["lib.cron.workflow_service"] = _workflow_service_stub

# Stub lib.utils.async_utils
_async_utils_stub = type(sys)("lib.utils.async_utils")
_async_utils_stub.run_async = MagicMock()
sys.modules["lib.utils.async_utils"] = _async_utils_stub

# Now load workflow_tool
_workflow_tool_mod = _load_module(
    "lib.mcp.tools.workflow_tool",
    os.path.join(_SRC, "lib", "mcp", "tools", "workflow_tool.py"),
)
WorkflowTool = _workflow_tool_mod.WorkflowTool
WORKFLOW_DEFINITIONS = _workflow_tool_mod.WORKFLOW_DEFINITIONS


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_workflow(id="wf-1", name="Test Workflow", description="desc", created_at=None):
    """Create a mock workflow object with the given attributes."""
    w = MagicMock()
    w.id = id
    w.name = name
    w.description = description
    w.created_at = created_at
    return w


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _clear_base_tool_instances():
    """Reset BaseTool._instances before each test so tests don't leak."""
    saved = BaseTool._instances[:]
    yield
    BaseTool._instances = saved


@pytest.fixture(autouse=True)
def _mock_workflow_service(monkeypatch):
    """Replace workflow_service on the loaded workflow_tool module with a fresh MagicMock.

    This ensures each test gets a clean MagicMock regardless of what the module
    captured at import time (which may be the real service or another test's stub).
    """
    mock_svc = MagicMock()
    monkeypatch.setattr(_workflow_tool_mod, "workflow_service", mock_svc)


@pytest.fixture
def workflow_tool():
    """Fresh WorkflowTool instance."""
    return WorkflowTool()


# ===========================================================================
# A. TestCreateWorkflow
# ===========================================================================


class TestCreateWorkflow:
    """Tests for the static _create_workflow method."""

    @patch("lib.mcp.tools.workflow_tool.run_async")
    def test_successful_creation_returns_result(self, mock_run_async, workflow_tool):
        """Successful creation returns the result dict from run_async."""
        mock_run_async.return_value = {"success": True, "id": "wf-123"}
        definition = {"nodes": {}, "connections": []}

        result = workflow_tool._create_workflow("Test", definition, "A test workflow")

        assert result == {"success": True, "id": "wf-123"}

    @patch("lib.mcp.tools.workflow_tool.run_async")
    def test_passes_name_definition_description_to_service(self, mock_run_async, workflow_tool):
        """Arguments are forwarded to workflow_service.create_workflow via run_async."""
        mock_run_async.return_value = {"success": True}
        definition = {"nodes": {"n1": {"type": "AIExecutionNode"}}, "connections": []}

        workflow_tool._create_workflow("My Flow", definition, "Flow description")

        # run_async is called with the coroutine from workflow_service.create_workflow
        mock_run_async.assert_called_once()
        _workflow_tool_mod.workflow_service.create_workflow.assert_called_once_with(
            "My Flow", definition, "Flow description"
        )

    @patch("lib.mcp.tools.workflow_tool.run_async")
    def test_description_defaults_to_none(self, mock_run_async, workflow_tool):
        """When description is omitted, it defaults to None."""
        mock_run_async.return_value = {"success": True}
        definition = {"nodes": {}, "connections": []}

        workflow_tool._create_workflow("No Desc", definition)

        _workflow_tool_mod.workflow_service.create_workflow.assert_called_once_with("No Desc", definition, None)

    @patch("lib.mcp.tools.workflow_tool.run_async")
    def test_exception_returns_error_dict(self, mock_run_async, workflow_tool):
        """When run_async raises, returns an error dict with a descriptive message."""
        mock_run_async.side_effect = RuntimeError("DB connection lost")
        definition = {"nodes": {}, "connections": []}

        result = workflow_tool._create_workflow("Broken", definition)

        assert "error" in result
        assert "Failed to create workflow" in result["error"]
        assert "DB connection lost" in result["error"]

    @patch("lib.mcp.tools.workflow_tool.run_async")
    def test_complex_definition_passed_through(self, mock_run_async, workflow_tool):
        """A complex definition dict with multiple nodes and connections is passed through unchanged."""
        mock_run_async.return_value = {"success": True, "id": "wf-456"}
        definition = {
            "nodes": {
                "fetch": {
                    "type": "FunctionExecutionNode",
                    "function": "http_get",
                    "params": {"url": "https://api.example.com"},
                },
                "process": {
                    "type": "AIExecutionNode",
                    "prompt": "Analyze: {fetch.data}",
                    "model": "gemini-1.5-flash",
                },
            },
            "connections": [{"from_id": "fetch", "to_id": "process"}],
        }

        result = workflow_tool._create_workflow("Complex", definition, "Multi-node flow")

        assert result["success"] is True
        call_args = _workflow_tool_mod.workflow_service.create_workflow.call_args
        assert call_args[0][1] == definition


# ===========================================================================
# B. TestListWorkflows
# ===========================================================================


class TestListWorkflows:
    """Tests for the static _list_workflows method."""

    @patch("lib.mcp.tools.workflow_tool.run_async")
    def test_empty_list_when_no_workflows(self, mock_run_async, workflow_tool):
        """Returns empty list and total=0 when there are no workflows."""
        mock_run_async.return_value = []

        result = workflow_tool._list_workflows()

        assert result["success"] is True
        assert result["workflows"] == []
        assert result["total"] == 0

    @patch("lib.mcp.tools.workflow_tool.run_async")
    def test_returns_serialized_workflows_with_all_fields(self, mock_run_async, workflow_tool):
        """Each workflow is serialized with id, name, description, and created_at."""
        dt = datetime(2025, 6, 15, 10, 30, 0)
        mock_run_async.return_value = [
            _make_workflow(id="wf-1", name="Flow A", description="First", created_at=dt),
            _make_workflow(id="wf-2", name="Flow B", description="Second", created_at=dt),
        ]

        result = workflow_tool._list_workflows()

        assert result["success"] is True
        assert result["total"] == 2
        assert result["workflows"][0]["id"] == "wf-1"
        assert result["workflows"][0]["name"] == "Flow A"
        assert result["workflows"][0]["description"] == "First"
        assert result["workflows"][1]["id"] == "wf-2"
        assert result["workflows"][1]["name"] == "Flow B"

    @patch("lib.mcp.tools.workflow_tool.run_async")
    def test_created_at_none_serializes_as_none(self, mock_run_async, workflow_tool):
        """Workflow with created_at=None serializes the field as None."""
        mock_run_async.return_value = [
            _make_workflow(id="wf-no-date", name="No Date", created_at=None),
        ]

        result = workflow_tool._list_workflows()

        assert result["workflows"][0]["created_at"] is None

    @patch("lib.mcp.tools.workflow_tool.run_async")
    def test_created_at_datetime_serializes_to_isoformat(self, mock_run_async, workflow_tool):
        """Workflow with a datetime created_at serializes to ISO 8601 string."""
        dt = datetime(2025, 1, 20, 14, 0, 0)
        mock_run_async.return_value = [
            _make_workflow(id="wf-dated", name="Dated", created_at=dt),
        ]

        result = workflow_tool._list_workflows()

        assert result["workflows"][0]["created_at"] == "2025-01-20T14:00:00"

    @patch("lib.mcp.tools.workflow_tool.run_async")
    def test_exception_returns_error_dict(self, mock_run_async, workflow_tool):
        """When run_async raises, returns an error dict."""
        mock_run_async.side_effect = ConnectionError("Service unavailable")

        result = workflow_tool._list_workflows()

        assert "error" in result
        assert "Failed to list workflows" in result["error"]
        assert "Service unavailable" in result["error"]


# ===========================================================================
# C. TestRemoveWorkflow
# ===========================================================================


class TestRemoveWorkflow:
    """Tests for the static _remove_workflow method."""

    @patch("lib.mcp.tools.workflow_tool.run_async")
    def test_successful_removal_returns_result(self, mock_run_async, workflow_tool):
        """Successful removal returns the result dict from run_async."""
        mock_run_async.return_value = {"success": True, "deleted": True}

        result = workflow_tool._remove_workflow("wf-abc123")

        assert result == {"success": True, "deleted": True}

    @patch("lib.mcp.tools.workflow_tool.run_async")
    def test_always_passes_cascade_true(self, mock_run_async, workflow_tool):
        """delete_workflow is always called with cascade=True."""
        mock_run_async.return_value = {"success": True}

        workflow_tool._remove_workflow("wf-xyz")

        _workflow_tool_mod.workflow_service.delete_workflow.assert_called_once_with("wf-xyz", cascade=True)

    @patch("lib.mcp.tools.workflow_tool.run_async")
    def test_exception_returns_error_dict_with_workflow_id(self, mock_run_async, workflow_tool):
        """When run_async raises, error dict includes both 'error' and 'workflow_id' keys."""
        mock_run_async.side_effect = ValueError("Workflow not found")

        result = workflow_tool._remove_workflow("wf-missing")

        assert "error" in result
        assert "Failed to remove workflow" in result["error"]
        assert "Workflow not found" in result["error"]
        assert result["workflow_id"] == "wf-missing"

    @patch("lib.mcp.tools.workflow_tool.run_async")
    def test_workflow_id_string_passed_through(self, mock_run_async, workflow_tool):
        """The workflow_id string is forwarded to delete_workflow exactly as provided."""
        mock_run_async.return_value = {"success": True}

        workflow_tool._remove_workflow("workflow_abc123def456")

        _workflow_tool_mod.workflow_service.delete_workflow.assert_called_once_with(
            "workflow_abc123def456", cascade=True
        )


# ===========================================================================
# D. TestGetWorkflowTemplates
# ===========================================================================


class TestGetWorkflowTemplates:
    """Tests for the static _get_workflow_templates method."""

    def test_returns_success_true(self, workflow_tool):
        """Result contains success=True."""
        result = workflow_tool._get_workflow_templates()

        assert result["success"] is True

    def test_returns_exactly_ten_templates(self, workflow_tool):
        """Templates dict contains exactly 10 entries."""
        result = workflow_tool._get_workflow_templates()

        assert result["total"] == 10
        assert len(result["templates"]) == 10

    def test_contains_expected_template_keys(self, workflow_tool):
        """All 10 expected template keys are present."""
        expected_keys = {
            "http_fetch",
            "ai_processing",
            "simple_http",
            "json_processing",
            "utility",
            "sequential_pipeline",
            "conditional_branching",
            "parallel_processing",
            "scheduled_task",
            "weather_fetch",
        }

        result = workflow_tool._get_workflow_templates()

        assert set(result["templates"].keys()) == expected_keys

    def test_usage_guide_has_recommended_approach_and_tips(self, workflow_tool):
        """usage_guide contains recommended_approach and template_selection_tips."""
        result = workflow_tool._get_workflow_templates()

        guide = result["usage_guide"]
        assert "recommended_approach" in guide
        assert isinstance(guide["recommended_approach"], str)
        assert len(guide["recommended_approach"]) > 0
        assert "template_selection_tips" in guide
        assert isinstance(guide["template_selection_tips"], list)
        assert len(guide["template_selection_tips"]) > 0

    def test_each_non_scheduled_template_has_required_fields(self, workflow_tool):
        """Each template (except scheduled_task) has name, description, use_cases, and difficulty."""
        result = workflow_tool._get_workflow_templates()

        for key, template in result["templates"].items():
            assert "name" in template, f"Template '{key}' missing 'name'"
            assert "description" in template, f"Template '{key}' missing 'description'"
            assert "use_cases" in template, f"Template '{key}' missing 'use_cases'"
            assert "difficulty" in template, f"Template '{key}' missing 'difficulty'"


# ===========================================================================
# E. TestDefinitionsAndImplementations
# ===========================================================================


class TestDefinitionsAndImplementations:
    """Verify tool registration metadata."""

    def test_get_definitions_returns_four_definitions(self, workflow_tool):
        """get_definitions returns exactly 4 tool definitions."""
        defs = workflow_tool.get_definitions()

        assert len(defs) == 4
        names = {d["name"] for d in defs}
        assert names == {"create_workflow", "remove_workflow", "list_workflows", "get_workflow_templates"}

    def test_get_implementations_returns_four_entries(self, workflow_tool):
        """get_implementations returns a dict with 4 callable entries."""
        impls = workflow_tool.get_implementations()

        assert len(impls) == 4
        assert set(impls.keys()) == {"create_workflow", "remove_workflow", "list_workflows", "get_workflow_templates"}
        for key, func in impls.items():
            assert callable(func), f"Implementation '{key}' is not callable"

    def test_name_property_returns_workflow(self, workflow_tool):
        """The name property returns 'workflow'."""
        assert workflow_tool.name == "workflow"
