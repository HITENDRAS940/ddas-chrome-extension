# DDAS Extension Complete Setup Guide

## Overview
DDAS (Data Duplication Alert System) consists of:
1. **Backend Server** (Spring Boot) - Handles file storage and duplicate detection (Port: 8080+)
2. **Local HTTP Server** (Python Flask) - Bridges Chrome extension to backend (Port: 5001)
3. **Chrome Extension** - Monitors downloads and shows notifications

## Quick Start (Easiest Method)

### Option 1: Automated Setup
```bash
cd /Users/hitendrasingh/Desktop/DDAS
./start_ddas.sh
```
This script will:
- Kill any existing processes
- Start local server on port 5001
- Start backend on an available port (8081+)
- Update all configuration files automatically
- Keep services running until you press Ctrl+C

### Option 2: Manual Setup
If you prefer to start services manually:

## Prerequisites
- Java 11+ (for Spring Boot backend)
- Python 3.8+ (for local HTTP server)
- PostgreSQL database (optional - will use H2 if PostgreSQL fails)
- Chrome/Chromium browser
- Maven (for building backend)

## Complete Setup Process

### 1. Database Setup (PostgreSQL)
```bash
# Create database
createdb ddas_db

# Update backend configuration if needed
# Edit src/main/resources/application.properties
```

### 2. Backend Server (Spring Boot)
```bash
# Navigate to project root
cd /Users/hitendrasingh/Desktop/DDAS

# Build the project
./mvnw clean package -DskipTests

# Run the backend server (port 8080)
java -jar target/DDAS-0.0.1-SNAPSHOT.jar

# Alternative: Use Maven
./mvnw spring-boot:run
```
**Status Check:** Backend should be accessible at http://localhost:8080

### 3. Local HTTP Server (Python Flask)
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the local HTTP server (port 5001)
python3 server.py
```
**Status Check:** Server should be accessible at http://localhost:5001/health

### 4. Chrome Extension Installation
```bash
# Navigate to extension directory
cd chrome-extension

# Open Chrome and go to: chrome://extensions/
# Enable "Developer mode" (top right toggle)
# Click "Load unpacked"
# Select the chrome-extension directory
```

## Current Status (Working Setup)

✅ **Local HTTP Server**: Running on port 5001  
✅ **Backend Server**: Running on port 8080  
✅ **Chrome Extension**: Updated with enhanced debugging  
⚠️ **Database**: Using H2 (in-memory) instead of PostgreSQL  

## Testing the Complete System

### Step 1: Verify All Services
```bash
# Check local server
curl http://localhost:5001/health

# Check backend (any available port 8080+)
curl http://localhost:8080/
# Note: Backend endpoints are protected but this confirms it's running

# Check extension
# Go to chrome://extensions/ - DDAS should be active
```

### Step 2: Install Chrome Extension
1. Open Chrome and go to: `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `chrome-extension/` directory
5. Extension should load and show a test notification

### Step 3: Test Extension Functions
Open Chrome Developer Tools → Console in any tab, run:
```javascript
// Test server connection
ddas_test_server()

// Test notifications
ddas_test_notification()

// Test consent notification
ddas_test_consent()

// Check recent downloads
ddas_test_downloads()

// Check storage
ddas_debug_storage()
```

### Step 4: Test Download Detection (Current Behavior)
1. **Login/Signup**: Click extension icon → Login/Signup
2. **Download a file**: Download any file from the internet
3. **Expected behavior**:
   - Extension detects download completion (check console logs)
   - Shows "Download Detected" notification immediately
   - Shows consent notification: "Check File for Duplicates?"
   - Click consent notification to process the file
   - File gets sent to local server → backend for duplicate check
   - Shows result notification (duplicate found or upload success)

### Step 4: Test Duplicate Detection
1. Download a file for the first time
2. Process it through the extension (should upload successfully)
3. Download the same file again
4. Process it again (should detect duplicate and show alert)

## Troubleshooting

### Extension Not Detecting Downloads
- Check Chrome Developer Tools Console for errors
- Run `ddas_test_downloads()` to see if extension can access downloads API
- Verify extension has all required permissions

### Notifications Not Appearing
- Check if Chrome notifications are enabled for the extension
- Run `ddas_test_notification()` to test notification system
- Check Chrome's notification settings

### Local Server Connection Issues
- Verify server is running: `curl http://localhost:5001/health`
- Check server.log for errors
- Run `ddas_test_server()` in extension console

### Backend Connection Issues
- Verify backend is running: `curl http://localhost:8080/actuator/health`
- Check backend.log for errors
- Verify database connection

### Authentication Issues
- Clear extension storage: Chrome → Extensions → DDAS → Storage
- Re-login through extension popup
- Check if JWT token is stored: `ddas_debug_storage()`

## Service Management Commands

### Start All Services (Manual)
```bash
# Terminal 1: Backend
cd /Users/hitendrasingh/Desktop/DDAS
java -jar target/DDAS-0.0.1-SNAPSHOT.jar

# Terminal 2: Local Server
cd /Users/hitendrasingh/Desktop/DDAS
python3 server.py

# Browser: Extension should auto-start when Chrome loads
```

### Stop All Services
- Backend: Ctrl+C in terminal
- Local Server: Ctrl+C in terminal  
- Extension: Chrome → Extensions → Toggle off DDAS

## File Locations
- **Backend Logs**: `backend.log`
- **Server Logs**: `server.log`
- **Extension Console**: Chrome DevTools → Console (any tab)
- **Extension Storage**: Chrome → Extensions → DDAS → Inspect views: background page

## Expected File Flow
1. User downloads file → Chrome downloads API detects
2. Extension shows consent notification
3. User clicks notification → File sent to local HTTP server
4. Local server calculates hash → Checks backend for duplicates
5. If no duplicate: Upload file to backend
6. If duplicate: Show duplicate alert with original filename
7. Extension shows success/duplicate notification

## Debug Mode
Enable detailed logging by adding this to any web page console:
```javascript
// Enable verbose logging
console.log = (...args) => console.info('[DDAS]', ...args);
```

## Support
If issues persist:
1. Check all log files
2. Verify all services are running on correct ports
3. Test each component individually using the provided test functions
4. Check Chrome permissions and notification settings
