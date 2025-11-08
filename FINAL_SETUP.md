# DDAS Complete Setup - Final Configuration

## ✅ System Architecture

```
Chrome Extension → Local Server (5001) → Backend (8080) → Database
```

### Port Assignment:
- **Local HTTP Server**: Port 5001 (File processing and extension communication)
- **Backend Server**: Port 8080 (API endpoints and database operations)

## 🚀 Single Command Setup

Run this single command to start the entire DDAS system:

```bash
cd /Users/hitendrasingh/Desktop/DDAS && ./start_ddas.sh
```

### What the script does:

1. **Configuration Update**: 
   - Sets server.py to use port 5001
   - Sets backend references to port 8080
   - Updates extension to use both ports correctly

2. **Service Startup**:
   - Kills any existing processes on ports 5001 and 8080
   - Starts local HTTP server on port 5001
   - Starts backend server on port 8080
   - Verifies both services are responding

3. **Continuous Monitoring**:
   - Keeps services running until Ctrl+C
   - Monitors service health every 30 seconds
   - Automatically cleans up processes on exit

## 📋 Expected Output

When you run `./start_ddas.sh`, you should see:

```
🚀 Starting DDAS Services...
🔧 Setting up correct port configuration...
✅ Configuration files updated for correct ports
🌐 Starting Local HTTP Server on port 5001...
✅ Local HTTP Server started (PID: XXXX)
✅ Local HTTP Server is responding on port 5001
🖥️  Starting Backend Server on port 8080...
🚀 Starting backend on port 8080...
⏳ Waiting for backend to start...
✅ Backend Server is responding on port 8080

🎉 DDAS Services Started Successfully!
📊 Service Status:
   🌐 Local HTTP Server:  http://localhost:5001 (File Processing)
   🖥️  Backend Server:     http://localhost:8080 (API & Database)
```

## 🧪 Testing After Setup

### 1. Verify Services:
```bash
curl http://localhost:5001/health    # Should return server status
curl http://localhost:8080/          # Should return HTTP 403 (protected)
```

### 2. Install Chrome Extension:
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select: `/Users/hitendrasingh/Desktop/DDAS/chrome-extension/`

### 3. Test File Processing:
1. Download any file from the internet
2. Should see centered popup: "DDAS - Download Detected"
3. Should see consent popup: "Check File for Duplicates?"
4. Click "Check File" → Progress popup with 4 steps
5. Final result: Success or duplicate alert

## 🔧 Service Flow

1. **User downloads file** → Chrome extension detects
2. **Extension shows popup** → User consents to check file
3. **Extension → Local Server (5001)** → POST /process with file path
4. **Local Server → Backend (8080)** → Check for duplicates via API
5. **Backend processes** → Returns duplicate status or uploads file
6. **Result shown to user** → Success or duplicate alert popup

## 🛑 Stopping Services

Press `Ctrl+C` in the terminal running the script, or run:
```bash
pkill -f "server.py" && pkill -f "DDAS-0.0.1-SNAPSHOT.jar"
```

## 📁 Files Updated for This Configuration

- ✅ `start_ddas.sh` - Complete startup script
- ✅ `server.py` - Runs on port 5001
- ✅ `chrome-extension/background_http.js` - Uses ports 5001 and 8080
- ✅ `chrome-extension/manifest.json` - Permissions for both ports
- ✅ Backend configuration - Uses port 8080 (default)

## 🎯 Ready to Use!

The DDAS system is now configured with the correct architecture:
- **Single script startup** with `./start_ddas.sh`
- **Proper port separation** for different services
- **Automated configuration** of all components
- **Health monitoring** and process management

Simply run the start script and install the Chrome extension to begin using DDAS for duplicate file detection!
