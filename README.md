# 🚀 DDAS - Data Duplication Alert System

> **A Smart Chrome Extension for Intelligent Download Management**

DDAS (Data Duplication Alert System) is a comprehensive file duplication detection system that automatically monitors your downloads and helps you identify and manage duplicate files. Built with a Chrome extension frontend, Spring Boot backend, Python middleware, and AWS cloud integration.

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.7-brightgreen)
![Python](https://img.shields.io/badge/Python-3.x-yellow)

---

## 📋 Table of Contents

- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Extension](#-running-the-extension)
- [Usage Guide](#-usage-guide)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Technologies Used](#-technologies-used)
- [Troubleshooting](#-troubleshooting)
- [Contributors](#-contributors)

---

## ✨ Features

### 🎯 Core Features

1. **Automatic Download Monitoring**
   - Real-time detection of file downloads in Chrome
   - Background service worker continuously monitors downloads
   - Instant processing of downloaded files

2. **Intelligent Duplicate Detection**
   - SHA-256 hash-based file comparison
   - Accurate duplicate identification regardless of filename
   - Fast hash computation for large files

3. **User-Controlled File Management**
   - Interactive popup notifications for duplicate files
   - Choice to keep or delete duplicate downloads
   - Skip option for manual handling

4. **Secure Authentication System**
   - JWT-based authentication
   - Email verification with OTP
   - Secure password encryption
   - Session management

5. **Download History & Activity Tracking**
   - Recent downloads history in popup
   - Pending file actions queue
   - Activity timestamps and file details

6. **Cloud Storage Integration**
   - AWS S3 integration for scalable file storage
   - Automatic file backup
   - Secure file retrieval

7. **Account Management**
   - User registration and login
   - Account deletion capability
   - Profile management

8. **Cross-Platform Communication**
   - HTTP-based communication between extension and local server
   - RESTful API for backend integration
   - CORS-enabled for secure cross-origin requests

### 🔥 Advanced Features

- **Real-time Badge Notifications**: Extension badge shows pending file actions count
- **Skip File Processing**: Users can choose to skip duplicate detection for specific files
- **Duplicate File Auto-Delete**: Option to automatically delete duplicate downloads
- **Recent Activity Timeline**: View all recent file processing activities
- **Multi-tab Support**: Works seamlessly across multiple browser tabs
- **Service Worker Persistence**: Extension stays active in the background

---

## 🏗️ System Architecture

DDAS consists of four main components working together:

```
┌─────────────────────────────────────────────────────────────┐
│                    CHROME EXTENSION                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Background  │  │    Popup     │  │   Content    │     │
│  │   Worker     │  │   Interface  │  │   Scripts    │     │
│  └──────┬───────┘  └──────────────┘  └──────────────┘     │
└─────────┼──────────────────────────────────────────────────┘
          │ HTTP (localhost:5001)
          ▼
┌─────────────────────────────────────────────────────────────┐
│              PYTHON LOCAL SERVER (Port 5001)                │
│  • File Processing Middleware                               │
│  • SHA-256 Hash Calculation                                 │
│  • Duplicate File Deletion                                  │
│  • Request Routing to Backend                               │
└─────────┬───────────────────────────────────────────────────┘
          │ HTTP (localhost:8080)
          ▼
┌─────────────────────────────────────────────────────────────┐
│           SPRING BOOT BACKEND (Port 8080)                   │
│  • User Authentication & Authorization                      │
│  • File Metadata Management                                 │
│  • Duplicate Detection Logic                                │
│  • Database Operations (PostgreSQL)                         │
│  • AWS S3 Integration                                       │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   AWS CLOUD SERVICES                        │
│  • S3: File Storage                                         │
│  • RDS: PostgreSQL Database                                 │
│  • IAM: Access Management                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Prerequisites

Before installing DDAS, ensure you have the following installed:

### Required Software

- **Java Development Kit (JDK) 17+**
  ```bash
  java -version
  ```

- **Python 3.x**
  ```bash
  python3 --version
  ```

- **Maven** (for building the Spring Boot backend)
  ```bash
  mvn -version
  ```

- **Google Chrome Browser** (latest version recommended)

- **PostgreSQL Database** (local or cloud)

### Optional

- **AWS Account** (for S3 storage integration)
- **Git** (for cloning the repository)

---

## 🔧 Installation

Follow these steps to set up DDAS on your machine:

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd deployed-ddas
```

### Step 2: Backend Setup (Spring Boot)

1. **Configure Database**

   Edit `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/ddas
   spring.datasource.username=your_db_username
   spring.datasource.password=your_db_password
   ```

2. **Configure AWS S3** (Optional)

   Add your AWS credentials to `application.properties`:
   ```properties
   aws.s3.bucket-name=your-bucket-name
   aws.access.key=your-access-key
   aws.secret.key=your-secret-key
   aws.region=your-region
   ```

3. **Build the Backend**
   ```bash
   ./mvnw clean install
   ```

### Step 3: Python Server Setup

1. **Install Python Dependencies**
   ```bash
   pip3 install --break-system-packages -r requirements.txt
   ```

   Or using a virtual environment (recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

### Step 4: Chrome Extension Setup

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)

2. **Load the Extension**
   - Click "Load unpacked"
   - Select the `chrome-extension` folder from the project directory
   - The DDAS extension should now appear in your extensions list

3. **Pin the Extension** (Optional)
   - Click the puzzle icon in Chrome toolbar
   - Pin DDAS for easy access

---

## 🚀 Running the Extension

### Quick Start (Automated)

Use the provided start script to launch all services:

```bash
chmod +x start_ddas.sh
./start_ddas.sh
```

This script will:
1. Start the Python local server (Port 5001)
2. Start the Spring Boot backend (Port 8080)
3. Display service status

### Manual Start

If you prefer to start services manually:

1. **Start Python Local Server**
   ```bash
   python3 server.py
   ```
   Expected output:
   ```
   🚀 Starting DDAS Local HTTP Server...
   📡 Server will run on: http://localhost:5001
   🔗 Main endpoint: POST /process
   ❤️ Health check: GET /health
   ```

2. **Start Spring Boot Backend**
   ```bash
   ./mvnw spring-boot:run
   ```
   Or using the JAR file:
   ```bash
   java -jar target/DDAS-0.0.1-SNAPSHOT.jar
   ```

3. **Verify Services are Running**
   - Python Server: http://localhost:5001/health
   - Backend API: http://localhost:8080/api/health

### Stopping the Services

- Press `Ctrl+C` in each terminal to stop the respective service
- Or use the server manager:
  ```bash
  ./server_manager.sh stop
  ```

---

## 📖 Usage Guide

### First Time Setup

1. **Open the Extension**
   - Click the DDAS icon in your Chrome toolbar
   - You'll see the authentication screen

2. **Create an Account**
   - Click "Sign Up" tab
   - Enter your details:
     - Full Name
     - Email Address
     - Password
   - Click "Sign Up"

3. **Verify Email with OTP**
   - Check your email for the verification code
   - Enter the 6-digit OTP in the verification screen
   - Click "Verify OTP"

4. **Login**
   - After verification, enter your credentials
   - Click "Login"
   - You're now ready to use DDAS!

### Using DDAS

#### Downloading Files

1. **Download any file** in Chrome as you normally would
2. DDAS automatically monitors the download
3. The file is processed in the background

#### Handling Duplicate Files

When a duplicate is detected:

1. **Notification Appears** in the extension popup
   - Shows the duplicate file name
   - Displays the original file name it matches
   - Provides three options:
     - ✅ **Delete Duplicate**: Remove the newly downloaded file
     - ⏭️ **Skip**: Keep the file and dismiss the notification
     - ℹ️ **View Details**: See more information about the files

2. **Choose Your Action**
   - Click the appropriate button
   - DDAS processes your choice immediately

#### Viewing Activity

- **Recent Activity**: View your download history in the popup
- **Pending Actions**: See files waiting for your decision
- **Badge Count**: Extension badge shows number of pending actions

#### Managing Your Account

- **Logout**: Click the logout button in the popup
- **Delete Account**: 
  - Navigate to account settings
  - Click "Delete Account"
  - Confirm deletion
  - All your data will be permanently removed

---

## 🔌 API Endpoints

### Python Local Server (Port 5001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check endpoint |
| `/process` | POST | Process downloaded file |
| `/delete-duplicate` | POST | Delete duplicate file |

### Spring Boot Backend (Port 8080)

#### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | User registration |
| `/api/auth/verify-otp` | POST | Verify email OTP |
| `/api/auth/login` | POST | User login |
| `/api/auth/resend-otp` | POST | Resend OTP |
| `/api/auth/delete-account` | DELETE | Delete user account |

#### Files

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/files/upload` | POST | Upload file |
| `/api/files/check-hash/{hash}` | GET | Check if file hash exists |
| `/api/files/list` | GET | List user files |
| `/api/files/recent` | GET | Get recent files |
| `/api/files/{id}` | GET | Get file details |
| `/api/files/{id}` | DELETE | Delete file |

---

## 📁 Project Structure

```
deployed-ddas/
├── chrome-extension/           # Chrome Extension files
│   ├── manifest.json          # Extension manifest (v3)
│   ├── background_http.js     # Service worker (download monitoring)
│   ├── popup.html             # Extension popup UI
│   ├── popup.js               # Popup logic & user interaction
│   ├── icon16.png             # Extension icons
│   ├── icon48.png
│   └── icon128.png
│
├── src/                       # Spring Boot Backend
│   ├── main/
│   │   ├── java/com/hitendra/ddas/
│   │   │   ├── DdasApplication.java        # Main application
│   │   │   ├── config/                     # Configuration classes
│   │   │   │   ├── AwsS3Config.java       # AWS S3 config
│   │   │   │   ├── CorsConfig.java        # CORS config
│   │   │   │   ├── SecurityConfig.java    # Security config
│   │   │   │   └── ScheduledTasks.java    # Scheduled tasks
│   │   │   ├── controller/                 # REST controllers
│   │   │   │   ├── AuthController.java    # Authentication
│   │   │   │   └── FileController.java    # File operations
│   │   │   ├── dto/                        # Data Transfer Objects
│   │   │   ├── entity/                     # JPA Entities
│   │   │   ├── repository/                 # Database repositories
│   │   │   ├── security/                   # Security components
│   │   │   └── service/                    # Business logic
│   │   └── resources/
│   │       └── application.properties      # App configuration
│   └── test/                  # Unit tests
│
├── server.py                  # Python Local HTTP Server
├── requirements.txt           # Python dependencies
├── pom.xml                   # Maven configuration
├── start_ddas.sh             # Quick start script
├── server_manager.sh         # Server management script
├── setup.sh                  # Initial setup script
└── README.md                 # This file
```

---

## 🛠️ Technologies Used

### Frontend (Chrome Extension)
- **Manifest V3** - Latest Chrome Extension API
- **JavaScript ES6+** - Modern JavaScript
- **HTML5 & CSS3** - User interface
- **Chrome APIs** - downloads, storage, notifications

### Middleware (Python Server)
- **Flask 3.0** - Web framework
- **Flask-CORS 4.0** - Cross-origin resource sharing
- **Requests** - HTTP client library
- **Hashlib** - SHA-256 file hashing

### Backend (Spring Boot)
- **Java 17** - Programming language
- **Spring Boot 3.5.7** - Application framework
- **Spring Security** - Authentication & authorization
- **Spring Data JPA** - Database operations
- **PostgreSQL** - Relational database
- **JWT** - Token-based authentication
- **AWS SDK** - S3 integration
- **JavaMail** - Email & OTP functionality

### Cloud Services
- **AWS S3** - File storage
- **AWS RDS** - Database hosting
- **AWS IAM** - Access management

### Development Tools
- **Maven** - Build automation
- **Git** - Version control
- **IntelliJ IDEA / VS Code** - IDEs

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Extension Not Detecting Downloads

**Problem**: Files download but DDAS doesn't process them

**Solutions**:
- Verify Python server is running on port 5001
- Check if backend is running on port 8080
- Reload the extension: `chrome://extensions/` → Click reload icon
- Check console logs: Right-click extension → Inspect popup

#### 2. "Connection Refused" Error

**Problem**: Extension can't connect to local server

**Solutions**:
```bash
# Check if Python server is running
curl http://localhost:5001/health

# Check if backend is running
curl http://localhost:8080/api/health

# Restart services
./start_ddas.sh
```

#### 3. Authentication Failed

**Problem**: Login or signup not working

**Solutions**:
- Verify backend is running
- Check database connection in `application.properties`
- Verify email configuration for OTP
- Clear browser storage: DevTools → Application → Storage → Clear

#### 4. Flask Module Not Found

**Problem**: `ModuleNotFoundError: No module named 'flask'`

**Solution**:
```bash
pip3 install --break-system-packages -r requirements.txt
```

#### 5. Port Already in Use

**Problem**: "Address already in use" error

**Solutions**:
```bash
# Kill process on port 5001 (Python server)
lsof -ti:5001 | xargs kill -9

# Kill process on port 8080 (Spring Boot)
lsof -ti:8080 | xargs kill -9
```

#### 6. Database Connection Error

**Problem**: Backend can't connect to PostgreSQL

**Solutions**:
- Verify PostgreSQL is running: `pg_ctl status`
- Check database credentials in `application.properties`
- Create database if missing: `createdb ddas`

#### 7. Extension Badge Not Updating

**Problem**: Pending count not showing

**Solutions**:
- Reload the extension
- Check service worker: `chrome://extensions/` → Service worker → Inspect
- Clear storage and reload

### Checking Logs

**Python Server Logs**:
```bash
tail -f /Users/hitendrasingh/Desktop/DDAS/server.log
```

**Backend Logs**:
```bash
# Check console output where Spring Boot is running
```

**Extension Logs**:
- Right-click extension icon → Inspect popup → Console tab
- Or: `chrome://extensions/` → Service worker → Console

---

## 🤝 Contributors

**Developed by:**
- **Hitendra Singh** - Backend Development & System Architecture
- **Dhruv Maheshwari** - Extension Development & Integration

**Project Supervisor:** [Teacher Name]

**Institution:** [University/College Name]

**Year:** 2025

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🌟 Acknowledgments

- Chrome Extension documentation
- Spring Boot community
- Flask framework
- AWS documentation
- Stack Overflow community

---

## 📞 Support

For issues, questions, or contributions:

- **Issues**: Open an issue on GitHub
- **Email**: [your-email@example.com]
- **Documentation**: See `DDAS_COMPLETE_SYSTEM_FLOW.txt` for detailed flow

---

## 🔮 Future Enhancements

Potential features for future versions:

- [ ] Multi-browser support (Firefox, Edge)
- [ ] Advanced file comparison (content-based)
- [ ] File compression before upload
- [ ] Batch file operations
- [ ] File sharing between users
- [ ] Mobile app integration
- [ ] AI-based file categorization
- [ ] Automatic cloud backup scheduling
- [ ] File versioning system
- [ ] Advanced analytics dashboard

---

## 📊 Project Statistics

- **Lines of Code**: ~5000+
- **Files**: 50+
- **Technologies**: 15+
- **API Endpoints**: 12+
- **Features**: 20+

---

<div align="center">

**Made with ❤️ by Hitendra Singh & Dhruv Maheshwari**

⭐ Star this repo if you find it helpful!

</div>

