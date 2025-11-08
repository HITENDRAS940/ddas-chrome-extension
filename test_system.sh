#!/bin/bash

# DDAS System Test Script
# This script tests all components of the DDAS system

echo "🧪 DDAS System Test"
echo "==================="

# Test 1: Local HTTP Server
echo "1️⃣ Testing Local HTTP Server..."
if curl -s http://localhost:8080/health > /dev/null; then
    echo "   ✅ Local server is running on port 8080"
    LOCAL_SERVER_STATUS="✅ RUNNING"
else
    echo "   ❌ Local server is not responding"
    LOCAL_SERVER_STATUS="❌ OFFLINE"
fi

# Test 2: Backend Server (try multiple ports)
echo "2️⃣ Testing Backend Server..."
BACKEND_STATUS="❌ OFFLINE"
for port in 8080 8081 8082 8083 8084; do
    if curl -s http://localhost:$port/ > /dev/null 2>&1; then
        echo "   ✅ Backend server is running on port $port"
        BACKEND_STATUS="✅ RUNNING (Port $port)"
        BACKEND_PORT=$port
        break
    fi
done

if [ "$BACKEND_STATUS" = "❌ OFFLINE" ]; then
    echo "   ❌ Backend server is not responding on any port"
fi

# Test 3: Extension Files
echo "3️⃣ Testing Extension Files..."
cd "$(dirname "$0")/chrome-extension"

if [ -f "manifest.json" ] && [ -f "background_http.js" ] && [ -f "popup.html" ]; then
    echo "   ✅ All extension files present"
    EXTENSION_FILES="✅ COMPLETE"
else
    echo "   ❌ Some extension files are missing"
    EXTENSION_FILES="❌ INCOMPLETE"
fi

# Test 4: Extension Icons
echo "4️⃣ Testing Extension Icons..."
if [ -f "icon16.png" ] && [ -f "icon48.png" ]; then
    echo "   ✅ Required icons present"
    ICON_STATUS="✅ PRESENT"
else
    echo "   ❌ Some icons are missing"
    ICON_STATUS="❌ MISSING"
fi

# Test 5: Database Connection
echo "5️⃣ Testing Database..."
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL is running"
    DB_STATUS="✅ PostgreSQL"
else
    echo "   ⚠️  PostgreSQL not available, backend will use H2"
    DB_STATUS="⚠️ H2 (fallback)"
fi

# Summary
echo ""
echo "📊 System Status Summary"
echo "========================"
echo "Local HTTP Server: $LOCAL_SERVER_STATUS"
echo "Backend Server:    $BACKEND_STATUS"
echo "Extension Files:   $EXTENSION_FILES"
echo "Extension Icons:   $ICON_STATUS"
echo "Database:          $DB_STATUS"
echo ""

# Provide next steps
if [ "$LOCAL_SERVER_STATUS" = "✅ RUNNING" ] && [[ "$BACKEND_STATUS" == *"RUNNING"* ]]; then
    echo "🎉 System Ready!"
    echo "📋 Next Steps:"
    echo "   1. Open Chrome: chrome://extensions/"
    echo "   2. Enable Developer mode"
    echo "   3. Load unpacked extension from: $(pwd)"
    echo "   4. Test by downloading a file!"
    echo ""
    echo "🔧 Test URLs:"
    echo "   Local Server:  http://localhost:8080/health"
    echo "   Backend:       http://localhost:8080/"
else
    echo "⚠️ System Not Ready"
    echo "🔧 To fix:"
    echo "   Run: ./start_ddas.sh"
fi

echo ""
echo "🐛 For debugging:"
echo "   Extension Console: Chrome DevTools → Console"
echo "   Run: ddas_test_notification()"
