"""Tests for UtilsTool: calculate, time, date, and string reverse operations."""

import datetime
from unittest.mock import MagicMock, patch

import pytest

from lib.tools import utils_tool as _utils_tool_mod
from lib.tools.utils_tool import UtilsTool


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def async_helpers(monkeypatch):
    """Replace the async helpers so a patched run_async never leaves an unawaited coroutine behind."""
    helpers = {}
    for name in ("_async_get_current_time", "_async_get_current_date", "_async_string_reverse"):
        helpers[name] = MagicMock(name=name)
        monkeypatch.setattr(_utils_tool_mod, name, helpers[name])
    return helpers


@pytest.fixture
def utils_tool():
    """Fresh UtilsTool instance."""
    return UtilsTool()


# ===========================================================================
# A. Calculate tests
# ===========================================================================


class TestCalculate:
    """Tests for the _calculate static method — pure eval with safe_dict."""

    def test_basic_addition(self, utils_tool):
        """Simple addition: 2 + 2 → '4'."""
        result = utils_tool._calculate("2 + 2")
        assert result == "4"

    def test_multiplication(self, utils_tool):
        """Multiplication: 3 * 7 → '21'."""
        result = utils_tool._calculate("3 * 7")
        assert result == "21"

    def test_division_float_result(self, utils_tool):
        """Division produces a float: 10 / 3."""
        result = utils_tool._calculate("10 / 3")
        assert result.startswith("3.333")

    def test_power(self, utils_tool):
        """Exponentiation: 2 ** 10 → '1024'."""
        result = utils_tool._calculate("2 ** 10")
        assert result == "1024"

    def test_modulo(self, utils_tool):
        """Modulo: 10 % 3 → '1'."""
        result = utils_tool._calculate("10 % 3")
        assert result == "1"

    def test_sqrt_function(self, utils_tool):
        """sqrt(16) → '4.0'."""
        result = utils_tool._calculate("sqrt(16)")
        assert result == "4.0"

    def test_sin_pi_over_two(self, utils_tool):
        """sin(pi/2) → '1.0'."""
        result = utils_tool._calculate("sin(pi/2)")
        assert result == "1.0"

    def test_log_e(self, utils_tool):
        """log(e) → '1.0'."""
        result = utils_tool._calculate("log(e)")
        assert result == "1.0"

    def test_ceil(self, utils_tool):
        """ceil(3.2) → '4'."""
        result = utils_tool._calculate("ceil(3.2)")
        assert result == "4"

    def test_floor(self, utils_tool):
        """floor(3.8) → '3'."""
        result = utils_tool._calculate("floor(3.8)")
        assert result == "3"

    def test_factorial(self, utils_tool):
        """factorial(5) → '120'."""
        result = utils_tool._calculate("factorial(5)")
        assert result == "120"

    def test_precision_rounding(self, utils_tool):
        """10 / 3 with precision=2 → '3.33'."""
        result = utils_tool._calculate("10 / 3", precision=2)
        assert result == "3.33"

    def test_precision_negative_one_no_rounding(self, utils_tool):
        """Default precision=-1 means no rounding is applied."""
        result = utils_tool._calculate("10 / 3", precision=-1)
        # Full float representation, no rounding
        assert result.startswith("3.333333333333")

    def test_precision_zero_rounds_to_integer(self, utils_tool):
        """precision=0 rounds to zero decimal places (Python round returns float)."""
        result = utils_tool._calculate("10 / 3", precision=0)
        # Python's round(3.333..., 0) returns 3.0 (float), not 3 (int)
        assert result == "3.0"

    def test_invalid_expression_returns_error(self, utils_tool):
        """A syntax error returns an 'Error: ...' string."""
        result = utils_tool._calculate("2 +* 3")
        assert result.startswith("Error:")

    def test_dangerous_import_blocked(self, utils_tool):
        """Attempting __import__('os') is blocked because builtins={}."""
        result = utils_tool._calculate("__import__('os')")
        assert result.startswith("Error:")

    def test_max_function(self, utils_tool):
        """max(1, 2, 3) → '3'."""
        result = utils_tool._calculate("max(1, 2, 3)")
        assert result == "3"

    def test_combined_expression(self, utils_tool):
        """Complex expression: pow(2, 3) + abs(-5) → '13'."""
        result = utils_tool._calculate("pow(2, 3) + abs(-5)")
        assert result == "13"

    def test_precision_with_integer_result(self, utils_tool):
        """precision on an integer result still rounds (no-op for ints)."""
        result = utils_tool._calculate("2 + 2", precision=2)
        assert result == "4"


# ===========================================================================
# B. Get current time tests
# ===========================================================================


