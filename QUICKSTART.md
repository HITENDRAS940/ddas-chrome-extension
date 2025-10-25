# 🚀 DDAS Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites Check

- ✅ Java 17+ installed (`java -version`)
- ✅ PostgreSQL running
- ✅ AWS account with credentials configured

## Step 1: Database Setup (1 minute)

```bash
# Create database
createdb ddas_db

# Or using psql
psql -U postgres -c "CREATE DATABASE ddas_db;"
```

## Step 2: AWS Configuration (2 minutes)

```bash
# Configure AWS credentials
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: ap-south-1  (Mumbai region for India)
# - Default output format: json

# Create S3 bucket in Mumbai region
aws s3 mb s3://ddas-hash-files --region ap-south-1
```

## Step 3: Configure Application (1 minute)

Edit `src/main/resources/application.properties`:

```properties
# Update these lines with your credentials:
spring.datasource.username=YOUR_POSTGRES_USERNAME
spring.datasource.password=YOUR_POSTGRES_PASSWORD
```

## Step 4: Run Backend (1 minute)

```bash
# Build and run
./mvnw spring-boot:run

# Wait for: "Started DdasApplication in X seconds"
# API available at: http://localhost:8080
```

## Step 5: Install Chrome Extension (30 seconds)

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select folder: `DDAS/chrome-extension`
5. Done! Look for DDAS icon in toolbar

## Step 6: Test It! (30 seconds)

1. Click DDAS extension icon
2. Click "Choose File"
3. Upload any file
4. See result: ✅ New file or ⚠️ Duplicate
5. Upload same file again → Should show duplicate!

## 🎉 You're Done!

The system is now:
- ✅ Monitoring your downloads
- ✅ Detecting duplicates
- ✅ Storing hashes in AWS S3
- ✅ Tracking metadata in PostgreSQL

## 🧪 Quick API Test

```bash
# Health check
curl http://localhost:8080/api/files/health

# Upload a file
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@/path/to/test.pdf" \
  -F "userId=user_demo_001"
```

## ⚠️ Troubleshooting

### Backend won't start?
- Check PostgreSQL: `pg_isready`
- Check port 8080: `lsof -i :8080`

### Extension can't connect?
- Backend running? Check http://localhost:8080/api/files/health
- CORS issue? Check browser console (F12)

### AWS errors?
- Credentials set? `aws s3 ls`
- Bucket exists? `aws s3 ls s3://ddas-hash-files`

## 📚 Next Steps

- Read full [README.md](README.md) for detailed documentation
- Customize UI in `chrome-extension/popup.html`
- Add authentication for production use
- Deploy to cloud (AWS, Azure, GCP)

---

**Need help?** Check the main README.md or Chrome extension console for errors.

