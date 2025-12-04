# Linting & Code Quality

Knik uses **Ruff** for fast Python linting and code formatting.

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
```

## Configuration

Linter settings are in `.ruff.toml`:

- **Line length**: 120 characters
- **Target Python**: 3.12+
- **Enabled rules**: pycodestyle, Pyflakes, isort, pep8-naming, pyupgrade, bugbear, comprehensions, simplify

## VS Code Integration

The `.vscode/settings.json` is configured to:
- Format Python files on save
- Auto-organize imports
- Hide Python cache files

**Recommended Extension**: Install the Ruff VS Code extension for real-time linting:
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

- `E501` - Line too long (handled by formatter)
- `B008` - Function calls in defaults
- `C901` - Function complexity
- `N802/N803/N806` - Naming conventions (conflicts with project style)

## Per-File Ignores

- `__init__.py` - Unused imports allowed (F401, F403)
- `demo/**/*.py` - More relaxed rules for demo scripts

## CI Integration (Future)

Add to GitHub Actions workflow:

```yaml
- name: Lint with Ruff
  run: |
    pip install ruff
    ruff check .
    ruff format --check .
```
