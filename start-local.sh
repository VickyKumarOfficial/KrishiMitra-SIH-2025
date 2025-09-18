#!/bin/bash

# KrishiMitra Local Development Startup Script

echo "🌾 Starting KrishiMitra Local Development Environment..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "❌ MongoDB is not running. Please start MongoDB first:"
    echo "   - macOS: brew services start mongodb-community"
    echo "   - Linux: sudo systemctl start mongod"
    echo "   - Windows: Start MongoDB service from Services"
    exit 1
fi

echo "✅ MongoDB is running"

# Function to check if port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null; then
        echo "❌ Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Check required ports
check_port 8001 || echo "Backend port 8001 is busy - you may need to kill the existing process"
check_port 3000 || echo "Frontend port 3000 is busy - you may need to kill the existing process"

# Start Backend
echo "🚀 Starting Backend Server..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt
python server.py &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait a bit for backend to start
sleep 3

# Start Frontend
echo "🚀 Starting Frontend..."
cd ../frontend
npm install
npm start &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

echo ""
echo "🎉 KrishiMitra is starting up!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8001"
echo "📚 API Docs: http://localhost:8001/docs"
echo ""
echo "To stop the services, press Ctrl+C"
echo "PIDs - Backend: $BACKEND_PID, Frontend: $FRONTEND_PID"

# Wait for Ctrl+C
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait