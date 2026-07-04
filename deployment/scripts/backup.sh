#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"
BACKUP_DIR="$ROOT_DIR/database/backups"

cd "$ROOT_DIR"

echo "=========================================================="
echo "Starting Database Backup..."
echo "=========================================================="

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
    # Fallback check if format json is not supported or does not contain running
    if ! $DOCKER_COMPOSE_CMD ps db | grep -q "Up"; then
        echo "Error: The database service 'db' is not running." >&2
        echo "Please start the infrastructure first using start.sh" >&2
        exit 1
    fi
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

echo "Backing up 'visitor_management' database..."
# Run pg_dump inside the db service and write stdout to backup file
if $DOCKER_COMPOSE_CMD exec -T db pg_dump -U visitor_admin -d visitor_management > "$BACKUP_FILE"; then
    echo "Backup completed successfully!"
    echo "Backup file created at: $BACKUP_FILE"
    echo "File size: $(du -sh "$BACKUP_FILE" | cut -f1)"
else
    echo "Error: Database backup failed." >&2
    # Clean up empty file if failed
    rm -f "$BACKUP_FILE"
    exit 1
fi
echo "=========================================================="
