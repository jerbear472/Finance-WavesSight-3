#!/bin/bash

echo "Starting Finance WaveSight 3.0..."

# Navigate to web directory
cd /Users/JeremyUys_1/Desktop/Finance\ WaveSight\ 3/web

# Kill any existing processes on port 3000
echo "Checking for existing processes on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start the Next.js development server
echo "Starting Next.js development server..."
npm run dev &

# Wait a moment for the server to start
sleep 5

# Open in browser
echo "Opening http://localhost:3000 in browser..."
open http://localhost:3000

echo "Finance WaveSight 3.0 is starting!"
echo "Access it at: http://localhost:3000"
echo ""
echo "To stop the server, press Ctrl+C"

# Keep the script running
wait