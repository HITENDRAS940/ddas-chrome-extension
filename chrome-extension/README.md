# DDAS Chrome Extension

Beautiful Chrome Extension for detecting duplicate file downloads in real-time.

## Features

- 📁 Manual file upload and duplicate checking
- 🔔 Automatic download monitoring with notifications
- 📊 Status history with visual feedback
- 🎨 Modern, elegant UI with smooth animations
- 💾 Local storage for history

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select this `chrome-extension` folder
5. The DDAS icon will appear in your Chrome toolbar

## Usage

### Manual File Check
1. Click the DDAS extension icon
2. Click "Choose File" button
3. Select a file from your computer
4. Wait for processing (shows spinner)
5. View result:
   - ✅ Green card = New file stored successfully
   - ⚠️ Yellow card = Duplicate detected

### Automatic Monitoring
- Extension automatically detects when you download files
- Shows browser notification when download completes
- Click extension to manually check the downloaded file

## Configuration

Edit `popup.js` to change:

```javascript
// Backend API URL
const API_BASE_URL = 'http://localhost:8080/api/files';

// User ID (in production, get from authentication)
const USER_ID = 'user_demo_001';
```

## Files

- `manifest.json` - Extension configuration and permissions
- `popup.html` - Main UI (beautiful gradient design)
- `popup.js` - Frontend logic and API calls
- `background.js` - Download monitoring service worker
- `icons/` - Extension icons (16x16, 48x48, 128x128)

## Permissions

- `downloads` - Monitor file downloads
- `storage` - Save status history locally
- `http://localhost:8080/*` - Access backend API

## Troubleshooting

### Extension doesn't load
- Make sure all files are in the same folder
- Check Chrome console for errors
- Verify manifest.json is valid JSON

### Can't upload files
- Ensure backend is running on http://localhost:8080
- Check browser console (F12) for errors
- Verify CORS is enabled on backend

### Downloads not monitored
- Check if `downloads` permission is granted
- Look for notifications (may need to enable Chrome notifications)

## Development

To modify the UI:
1. Edit `popup.html` (structure) or styles in `<style>` tag
2. Edit `popup.js` (behavior)
3. Click refresh icon on `chrome://extensions/` to reload

## Future Enhancements

- [ ] User authentication with login screen
- [ ] Settings page for API configuration
- [ ] Automatic file upload on download
- [ ] File category filtering
- [ ] Dark mode toggle
- [ ] Advanced statistics dashboard
# DDAS - Data Duplication Alert System

A full-stack application that detects duplicate file downloads using SHA-256 hash comparison with cloud storage.

## 🎯 Features

- **Real-time Duplicate Detection**: Automatically detects duplicate files using SHA-256 hash comparison
- **Cloud Storage**: Stores only hash text files in AWS S3 (not the actual files)
- **User Isolation**: Each user's data is stored in their own S3 folder
- **Beautiful Chrome Extension**: Modern UI with real-time alerts
- **PostgreSQL Database**: Stores file metadata for quick lookups
- **REST API**: Spring Boot backend with comprehensive endpoints

## 🏗️ Architecture

### Backend (Spring Boot)
- **Java 21** with Spring Boot 3.5.7
- **PostgreSQL** for metadata storage
- **AWS S3** for hash file storage
- **SHA-256** hashing algorithm
- **Maven** build tool

### Frontend (Chrome Extension)
- Modern, elegant UI with smooth animations
- Real-time file upload and duplicate detection
- Download monitoring with notifications
- Status history with local storage

## 📋 Prerequisites

1. **Java 21** or higher
2. **PostgreSQL** database
3. **AWS Account** with S3 access
4. **Maven** (included via wrapper)
5. **Chrome Browser** for extension

## 🚀 Setup Instructions

### 1. Database Setup

```sql
-- Create PostgreSQL database
CREATE DATABASE ddas_db;

-- The application will auto-create tables on first run
```

### 2. AWS S3 Setup

```bash
# Create S3 bucket
aws s3 mb s3://ddas-hash-files

# Configure AWS credentials (choose one method):

# Option 1: AWS CLI
aws configure

# Option 2: Environment variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key

# Option 3: IAM Role (if running on EC2)
```

### 3. Backend Configuration

Update `src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/ddas_db
spring.datasource.username=YOUR_DB_USERNAME
spring.datasource.password=YOUR_DB_PASSWORD

# AWS S3
aws.s3.bucket-name=ddas-hash-files
aws.s3.region=ap-south-1
```

### 4. Run Backend

```bash
# Using Maven wrapper (recommended)
./mvnw clean install
./mvnw spring-boot:run

# Or using installed Maven
mvn clean install
mvn spring-boot:run
```

Backend will start on `http://localhost:8080`

### 5. Install Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. The DDAS extension icon should appear in your toolbar

## 📡 API Endpoints