@pytest.mark.usefixtures("async_helpers")
class TestGetCurrentTime:
    """Tests for the _get_current_time static method."""

    @patch("lib.tools.utils_tool.run_async")
    def test_returns_run_async_result(self, mock_run_async, utils_tool):
        """_get_current_time delegates to run_async and returns its result."""
        mock_run_async.return_value = "2024-01-01 12:00:00 UTC"
        result = utils_tool._get_current_time("UTC")
        assert result == "2024-01-01 12:00:00 UTC"
        mock_run_async.assert_called_once()

    @patch("lib.tools.utils_tool.run_async")
    def test_passes_timezone_parameter(self, mock_run_async, utils_tool, async_helpers):
        """The timezone argument is forwarded to the async function."""
        mock_run_async.return_value = "2024-01-01 20:00:00 EST"
        result = utils_tool._get_current_time("US/Eastern")
        assert result == "2024-01-01 20:00:00 EST"
        async_helpers["_async_get_current_time"].assert_called_once_with("US/Eastern")
        mock_run_async.assert_called_once_with(async_helpers["_async_get_current_time"].return_value)


# ===========================================================================
# C. Get current date tests
# ===========================================================================


@pytest.mark.usefixtures("async_helpers")
class TestGetCurrentDate:
    """Tests for the _get_current_date static method."""

    @patch("lib.tools.utils_tool.run_async")
    def test_returns_run_async_result(self, mock_run_async, utils_tool):
        """_get_current_date delegates to run_async and returns its result."""
        mock_run_async.return_value = "2024-01-01"
        result = utils_tool._get_current_date()
        assert result == "2024-01-01"
        mock_run_async.assert_called_once()

    @patch("lib.tools.utils_tool.run_async")
    def test_no_arguments_required(self, mock_run_async, utils_tool):
        """_get_current_date takes no arguments and still returns correctly."""
        mock_run_async.return_value = "2026-04-10"
        result = utils_tool._get_current_date()
        assert result == "2026-04-10"


# ===========================================================================
# D. Reverse string tests
# ===========================================================================


@pytest.mark.usefixtures("async_helpers")
class TestReverseString:
    """Tests for the _reverse_string static method."""

    @patch("lib.tools.utils_tool.run_async")
    def test_returns_run_async_result(self, mock_run_async, utils_tool):
        """_reverse_string delegates to run_async and returns its result."""
        mock_run_async.return_value = "olleh"
        result = utils_tool._reverse_string("hello")
        assert result == "olleh"
        mock_run_async.assert_called_once()

    @patch("lib.tools.utils_tool.run_async")
    def test_passes_text_parameter(self, mock_run_async, utils_tool, async_helpers):
        """The text argument is forwarded to the async string_reverse function."""
        mock_run_async.return_value = "dcba"
        result = utils_tool._reverse_string("abcd")
        assert result == "dcba"
        async_helpers["_async_string_reverse"].assert_called_once_with("abcd")
        mock_run_async.assert_called_once_with(async_helpers["_async_string_reverse"].return_value)


class TestRealHelpers:
    """End to end through run_async and the lib.utils *_ops helpers, nothing stubbed."""

    def test_reverse_string(self, utils_tool):
        assert utils_tool._reverse_string("hello") == "olleh"

    def test_current_date_is_today(self, utils_tool):
        assert utils_tool._get_current_date() == datetime.date.today().strftime("%Y-%m-%d")

    def test_current_time_format(self, utils_tool):
        result = utils_tool._get_current_time("UTC")
        assert datetime.datetime.strptime(result, "%Y-%m-%d %H:%M:%S")

    def test_current_time_invalid_timezone(self, utils_tool):
        assert utils_tool._get_current_time("Not/AZone").startswith("Error: ")


# ===========================================================================
# E. Definitions and implementations tests
# ===========================================================================


class TestDefinitionsAndImplementations:
    """Verify tool registration metadata."""

    def test_name_property(self, utils_tool):
        """name property returns 'utils'."""
        assert utils_tool.name == "utils"

    def test_definitions_count(self, utils_tool):
        """get_definitions returns exactly 4 tool schemas."""
        defs = utils_tool.get_definitions()
        assert len(defs) == 4

    def test_definitions_names(self, utils_tool):
        """All expected tool names are present in definitions."""
        names = {d["name"] for d in utils_tool.get_definitions()}
        assert names == {"calculate", "get_current_time", "get_current_date", "reverse_string"}

    def test_implementations_count(self, utils_tool):
        """get_implementations returns exactly 4 entries."""
        impls = utils_tool.get_implementations()
        assert len(impls) == 4

    def test_implementations_keys(self, utils_tool):
        """get_implementations keys match the expected tool names."""
        impls = utils_tool.get_implementations()
        assert set(impls.keys()) == {"calculate", "get_current_time", "get_current_date", "reverse_string"}

    def test_implementations_are_callable(self, utils_tool):
        """Every value in get_implementations is callable."""
        impls = utils_tool.get_implementations()
        for name, func in impls.items():
            assert callable(func), f"Implementation '{name}' is not callable"
