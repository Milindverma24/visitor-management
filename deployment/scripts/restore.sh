#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

cd "$ROOT_DIR"

echo "=========================================================="
echo "Starting Database Restore..."
echo "=========================================================="

# Check if file argument is provided
if [ -z "$1" ]; then
    echo "Error: No backup file provided." >&2
    echo "Usage: $0 <path_to_backup_file.sql>" >&2
    exit 1
fi

BACKUP_FILE="$1"

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found at '$BACKUP_FILE'." >&2
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: docker command not found." >&2
    exit 1
fi

# Determine docker compose command (v2 vs v1)
DOCKER_COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null; then
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        echo "Error: neither 'docker compose' nor 'docker-compose' was found." >&2
        exit 1
    fi
fi

# Check if db container is running
if ! $DOCKER_COMPOSE_CMD ps db --format json | grep -q '"State":"running"'; then
    if ! $DOCKER_COMPOSE_CMD ps db | grep -q "Up"; then
        echo "Error: The database service 'db' is not running." >&2
        echo "Please start the infrastructure first using start.sh" >&2
        exit 1
    fi
fi

echo "Warning: This will overwrite existing data in the 'visitor_management' database."
read -p "Are you sure you want to proceed? (y/N): " confirm
if [[ ! "$confirm" =~ ^[yY](es)?$ ]]; then
    echo "Restore aborted by user."
    exit 0
fi

echo "Restoring database from '$BACKUP_FILE'..."
# Run psql inside the db service and pipe the backup file into it
if $DOCKER_COMPOSE_CMD exec -T db psql -U visitor_admin -d visitor_management < "$BACKUP_FILE"; then
    echo "Database restore completed successfully!"
else
    echo "Error: Database restore failed." >&2
    exit 1
fi
echo "=========================================================="
