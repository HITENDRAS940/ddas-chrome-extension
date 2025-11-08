#!/bin/bash

# DDAS Quick Start Script
# This script starts all required services for the DDAS extension

echo "🚀 Starting DDAS Services..."

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo "🔥 Killing process $pid on port $port"
        kill -9 $pid
        sleep 2
    fi
}

# Navigate to DDAS directory
cd "$(dirname "$0")"

echo "📍 Working directory: $(pwd)"

# First, ensure correct configuration in files
echo "🔧 Setting up correct port configuration..."

# Ensure server.py uses port 5001
sed -i.bak 's/port=808[0-9]/port=5001/g' server.py
sed -i.bak 's/localhost:808[0-9]/localhost:8080/g' server.py

# Ensure extension uses correct ports (server on 5001, backend API on 8080)
sed -i.bak 's|LOCAL_SERVER_URL = .*|LOCAL_SERVER_URL = "http://localhost:5001";|g' chrome-extension/background_http.js
sed -i.bak 's|BACKEND_API_URL = .*|BACKEND_API_URL = "http://localhost:8080/api";|g' chrome-extension/background_http.js

# Update manifest permissions
sed -i.bak 's|"http://localhost:808[0-9]/\*"|"http://localhost:5001/*", "http://localhost:8080/*"|g' chrome-extension/manifest.json

echo "✅ Configuration files updated for correct ports"

# 1. Start Local HTTP Server (Port 5001)
echo "🌐 Starting Local HTTP Server on port 5001..."
if check_port 5001; then
    echo "⚠️  Port 5001 is in use, killing existing process..."
    kill_port 5001
fi

python3 server.py &
LOCAL_SERVER_PID=$!
echo "✅ Local HTTP Server started (PID: $LOCAL_SERVER_PID)"

# Wait for local server to start
sleep 5

# Test local server
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ Local HTTP Server is responding on port 5001"
else
    echo "❌ Local HTTP Server failed to start"
    kill $LOCAL_SERVER_PID 2>/dev/null
    exit 1
fi

# 2. Start Backend Server (Port 8080)
echo "🖥️  Starting Backend Server on port 8080..."

if check_port 8080; then
    echo "⚠️  Port 8080 is in use, killing existing process..."
    kill_port 8080
fi

echo "🚀 Starting backend on port 8080..."
java -jar target/DDAS-0.0.1-SNAPSHOT.jar &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 20

# Test backend
if curl -s "http://localhost:8080/" > /dev/null 2>&1; then
    echo "✅ Backend Server is responding on port 8080"
else
    echo "❌ Backend Server failed to start on port 8080"
    echo "🔍 Checking if backend process is still running..."
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "⏳ Backend process is running but not responding yet, waiting more..."
        sleep 10
        if curl -s "http://localhost:8080/" > /dev/null 2>&1; then
            echo "✅ Backend Server is now responding"
        else
            echo "❌ Backend Server still not responding after extended wait"
        fi
    else
        echo "❌ Backend process died"
    fi
fi

echo "✅ Services configuration completed"

# Display service information
echo ""
echo "🎉 DDAS Services Started Successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Service Status:"
echo "   🌐 Local HTTP Server:  http://localhost:5001 (File Processing)"
echo "   🖥️  Backend Server:     http://localhost:8080 (API & Database)"
echo "   🔧 Extension:           Load from chrome-extension/ folder"
echo ""
echo "📋 Architecture:"
echo "   Extension → Local Server (5001) → Backend (8080) → Database"
echo ""
echo "📋 Next Steps:"
echo "   1. Open Chrome and go to: chrome://extensions/"
echo "   2. Enable 'Developer mode'"
echo "   3. Click 'Load unpacked' and select chrome-extension/ folder"
echo "   4. Test by downloading a file!"
echo ""
echo "🛑 To stop services:"
echo "   Local Server PID: $LOCAL_SERVER_PID"
echo "   Backend Server PID: $BACKEND_PID"
echo "   Or run: kill $LOCAL_SERVER_PID $BACKEND_PID"
echo ""
echo "📊 Check service status:"
echo "   curl http://localhost:5001/health"
echo "   curl http://localhost:8080/"

# Keep script running to maintain services
echo "💤 Services running... Press Ctrl+C to stop all services"

# Trap Ctrl+C to clean up
trap 'echo "🛑 Stopping services..."; kill $LOCAL_SERVER_PID $BACKEND_PID; exit 0' INT

# Wait for user interrupt
while true; do
    sleep 30
    # Check if services are still running
    if ! kill -0 $LOCAL_SERVER_PID 2>/dev/null; then
        echo "❌ Local HTTP Server stopped unexpectedly"
        break
    fi
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend Server stopped unexpectedly"
        break
    fi
    echo "💓 Services running normally..."
done

echo "🏁 DDAS Services stopped"
