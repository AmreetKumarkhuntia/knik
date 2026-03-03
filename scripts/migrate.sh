#!/usr/bin/env bash
# Runs the database migrations using psql
set -e

# Move to the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$SCRIPT_DIR/.."

# Defaults
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_PASS=""
DB_NAME="knik"

# Load the database config from .env if it exists
if [ -f .env ]; then
    echo "📝 Loading environment variables from .env..."
    
    # Try parsing export format first
    HOST_VAL=$(grep "^export KNIK_DB_HOST=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    PORT_VAL=$(grep "^export KNIK_DB_PORT=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    USER_VAL=$(grep "^export KNIK_DB_USER=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    PASS_VAL=$(grep "^export KNIK_DB_PASS=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    NAME_VAL=$(grep "^export KNIK_DB_NAME=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    
    # Fallback to standard format if empty
    if [ -z "$HOST_VAL" ]; then HOST_VAL=$(grep "^KNIK_DB_HOST=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'"); fi
    if [ -z "$PORT_VAL" ]; then PORT_VAL=$(grep "^KNIK_DB_PORT=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'"); fi
    if [ -z "$USER_VAL" ]; then USER_VAL=$(grep "^KNIK_DB_USER=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'"); fi
    if [ -z "$PASS_VAL" ]; then PASS_VAL=$(grep "^KNIK_DB_PASS=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'"); fi
    if [ -z "$NAME_VAL" ]; then NAME_VAL=$(grep "^KNIK_DB_NAME=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'"); fi
    
    [ -n "$HOST_VAL" ] && DB_HOST="$HOST_VAL"
    [ -n "$PORT_VAL" ] && DB_PORT="$PORT_VAL"
    [ -n "$USER_VAL" ] && DB_USER="$USER_VAL"
    [ -n "$PASS_VAL" ] && DB_PASS="$PASS_VAL"
    [ -n "$NAME_VAL" ] && DB_NAME="$NAME_VAL"
fi

# Check if psql is available
if ! command -v psql >/dev/null 2>&1; then
    echo "❌ Error: 'psql' is not installed or not in PATH."
    echo "Please install PostgreSQL client tools to run migrations using pure shell."
    echo "Debian/Ubuntu: sudo apt-get install postgresql-client"
    echo "macOS (Homebrew): brew install postgresql"
    exit 1
fi

MIGRATION_FILE="db/migrations/001_initial_scheduler_schema.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "Error: Migration file $MIGRATION_FILE not found."
    exit 1
fi

echo "🚀 Applying migration: $MIGRATION_FILE to $DB_HOST:$DB_PORT/$DB_NAME"

# Run the migration using psql
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"

echo "✅ Migration completed successfully."
