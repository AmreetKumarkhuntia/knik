#!/usr/bin/env bash
# Applies every db/migrations/*.sql file not yet recorded in schema_migrations, in lexical order.
# Each file runs in its own transaction together with its schema_migrations row, so a failing file
# leaves no trace and the next run retries it.
#
# Connection settings come from KNIK_DB_HOST/PORT/USER/PASS/NAME (defaults match lib/core/config.py).
# Values in .env fill in only variables that are not already set in the environment.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/db/migrations"

# Reads KNIK_DB_* assignments from a dotenv file: `KEY=value` or `export KEY=value`, values optionally
# single- or double-quoted, with `# comments` after unquoted values ignored.
load_db_env() {
    local file="$1" line key value
    local assignment='^[[:space:]]*(export[[:space:]]+)?(KNIK_DB_[A-Z_]+)[[:space:]]*=[[:space:]]*(.*)$'
    local double_quoted='^"(.*)"[[:space:]]*(#.*)?$'
    local single_quoted="^'(.*)'[[:space:]]*(#.*)?\$"
    while IFS= read -r line || [ -n "$line" ]; do
        [[ "$line" =~ $assignment ]] || continue
        key="${BASH_REMATCH[2]}"
        value="${BASH_REMATCH[3]}"
        if [[ "$value" =~ $double_quoted ]] || [[ "$value" =~ $single_quoted ]]; then
            value="${BASH_REMATCH[1]}"
        else
            value="${value%%[[:space:]]#*}"
            value="${value%"${value##*[![:space:]]}"}"
        fi
        if [ -z "${!key+set}" ]; then
            export "$key=$value"
        fi
    done < "$file"
}

if [ -f "$ROOT_DIR/.env" ]; then
    echo "Loading database settings from .env"
    load_db_env "$ROOT_DIR/.env"
fi

if ! command -v psql > /dev/null 2>&1; then
    echo "Error: 'psql' is not installed or not in PATH." >&2
    echo "Install the PostgreSQL client tools to run migrations:" >&2
    echo "  Debian/Ubuntu: sudo apt-get install postgresql-client" >&2
    echo "  macOS (Homebrew): brew install postgresql" >&2
    exit 1
fi

DB_HOST="${KNIK_DB_HOST:-localhost}"
DB_PORT="${KNIK_DB_PORT:-5432}"
DB_USER="${KNIK_DB_USER:-postgres}"
DB_NAME="${KNIK_DB_NAME:-knik}"
if [ -n "${KNIK_DB_PASS:-}" ]; then
    export PGPASSWORD="$KNIK_DB_PASS"
fi
# Silences the "already exists, skipping" notices that idempotent migrations emit on re-runs.
export PGOPTIONS="${PGOPTIONS:-} -c client_min_messages=warning"

PSQL=(psql -X -q -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME")

echo "Migrating $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"

"${PSQL[@]}" -c "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now())"
applied="$("${PSQL[@]}" -A -t -c "SELECT name FROM schema_migrations")"

shopt -s nullglob
sql_files=("$MIGRATIONS_DIR"/*.sql)
if [ ${#sql_files[@]} -eq 0 ]; then
    echo "Error: no migrations found in $MIGRATIONS_DIR" >&2
    exit 1
fi
# Sorted bytewise so the order is lexical whatever the caller's locale. A read loop rather than mapfile,
# which macOS's stock bash 3.2 lacks.
files=()
while IFS= read -r file; do
    files+=("$file")
done < <(printf '%s\n' "${sql_files[@]}" | LC_ALL=C sort)

applied_count=0
skipped_count=0
for file in "${files[@]}"; do
    name="$(basename "$file")"
    if grep -qxF -- "$name" <<< "$applied"; then
        echo "  skip   $name (already applied)"
        skipped_count=$((skipped_count + 1))
        continue
    fi
    echo "  apply  $name"
    "${PSQL[@]}" --single-transaction -v name="$name" -f "$file" -f - <<< "INSERT INTO schema_migrations (name) VALUES (:'name');"
    applied_count=$((applied_count + 1))
done

echo "Done: $applied_count applied, $skipped_count already applied."
