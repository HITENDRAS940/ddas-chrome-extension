# 🚀 DDAS HTTP Server Mode - Complete Setup Guide

## 📋 Overview

**DDAS has been completely migrated from native messaging to HTTP server communication!**

This eliminates all the complex native messaging setup while providing reliable communication between the Chrome extension and file processing backend.

## 🏗️ New Architecture

```
Chrome Extension → HTTP Request → Local HTTP Server (Flask) → Spring Boot Backend
```

**Key Benefits:**
- ✅ **No native messaging setup** - no manifest files or registry entries
- ✅ **Simple HTTP communication** - standard web requests
- ✅ **Easy debugging** - clear request/response flow
- ✅ **Cross-platform** - works the same on all operating systems
- ✅ **Reliable** - no process management issues

## 🎯 Quick Start

### Step 1: Start Backend Database
```bash
# Start PostgreSQL (choose one that works)
brew services start postgresql@14
# OR
pg_ctl -D /usr/local/var/postgres start
```

### Step 2: Start Spring Boot Backend
```bash
cd /Users/hitendrasingh/Desktop/DDAS
./run_backend.sh start
```
**Wait for**: "✅ Backend is ready and responding!"

### Step 3: Start HTTP Server
```bash
cd /Users/hitendrasingh/Desktop/DDAS
./server_manager.sh start
```
**Expected Output**:
```
✅ DDAS HTTP Server started successfully!
🌐 Server URL: http://localhost:5001
❤️ Health check: http://localhost:5001/health
```

### Step 4: Load Chrome Extension
1. Go to `chrome://extensions/`
2. Enable **"Developer mode"**
3. Click **"Load unpacked"**
4. Select: `/Users/hitendrasingh/Desktop/DDAS/chrome-extension/`
5. **Should see**: "DDAS - Ready" notification

### Step 5: Test the System
1. Login through extension popup
2. Download any file from the internet
3. **Should see**: "filename - Click this notification to check for duplicates"
4. Click notification → file gets processed via HTTP server

## 📁 Clean Project Structure

```
DDAS/
├── README_HTTP.md                   ← This guide
├── server.py                        ← Flask HTTP server (NEW)
├── server_manager.sh               ← HTTP server management (NEW)
├── run_backend.sh                  ← Spring Boot backend management
├── chrome-extension/               ← Chrome extension (UPDATED)
│   ├── manifest.json              ← Updated for HTTP mode
│   ├── background_http.js          ← HTTP communication logic
│   ├── popup.html                 ← Login interface
│   └── popup.js                   ← Popup functionality
├── src/                           ← Spring Boot backend
├── pom.xml                        ← Maven configuration
├── server.log                     ← HTTP server logs (NEW)
└── backend.log                    ← Backend logs
```

## 🔧 Management Commands

### HTTP Server Management:
```bash
./server_manager.sh start      # Start HTTP server
./server_manager.sh stop       # Stop HTTP server
./server_manager.sh status     # Check server status
./server_manager.sh test       # Test server connection
./server_manager.sh logs       # View live logs
./server_manager.sh restart    # Restart server
```

### Backend Management:
```bash
./run_backend.sh start         # Start Spring Boot backend
./run_backend.sh stop          # Stop backend
./run_backend.sh status        # Check backend status
./run_backend.sh logs          # View backend logs
```

## 🧪 Testing & Debugging

### Test HTTP Server:
```bash
# Health check
curl http://localhost:5001/health

# Test file processing (requires auth token)
curl -X POST http://localhost:5001/process \
  -H "Content-Type: application/json" \
  -d '{"path": "/path/to/test/file.txt", "auth_token": "your_jwt_token"}'
```

### Test Chrome Extension:
1. **Service Worker Console**: `chrome://extensions/` → DDAS → Service Worker
2. **Test Connection**: In console run `ddas_test_server()`
3. **Test Notification**: In console run `ddas_test_notification()`

### Expected Log Flow:

**HTTP Server Logs** (`./server_manager.sh logs`):
```
[SERVER] INFO: Processing file request: /Users/user/Downloads/document.pdf
[SERVER] INFO: File hash: a1b2c3d4e5f6...
[SERVER] INFO: No duplicate found, uploading file...
[SERVER] INFO: File uploaded successfully
```

