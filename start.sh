#!/bin/bash

# ==============================================================
# Visitor Management System - Start Script
# ==============================================================

echo "Starting Visitor Management System..."

# 1. Start the Backend (FastAPI)
echo "Starting Backend..."
cd backend
source venv/bin/activate
# Start uvicorn in the background
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload &
BACKEND_PID=$!
cd ..

# 2. Start the Frontend (Vite)
echo "Starting Frontend..."
cd frontend
# Start npm in the foreground so the user sees the output and can Ctrl+C
npm run dev

# 3. Cleanup when the user hits Ctrl+C
echo "Shutting down..."
kill $BACKEND_PID
