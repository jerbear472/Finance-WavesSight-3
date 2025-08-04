#!/bin/bash

echo "🚀 Starting Finance WaveSight 3 Local Development"
echo "================================================"

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use. Killing existing process..."
        lsof -ti:$1 | xargs kill -9
        sleep 1
    fi
}

# Check and clear port 3000
check_port 3000

# Navigate to web directory
cd "$(dirname "$0")/web"

echo "📦 Checking dependencies..."
npm install

echo ""
echo "🌐 Starting Next.js development server..."
echo "========================================="
echo "📍 Application: http://localhost:3000"
echo "📋 Finance Trends: http://localhost:3000/submit"
echo "✅ Verification: http://localhost:3000/verify"
echo "========================================="
echo ""

# Start the development server
npm run dev