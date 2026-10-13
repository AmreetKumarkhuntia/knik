"""The app import hub must resolve every name it advertises and stay in sync with its type stubs."""

import ast
import subprocess
import sys
from pathlib import Path

import pytest

import imports


HUB_PATH = Path(imports.__file__)
APP_DIRS = ("backend", "bot", "console", "worker")

# Runs in a fresh interpreter so the check sees the real modules, whatever earlier tests imported or patched.
_RESOLVE_ALL = """
import importlib
import imports

bad = []
for name, (module_name, attribute) in imports._EXPORTS.items():
    module = importlib.import_module(module_name)
    expected = module if attribute is None else getattr(module, attribute)
    if getattr(imports, name) is not expected:
        bad.append(name)
assert not bad, bad
"""


def _type_checking_names() -> set[str]:
    for node in ast.parse(HUB_PATH.read_text()).body:
        if isinstance(node, ast.If) and getattr(node.test, "id", "") == "TYPE_CHECKING":
            return {alias.asname or alias.name for stmt in node.body for alias in stmt.names}
    raise AssertionError("imports.py has no TYPE_CHECKING block")


def test_type_checking_block_matches_exports():
    assert _type_checking_names() == set(imports._EXPORTS)


def test_every_export_resolves_to_its_source():
    result = subprocess.run(
        [sys.executable, "-c", _RESOLVE_ALL], cwd=HUB_PATH.parent, capture_output=True, text=True, timeout=300
    )
    assert result.returncode == 0, result.stderr


def _names_apps_import_from_the_hub() -> dict[str, list[str]]:
    used: dict[str, list[str]] = {}
    for app in APP_DIRS:
        for path in sorted((HUB_PATH.parent / app).rglob("*.py")):
            for node in ast.walk(ast.parse(path.read_text())):
                if isinstance(node, ast.ImportFrom) and node.module == "imports" and node.level == 0:
                    for alias in node.names:
                        used.setdefault(alias.name, []).append(str(path.relative_to(HUB_PATH.parent)))
    return used


def test_every_name_the_apps_import_is_exported():
    # Pyright cannot catch a missing name: the hub's module __getattr__ types any unknown name as Any.
    missing = {name: files for name, files in _names_apps_import_from_the_hub().items() if name not in imports._EXPORTS}
    assert not missing, missing


def test_unknown_name_raises_attribute_error():
    with pytest.raises(AttributeError):
        _ = imports.DoesNotExist
