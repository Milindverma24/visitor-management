#!/bin/bash

echo "Stopping all Visitor Management System processes..."

# Kill any uvicorn processes running on port 8001
echo "Stopping Backend (Port 8001)..."
lsof -ti :8001 | xargs kill -9 2>/dev/null

# Kill any node/vite processes running on port 5173 (default vite port)
echo "Stopping Frontend (Port 5173)..."
lsof -ti :5173 | xargs kill -9 2>/dev/null

echo "All processes stopped."
