# Commit Message Format

```
<type>(<scope>): <short description>

- <detail 1>
- <detail 2>
```

## Rules

- **type** (required): one of `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`, `perf`, `ci`, `build`, `revert`
- **scope** (recommended): kebab-case name of the feature/area, e.g. `ai-client`, `scheduler`, `web-frontend`
- **short description** (required): lowercase, imperative mood, max 100 chars, no period at end
- **body** (optional): pointwise with `-`, max 500 chars total
- Semantic-release uses this format to determine version bumps:
  - `feat` -> minor version bump (1.0.0 -> 1.1.0)
  - `fix` -> patch version bump (1.0.0 -> 1.0.1)
  - `BREAKING CHANGE` in body or `!` after type -> major version bump (1.0.0 -> 2.0.0)

## Examples

```
feat(scheduler): add natural language schedule parsing

- support "every N minutes/hours/days" patterns
- fallback to dateparser for complex expressions
```

```
fix(ai-client): handle provider initialization errors gracefully

- catch exceptions and fall back to mock provider
- log warning when auto-fallback occurs
```

```
docs(reference): rewrite environment variables documentation
```