### Upload File
```http
POST /api/files/upload
Content-Type: multipart/form-data

Parameters:
- file: MultipartFile (the file to upload)
- userId: String (user identifier)

Response (201 Created - New File):
{
  "duplicate": false,
  "message": "✅ File stored successfully!",
  "fileName": "document.pdf",
  "fileHash": "a1b2c3d4...",
  "existingFileUrl": "s3://ddas-hash-files/user_001/hash_uuid.txt"
}

Response (409 Conflict - Duplicate):
{
  "duplicate": true,
  "message": "⚠️ Duplicate file detected! This file already exists.",
  "fileName": "document.pdf",
  "fileHash": "a1b2c3d4...",
  "existingFileUrl": "s3://ddas-hash-files/user_001/hash_existing.txt"
}
```

### List User Files
```http
GET /api/files/all?userId={userId}

Response (200 OK):
[
  {
    "id": 1,
    "originalFileName": "document.pdf",
    "hashFileUrl": "s3://ddas-hash-files/user_001/hash_uuid.txt",
    "createdAt": "2025-10-25T10:30:00"
  }
]
```

### Health Check
```http
GET /api/files/health

Response (200 OK):
"DDAS API is running! ✅"
```

## 🎨 Using the Chrome Extension

1. **Manual Upload**:
   - Click the DDAS extension icon
   - Click "Choose File"
   - Select a file to check
   - Wait for the result (duplicate or success)

2. **Automatic Monitoring**:
   - Download any file in Chrome
   - Extension will show a notification
   - Click extension to manually check the file

3. **View History**:
   - Extension shows last 5 processed files
   - Green cards = New files stored
   - Yellow cards = Duplicates detected

## 🔄 How It Works

1. **User uploads/downloads a file**
2. **Extension sends file to backend** (`POST /api/files/upload`)
3. **Backend generates SHA-256 hash** of the file content
4. **System checks database** for existing hash
5. **If duplicate found**:
   - Returns existing file info
   - Status: 409 Conflict
6. **If unique file**:
   - Creates `.txt` file with hash content
   - Uploads to S3: `s3://ddas-hash-files/{userId}/hash_{uuid}.txt`
   - Saves metadata to PostgreSQL
   - Status: 201 Created
7. **Extension displays result** with beautiful UI notification

## 📁 S3 Storage Structure

```
s3://ddas-hash-files/
├── user_001/
│   ├── hash_abc123.txt (contains: "a1b2c3d4e5f6...")
│   ├── hash_def456.txt (contains: "7g8h9i0j1k2l...")
│   └── ...
├── user_002/
│   ├── hash_xyz789.txt
│   └── ...
└── ...
```

## 🔐 Future Enhancements (Authentication)

Currently uses demo user ID. To add authentication:

1. **Add Spring Security** + JWT
2. **Implement login/register** endpoints
3. **Generate unique userId** per user
4. **Update Chrome Extension**:
   - Add login screen
   - Store JWT token
   - Send token with each request
5. **Backend validates token** and extracts userId

## 🧪 Testing

### Test Backend Manually

```bash
# Health check
curl http://localhost:8080/api/files/health

# Upload file
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@/path/to/test.pdf" \
  -F "userId=user_test_001"

# List files
curl "http://localhost:8080/api/files/all?userId=user_test_001"
```

### Test Duplicate Detection

1. Upload the same file twice
2. First upload: Should return `"duplicate": false`
3. Second upload: Should return `"duplicate": true`

## 📦 Project Structure

```
DDAS/
├── src/main/java/com/hitendra/ddas/
│   ├── config/           # AWS S3, CORS configuration
│   ├── controller/       # REST API endpoints
│   ├── dto/             # Data Transfer Objects
│   ├── entity/          # JPA entities
│   ├── repository/      # Database repositories
│   ├── service/         # Business logic
│   └── DdasApplication.java
├── chrome-extension/
│   ├── manifest.json    # Extension configuration
│   ├── popup.html       # UI
│   ├── popup.js         # Frontend logic
│   ├── background.js    # Download monitoring
│   └── icons/           # Extension icons
└── pom.xml             # Maven dependencies
```

## 🛠️ Technologies Used

### Backend
- Spring Boot 3.5.7
- Spring Data JPA
- PostgreSQL
- AWS SDK for Java (S3)
- Lombok
- Maven

### Frontend
- HTML5 + CSS3
- Vanilla JavaScript
- Chrome Extension APIs
- Modern UI with animations

## 📝 License

MIT License - Feel free to use and modify!

## 👨‍💻 Author

Built with ❤️ for efficient file management

## 🐛 Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify database credentials in `application.properties`
- Ensure Java 21 is installed: `java -version`

### Extension can't connect to backend
- Ensure backend is running on `http://localhost:8080`
- Check Chrome console for CORS errors
- Verify extension has correct permissions

### AWS S3 errors
- Check AWS credentials are configured
- Verify S3 bucket exists and you have permissions
- Check bucket name in `application.properties`

### Database errors
- Ensure PostgreSQL is running: `pg_isready`
- Check database exists: `psql -l`
- Verify credentials and connection string

## 📞 Support

For issues or questions, please check:
1. Backend logs in console
2. Chrome extension console (right-click extension → Inspect popup)
3. PostgreSQL logs
4. AWS CloudWatch logs (if deployed)

