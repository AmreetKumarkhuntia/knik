# Linting & Code Quality

Knik uses **Ruff** for Python linting and formatting, **Pyright** for type checking and **import-linter** for the
import rules in `pyproject.toml`.

## Quick Start

```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Check if code is formatted correctly (without modifying)
npm run format:check

# Type check and import rules
npm run typecheck
npm run lint:imports
```

## Configuration

Linter settings are in `.ruff.toml`:

- **Line length**: 120 characters
- **Target Python**: 3.12+
- **Enabled rules**: pycodestyle, Pyflakes, isort, pep8-naming, pyupgrade, bugbear, comprehensions, simplify

## VS Code Integration

The repository has no `.vscode/` settings. Install the Ruff VS Code extension for real-time linting:

```
code --install-extension charliermarsh.ruff
```

## Manual Commands

```bash
# Activate virtual environment first
source .venv/bin/activate

# Check all files
ruff check .

# Check specific file
ruff check src/main.py

# Auto-fix issues
ruff check --fix .

# Format code
ruff format .

# Check formatting without modifying
ruff format --check .
```

## Ignored Rules

Some rules are relaxed for this project:

- `E402` - Module-level import not at top (tool tests stub `sys.modules` before importing)
- `E501` - Line too long (handled by formatter)
- `B008` - Function calls in defaults
- `C901` - Function complexity
- `N802/N803/N806` - Naming conventions (conflicts with project style)

## Per-File Ignores

- `__init__.py` - Unused imports allowed (F401, F403)

## CI and pre-commit

`.github/workflows/ci.yml` runs `ruff check .`, `ruff format --check .`, `pyright`, the import contracts, a check
that no `sys.path.insert` is left under `src/`, the migrations (applied twice) and `pytest`, plus the frontend's
ESLint, Prettier, type check and build. The Husky pre-commit hook runs the `pre-commit` hooks
(`.pre-commit-config.yaml`) and the frontend's `lint-staged`.
