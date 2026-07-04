#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

cd "$ROOT_DIR"

echo "=========================================================="
echo "Stopping Visitor Management Infrastructure (Docker)..."
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

# Stop the docker containers
echo "Running: $DOCKER_COMPOSE_CMD down"
$DOCKER_COMPOSE_CMD down

echo "=========================================================="
echo "System infrastructure stopped successfully."
echo "=========================================================="
