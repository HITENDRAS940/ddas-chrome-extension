# 🚀 DDAS Startup Guide - Start Everything in the Right Order

## 📋 What You Need to Start (In Order)

### Step 1: Start PostgreSQL Database
```bash
# Start PostgreSQL (choose one that works for your setup)
brew services start postgresql@14
# OR
pg_ctl -D /usr/local/var/postgres start
# OR
sudo service postgresql start
```

### Step 2: Start Spring Boot Backend
```bash
cd /Users/hitendrasingh/Desktop/DDAS
./run_backend.sh start
```
**Wait for**: "✅ Backend is ready and responding!"

### Step 3: Start Native Host
```bash
cd /Users/hitendrasingh/Desktop/DDAS
./native_ctrl.sh start
```
**You should see**: Ready message from native host

### Step 4: Load Chrome Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select folder: `/Users/hitendrasingh/Desktop/DDAS/chrome-extension/`
5. **Extension should show "DDAS - Ready" notification**

### Step 5: Login to Extension
1. Click the DDAS extension icon in Chrome toolbar
2. Sign up or login with your credentials
3. Verify your email if it's a new account

## 🧪 Test the System

### Simple Test:
1. **Download any file** from the internet (PDF, image, document)
2. **Should see notification**: "filename - Click to check for duplicates"
3. **Click the notification** to process the file
4. **Result**: Either "duplicate found" or "upload successful"

## 📁 Required Files (Cleaned Up)

Your project now has only essential files:

```
DDAS/
├── STARTUP_GUIDE.md                 ← This file
├── run_backend.sh                   ← Start backend
├── native_ctrl.sh                  ← Start/stop native host (FIXED)
├── native_host_simple.py           ← Native messaging script
├── com.ddas.file_uploader.json     ← Native messaging config
├── chrome-extension/               ← Chrome extension
│   ├── manifest.json
│   ├── background_simple.js
│   ├── popup.html
│   └── popup.js
├── src/                           ← Spring Boot backend
├── pom.xml                        ← Maven config
├── backend.log                    ← Backend logs
└── native_host_debug.log          ← Native host logs
```

## 🔧 Management Commands

### Backend:
```bash
./run_backend.sh start     # Start backend
./run_backend.sh stop      # Stop backend
./run_backend.sh status    # Check status
./run_backend.sh logs      # View logs
```

### Native Host:
```bash
./native_ctrl.sh start   # Start native host
./native_ctrl.sh stop    # Stop native host
./native_ctrl.sh status  # Check status
./native_ctrl.sh logs    # View debug logs
```

## 🐛 Troubleshooting

### Problem: Backend won't start
```bash
# Check if port 8080 is in use
lsof -i:8080

# Kill process using port 8080
lsof -ti:8080 | xargs kill -9

# Restart backend
./run_backend.sh restart
```

### Problem: Extension not connecting
1. Check Service Worker console: `chrome://extensions/` → DDAS → Service Worker
2. Should see: "🔗 Connecting to native host" and "📨 Native message received"
3. If not, reload extension and check backend is running

### Problem: No popup after download
1. Check if you're logged in through extension popup
2. Download notification should appear immediately
3. Check Service Worker console for download events

### Problem: "Native host disconnected"
1. **This is normal** - extension works in fallback mode
2. Downloads still detected, just no duplicate checking
3. Backend logs available in `backend.log`

## ✅ System Health Check

Run these commands to verify everything is working:

```bash
# 1. Check backend
curl http://localhost:8080/api/health

# 2. Check processes
./run_backend.sh status
./native_ctrl.sh status

# 3. Check extension
# Go to chrome://extensions/ - DDAS should be loaded and active
```

## 🎯 Normal Operation

**Daily startup routine:**
1. `./run_backend.sh start` (wait for "Backend is ready")
2. `./native_ctrl.sh start` (should see ready message)
3. Ensure Chrome extension is loaded
4. Login through extension popup
5. Download files - system works automatically

**System will:**
- ✅ Detect all downloads automatically
- ✅ Show consent notifications
- ✅ Process files when you click notifications
- ✅ Alert you to duplicates
- ✅ Store file hashes for future detection

**That's it! The system is now simplified and should work reliably.** 🎉