**Chrome Extension Console**:
```
🔗 Testing connection to local server...
✅ Local server connected: {status: "running", service: "DDAS Local Server"}
📤 Sending file to server: /Users/user/Downloads/document.pdf
📨 Server response: {success: true, duplicate: false, filename: "document.pdf"}
```

## 🎯 Communication Flow

### 1. Download Detection:
```
Chrome detects download completion
  ↓
Extension extracts file path
  ↓
Shows consent notification
```

### 2. User Consent:
```
User clicks consent notification
  ↓
Extension sends HTTP POST to localhost:5001/process
  ↓
HTTP server processes file
```

### 3. File Processing:
```
HTTP server receives request
  ↓
Calculates file hash
  ↓
Checks Spring Boot backend for duplicates
  ↓
Uploads file if not duplicate
  ↓
Returns result to extension
```

### 4. Result Display:
```
Extension receives HTTP response
  ↓
Shows duplicate alert OR success notification
  ↓
User sees final result
```

## 📊 System Health Check

Run this script to verify everything is working:

```bash
#!/bin/bash
echo "🔍 DDAS HTTP System Health Check"
echo "================================"

# Check backend
if curl -s http://localhost:8080/api/health >/dev/null 2>&1; then
    echo "✅ Spring Boot Backend: Running"
else
    echo "❌ Spring Boot Backend: Not responding"
fi

# Check HTTP server
if curl -s http://localhost:5001/health >/dev/null 2>&1; then
    echo "✅ HTTP Server: Running"
else
    echo "❌ HTTP Server: Not responding"
fi

# Check database
if psql -h localhost -U postgres -d ddas_db -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Database: Connected"
else
    echo "❌ Database: Not accessible"
fi

echo
echo "🌐 URLs:"
echo "  Backend: http://localhost:8080/api/health"
echo "  HTTP Server: http://localhost:5001/health"
echo "  Extension: chrome://extensions/"
```

## 🐛 Troubleshooting

### Problem: HTTP Server won't start (port conflict)
**Solution:**
```bash
# Check what's using port 5001
lsof -i:5001

# Kill process on port 5001
lsof -ti:5001 | xargs kill -9

# Restart server
./server_manager.sh restart
```

### Problem: Extension can't connect to server
**Checklist:**
1. ✅ HTTP server running: `./server_manager.sh status`
2. ✅ Extension loaded in Chrome: `chrome://extensions/`
3. ✅ Correct host permissions in manifest: `localhost:5001`
4. ✅ No CORS errors in console

### Problem: Files not being processed
**Debug Steps:**
1. Check Service Worker console for download events
2. Verify user is logged in through extension popup
3. Check HTTP server logs: `./server_manager.sh logs`
4. Test server manually: `curl http://localhost:5001/health`

### Problem: "Server not accessible" notification
**Solution:**
```bash
# Restart HTTP server
./server_manager.sh restart

# Check server logs for errors
./server_manager.sh logs

# Verify Flask dependencies
pip3 install flask flask-cors requests
```

## ✅ Migration Complete!

**What was removed:**
- ❌ Native messaging manifest files
- ❌ Native host Python scripts  
- ❌ Chrome extension native messaging code
- ❌ Registry setup requirements
- ❌ Complex process management

**What was added:**
- ✅ Flask HTTP server (`server.py`)
- ✅ HTTP-based Chrome extension (`background_http.js`)
- ✅ Simple server management (`server_manager.sh`)
- ✅ Clear request/response communication
- ✅ Easy debugging and testing

## 🎉 Benefits Achieved

1. **🔧 Simplified Setup**: No native messaging registration required
2. **🌐 Standard HTTP**: Uses familiar web protocols
3. **🐛 Easy Debugging**: Clear request/response logs
4. **⚡ Reliable**: No process management issues
5. **🔄 Auto-retry**: Built-in retry mechanism for server connections
6. **📱 Cross-platform**: Works identically on all operating systems

**The system is now much more reliable and easier to maintain!** 🎉

## 🚀 Start Everything:

```bash
# Complete startup sequence
cd /Users/hitendrasingh/Desktop/DDAS

# 1. Start backend
./run_backend.sh start

# 2. Start HTTP server  
./server_manager.sh start

# 3. Load extension in Chrome
# 4. Login and test with file downloads

# That's it! 🎯
```
