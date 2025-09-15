#!/bin/bash

echo "Starting Dental Management System..."

echo "Starting Django Backend..."
cd backend
python manage.py runserver &
BACKEND_PID=$!

sleep 3

echo "Starting React Frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "Both servers are starting..."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Admin: http://localhost:8000/admin"

# Function to cleanup processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup INT

# Wait for processes
wait
