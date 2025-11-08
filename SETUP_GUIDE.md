# DDAS - Data Duplication Alert System
## Complete Setup Guide

This guide will walk you through setting up and running the DDAS system from scratch.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Setup](#backend-setup)
4. [Local HTTP Server Setup](#local-http-server-setup)
5. [Chrome Extension Setup](#chrome-extension-setup)
6. [Running the System](#running-the-system)
7. [Testing the System](#testing-the-system)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software
- **Java 17 or higher** - for Spring Boot backend
- **Maven 3.6+** - for building the backend
- **PostgreSQL 12+** - for database
- **Python 3.8+** - for local HTTP server
- **Google Chrome** - for the extension
- **AWS Account** - for S3 storage (free tier is sufficient)

### Check Installed Versions
```bash
java -version          # Should show Java 17+
mvn -version           # Should show Maven 3.6+
psql --version         # Should show PostgreSQL 12+
python3 --version      # Should show Python 3.8+
```

---

## 🗄️ Database Setup

### 1. Start PostgreSQL
```bash
# macOS (if using Homebrew)
brew services start postgresql@14

# Or manually
postgres -D /usr/local/var/postgres
```

### 2. Create Database
```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE ddas_db;
CREATE USER postgres WITH PASSWORD '12344321';
GRANT ALL PRIVILEGES ON DATABASE ddas_db TO postgres;

# Exit psql
\q
```

### 3. Verify Database Connection
```bash
psql -U postgres -d ddas_db -h localhost
# Enter password: 12344321
# If connected successfully, type \q to exit
```

---

## 🚀 Backend Setup

### 1. Configure AWS S3 (First Time Only)
```bash
# Install AWS CLI if not installed
brew install awscli

# Configure AWS credentials
aws configure
# Enter your:
#   AWS Access Key ID
#   AWS Secret Access Key
#   Default region: ap-south-1
#   Default output format: json
```

### 2. Update Application Properties (if needed)
The backend configuration is in: `src/main/resources/application.properties`

**Default settings:**
- **Port:** 8080
- **Database:** localhost:5432/ddas_db
- **S3 Bucket:** ddas-hash-files (region: ap-south-1)
- **Email:** testm2327@gmail.com (for OTP)

### 3. Build the Backend
```bash
cd /Users/hitendrasingh/Desktop/DDAS

# Build the project (skip tests for faster build)
./mvnw clean package -DskipTests

# Or build with tests
./mvnw clean package
```

---

## 🌐 Local HTTP Server Setup

### 1. Install Python Dependencies
```bash
cd /Users/hitendrasingh/Desktop/DDAS

# Install required packages
pip3 install flask flask-cors requests
```

### 2. Verify Server Configuration
The server is configured in `server.py`:
- **Port:** 5001 (to avoid macOS AirPlay conflict)
- **Backend API:** http://localhost:8080/api
- **Log File:** server.log

---

## 🔌 Chrome Extension Setup

### 1. Prepare Extension Icons
```bash
cd /Users/hitendrasingh/Desktop/DDAS/chrome-extension

# Run the icon creation script
./setup_icons.sh
```

### 2. Load Extension in Chrome

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Navigate to: `/Users/hitendrasingh/Desktop/DDAS/chrome-extension`
5. Click **Select**

### 3. Verify Extension
- You should see "DDAS - Data Duplication Alert System (HTTP)" in your extensions
- Extension should show a blue icon with "D"
- Click the extension icon to open the popup

---

## ▶️ Running the System

### Start Everything in the Correct Order

#### Step 1: Start PostgreSQL (if not already running)
```bash
brew services start postgresql@14
# Or check status: brew services list
```

#### Step 2: Start Backend Server
```bash
cd /Users/hitendrasingh/Desktop/DDAS

# Run the backend
./mvnw spring-boot:run

# Backend should start on http://localhost:8080
# Wait for message: "Started DdasApplication in X seconds"
```

Keep this terminal open. Open a **new terminal** for the next step.

#### Step 3: Start Local HTTP Server
```bash
cd /Users/hitendrasingh/Desktop/DDAS

# Run the local server
python3 server.py

# Server should start on http://localhost:5001
# Wait for message: "Running on http://127.0.0.1:5001"
```

Keep this terminal open as well.

#### Step 4: Verify Extension
- Open Chrome
- Click the DDAS extension icon
- You should see the login/signup interface
- Extension service worker should connect to the local server

---

## 🧪 Testing the System

### 1. Create an Account

1. Click the DDAS extension icon in Chrome
2. Click **Sign Up**
3. Enter:
   - Username: `testuser`
   - Email: `your-email@example.com`
   - Password: `password123`
4. Click **Sign Up**
5. Check your email for OTP code
6. Enter the OTP to verify your account

### 2. Login

1. Click the DDAS extension icon
2. Click **Login**
3. Enter your credentials
4. You should see: "Welcome, testuser!"

### 3. Test File Upload

1. **Download a file** (any file from the internet)
2. **Wait 2-3 seconds** after download completes
3. You should see a **notification**: "DDAS - Check File for Duplicates?"
4. **Click the notification** to consent
5. Extension will process the file and show one of these:
   - ✅ "File processed successfully" (if new file)
   - ⚠️ "Duplicate file found" (if file already exists)

### 4. Test Duplicate Detection

1. Download the **same file again**
2. Click the consent notification
3. You should see: **"🚨 DUPLICATE FILE DETECTED!"**
4. Notification will show the original filename

---

## 🐛 Troubleshooting

### Backend Issues

#### Backend won't start
```bash
# Check if port 8080 is already in use
lsof -i :8080

# If something is using it, kill the process
kill -9 <PID>

# Or change the port in application.properties:
server.port=8081
```

#### Database connection error
```bash
# Verify PostgreSQL is running
brew services list | grep postgresql

# Test database connection
psql -U postgres -d ddas_db -h localhost

# Check password in application.properties matches
```

#### AWS S3 errors
```bash
# Verify AWS credentials
aws s3 ls

# Reconfigure if needed
aws configure
```

### Local Server Issues

#### Server won't start (port conflict)
```bash
# Check if port 5001 is in use
lsof -i :5001

# Kill the process if needed
kill -9 <PID>

# Or edit server.py and change:
# app.run(host='127.0.0.1', port=5002)
# Then update manifest.json: "http://localhost:5002/*"
```

#### Python dependencies missing
```bash
pip3 install --upgrade flask flask-cors requests
```

### Extension Issues

#### Extension won't load (icon error)
```bash
cd /Users/hitendrasingh/Desktop/DDAS/chrome-extension

# Recreate icons
./setup_icons.sh

# Reload extension in chrome://extensions/
```

#### Extension shows "Server Offline"
1. Check if local server is running (http://localhost:5001/health)
2. Check browser console (F12 → Console tab)
3. Verify host_permissions in manifest.json includes localhost:5001

#### No popup after download
1. Open Chrome DevTools (F12)
2. Go to **Console** tab
3. Download a file and watch for messages
4. Common issues:
   - User not logged in → Login first
   - Service worker inactive → Reload extension
   - Server not connected → Check server.py is running

#### Notification errors
Make sure all notification calls have required fields:
- `type: 'basic'`
- `iconUrl: 'icon128.png'`
- `title: 'Some title'`
- `message: 'Some message'`

---

## 📁 File Structure

```
DDAS/
├── src/main/java/com/hitendra/ddas/    # Backend Java code
├── src/main/resources/
│   └── application.properties          # Backend configuration
├── chrome-extension/
│   ├── manifest.json                   # Extension manifest
│   ├── background_http.js              # Service worker
│   ├── popup.html                      # Extension popup UI
│   ├── popup.js                        # Popup logic
│   ├── icon16.png                      # Extension icons
│   ├── icon48.png
│   ├── icon128.png
│   └── setup_icons.sh                  # Icon creation script
├── server.py                           # Local HTTP server
├── pom.xml                             # Maven configuration
└── SETUP_GUIDE.md                      # This file
```

---

## 🔄 Startup Checklist

Every time you want to use DDAS:

- [ ] PostgreSQL is running
- [ ] Backend server is running (`./mvnw spring-boot:run`)
- [ ] Local HTTP server is running (`python3 server.py`)
- [ ] Chrome extension is loaded and enabled
- [ ] User is logged in to the extension

---

## 📝 Quick Start Commands

```bash
# Terminal 1: Start Backend
cd /Users/hitendrasingh/Desktop/DDAS
./mvnw spring-boot:run

# Terminal 2: Start Local Server
cd /Users/hitendrasingh/Desktop/DDAS
python3 server.py

# Then use Chrome extension normally
```

---

## 🆘 Getting Help

### Check Logs

**Backend logs:**
```bash
# Backend outputs to console where you ran ./mvnw spring-boot:run
# Look for errors in red text
```

**Local server logs:**
```bash
# Server outputs to console and to server.log
tail -f /Users/hitendrasingh/Desktop/DDAS/server.log
```

**Extension logs:**
```bash
# In Chrome:
# 1. Go to chrome://extensions/
# 2. Find DDAS extension
# 3. Click "service worker" link
# 4. View console output
```

### Common Error Messages

| Error | Solution |
|-------|----------|
| "Backend failed to start" | Check PostgreSQL is running, check port 8080 is free |
| "Local server is not available" | Start server.py in a terminal |
| "Login Required" | Click extension icon and login |
| "Server not responding" | Restart both backend and server.py |
| "Database connection error" | Verify PostgreSQL credentials in application.properties |

---

## ✅ System is Working When...

- ✅ Backend shows: `Started DdasApplication`
- ✅ Server shows: `Running on http://127.0.0.1:5001`
- ✅ Extension icon appears in Chrome toolbar
- ✅ Extension popup shows login/signup or user info
- ✅ Download triggers a consent notification
- ✅ Clicking notification processes the file

---

## 🎯 Success!

If you can:
1. Login to the extension
2. Download a file
3. See the consent notification
4. Click it and see "File processed successfully"
5. Download the same file again and see "Duplicate detected"

**Congratulations! Your DDAS system is working perfectly! 🎉**

---

## 📧 Support

For issues or questions:
- Check the troubleshooting section above
- Review console logs in all three components
- Verify all services are running with correct ports

---

*Last updated: November 8, 2025*

