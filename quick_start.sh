#!/bin/bash

echo "🚀 Starting DDAS Services for Testing..."

cd "$(dirname "$0")"

# Kill any existing processes
echo "🔥 Stopping existing services..."
pkill -f "server.py" 2>/dev/null
pkill -f "DDAS-0.0.1-SNAPSHOT.jar" 2>/dev/null
sleep 2

# Start local HTTP server
echo "🌐 Starting local HTTP server on port 5001..."
python3 server.py &
LOCAL_PID=$!
echo "   PID: $LOCAL_PID"

# Wait for local server to start
sleep 3

# Test local server
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ Local HTTP server is running"
else
    echo "❌ Local HTTP server failed to start"
    echo "📋 Installing dependencies..."
    pip3 install flask flask-cors requests
    python3 server.py &
    LOCAL_PID=$!
    sleep 3
fi

# Start backend server
echo "🖥️  Starting backend server on port 8080..."
./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-Dserver.port=8080" &
BACKEND_PID=$!
echo "   PID: $BACKEND_PID"

echo "⏳ Waiting for services to start..."
sleep 10

# Check services
echo "🔍 Checking service status..."

if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ Local server: RUNNING"
else
    echo "❌ Local server: FAILED"
fi

if curl -s http://localhost:8080/ > /dev/null 2>&1; then
    echo "✅ Backend server: RUNNING"
else
    echo "❌ Backend server: FAILED"
fi

echo ""
echo "🎯 Services Started!"
echo "📋 Next steps:"
echo "   1. Reload Chrome extension"
echo "   2. Download a file to test"
echo "   3. Check console logs for debugging"
echo ""
echo "🛑 To stop: kill $LOCAL_PID $BACKEND_PID"
