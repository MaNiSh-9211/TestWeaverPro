#!/bin/bash

echo "Starting TestWeaver Pro..."
echo ""
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start backend in background
npm run backend &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in background
cd frontend && npm run dev &
FRONTEND_PID=$!

echo "Both servers are starting..."
echo "Backend will be available at http://localhost:5000"
echo "Frontend will be available at http://localhost:3000"
echo ""

# Function to cleanup on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup INT

# Wait for user to stop
wait
