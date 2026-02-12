#!/bin/bash

echo "========================================"
echo "Academic Calendar Organizer - Dev Mode"
echo "========================================"
echo ""

# Check if node_modules exist
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo ""
echo "========================================"
echo "Starting Backend Server..."
echo "========================================"
echo "Backend will run on http://localhost:5000"
echo ""
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "Starting Frontend Server..."
echo "========================================"
echo "Frontend will run on http://localhost:3000"
echo ""
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "Development servers started!"
echo "========================================"
echo ""
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID