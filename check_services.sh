#!/bin/bash
# DDAS Quick Start Script
# This script helps you start all required services for DDAS

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "═══════════════════════════════════════════════════════"
echo "  🚀 DDAS - Data Duplication Alert System"
echo "  Quick Start Script"
echo "═══════════════════════════════════════════════════════"
echo ""

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to check if a service is running
check_service() {
    local name=$1
    local port=$2

    if check_port $port; then
        echo "✅ $name is running on port $port"
        return 0
    else
        echo "❌ $name is NOT running on port $port"
        return 1
    fi
}

echo "🔍 Checking service status..."
echo ""

# Check PostgreSQL
if brew services list | grep postgresql | grep started > /dev/null 2>&1; then
    echo "✅ PostgreSQL is running"
    POSTGRES_OK=1
else
    echo "❌ PostgreSQL is NOT running"
    echo "   Start with: brew services start postgresql@14"
    POSTGRES_OK=0
fi

# Check Backend
if check_service "Backend Server" 8080; then
    BACKEND_OK=1
else
    BACKEND_OK=0
fi

# Check Local Server
if check_service "Local HTTP Server" 5001; then
    SERVER_OK=1
else
    SERVER_OK=0
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo ""

# If everything is running
if [ $POSTGRES_OK -eq 1 ] && [ $BACKEND_OK -eq 1 ] && [ $SERVER_OK -eq 1 ]; then
    echo "🎉 All services are running!"
    echo ""
    echo "You can now use DDAS:"
    echo "  1. Open Chrome"
    echo "  2. Click the DDAS extension icon"
    echo "  3. Login or signup"
    echo "  4. Download a file to test"
    echo ""
    exit 0
fi

# Otherwise, show what needs to be started
echo "⚠️  Some services are not running. Here's how to start them:"
echo ""

if [ $POSTGRES_OK -eq 0 ]; then
    echo "📦 Start PostgreSQL:"
    echo "   brew services start postgresql@14"
    echo ""
fi

if [ $BACKEND_OK -eq 0 ]; then
    echo "🔧 Start Backend Server (in a new terminal):"
    echo "   cd $SCRIPT_DIR"
    echo "   ./mvnw spring-boot:run"
    echo ""
fi

if [ $SERVER_OK -eq 0 ]; then
    echo "🌐 Start Local HTTP Server (in a new terminal):"
    echo "   cd $SCRIPT_DIR"
    echo "   python3 server.py"
    echo ""
fi

echo "═══════════════════════════════════════════════════════"
echo ""
echo "💡 Quick Start Commands:"
echo ""
echo "# Terminal 1: Start Backend"
echo "cd $SCRIPT_DIR && ./mvnw spring-boot:run"
echo ""
echo "# Terminal 2: Start Local Server"
echo "cd $SCRIPT_DIR && python3 server.py"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📖 For complete setup guide, see: SETUP_GUIDE.md"
echo ""

