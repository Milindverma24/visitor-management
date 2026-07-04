#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

cd "$ROOT_DIR"

echo "=========================================================="
echo "Starting Visitor Management Infrastructure (Docker)..."
echo "=========================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: docker command not found. Please install Docker." >&2
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

# Start the docker containers
echo "Running: $DOCKER_COMPOSE_CMD up -d"
$DOCKER_COMPOSE_CMD up -d

# Wait for database container to be healthy
echo "Waiting for PostgreSQL to be ready..."
RETRIES=30
until $DOCKER_COMPOSE_CMD exec -T db pg_isready -U visitor_admin -d visitor_management &> /dev/null || [ $RETRIES -eq 0 ]; do
    echo -n "."
    sleep 1
    RETRIES=$((RETRIES-1))
done

if [ $RETRIES -eq 0 ]; then
    echo ""
    echo "Error: PostgreSQL did not become ready in time." >&2
    exit 1
fi

echo ""
echo "PostgreSQL database is ready!"
echo "Redis cache is running!"
echo "=========================================================="
echo "System infrastructure started successfully."
echo "=========================================================="
