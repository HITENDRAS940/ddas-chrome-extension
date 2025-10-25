# 🧪 DDAS Testing Guide

Complete testing procedures for the Data Duplication Alert System.

## Backend API Tests

### 1. Health Check Test
```bash
curl http://localhost:8080/api/files/health
# Expected: "DDAS API is running! ✅"
```

### 2. File Upload Test (First Upload - Should Succeed)
```bash
# Create a test file
echo "This is a test file content" > test-file.txt

# Upload it
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@test-file.txt" \
  -F "userId=user_test_001" \
  -v

# Expected Response (201 Created):
# {
#   "duplicate": false,
#   "message": "✅ File stored successfully!",
#   "fileName": "test-file.txt",
#   "fileHash": "a1b2c3d4...",
#   "existingFileUrl": "s3://ddas-hash-files/user_test_001/hash_xxxxx.txt"
# }
```

### 3. Duplicate Detection Test (Second Upload - Should Detect Duplicate)
```bash
# Upload the SAME file again
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@test-file.txt" \
  -F "userId=user_test_001" \
  -v

# Expected Response (409 Conflict):
# {
#   "duplicate": true,
#   "message": "⚠️ Duplicate file detected! This file already exists.",
#   "fileName": "test-file.txt",
#   "fileHash": "a1b2c3d4...",
#   "existingFileUrl": "s3://ddas-hash-files/user_test_001/hash_xxxxx.txt"
# }
```

### 4. List User Files Test
```bash
curl "http://localhost:8080/api/files/all?userId=user_test_001" | jq

# Expected Response (200 OK):
# [
#   {
#     "id": 1,
#     "originalFileName": "test-file.txt",
#     "hashFileUrl": "s3://ddas-hash-files/user_test_001/hash_xxxxx.txt",
#     "createdAt": "2025-10-25T10:30:00"
#   }
# ]
```

### 5. User Isolation Test
```bash
# Upload same file with different userId
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@test-file.txt" \
  -F "userId=user_test_002"

# Expected: Should NOT detect duplicate (different user)
# Response should be 201 Created (new file)
```

### 6. Different File Test
```bash
# Create different file
echo "This is a DIFFERENT file" > test-file-2.txt

# Upload it
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@test-file-2.txt" \
  -F "userId=user_test_001"

# Expected: 201 Created (different hash)
```

## Database Verification

### Check PostgreSQL Data
```sql
-- Connect to database
psql -U postgres -d ddas_db

-- View all records
SELECT id, user_id, original_file_name, 
       LEFT(file_hash, 16) as hash_preview,
       created_at 
FROM file_records 
ORDER BY created_at DESC;

-- Count files per user
SELECT user_id, COUNT(*) as file_count 
FROM file_records 
GROUP BY user_id;

-- Check for duplicates (should be none)
SELECT file_hash, COUNT(*) as count 
FROM file_records 
WHERE user_id = 'user_test_001'
GROUP BY file_hash 
HAVING COUNT(*) > 1;
```

## AWS S3 Verification

### Check S3 Bucket Contents
```bash
# List all files in bucket
aws s3 ls s3://ddas-hash-files/ --recursive

# Expected output:
# user_test_001/hash_abc123.txt
# user_test_001/hash_def456.txt
# user_test_002/hash_xyz789.txt

# View content of a hash file
aws s3 cp s3://ddas-hash-files/user_test_001/hash_abc123.txt - 

# Expected: SHA-256 hash string (64 characters)
```

## Chrome Extension Tests

### Manual Upload Test
1. Click DDAS extension icon
2. Click "Choose File"
3. Select `test-file.txt`
4. Wait for processing (spinner should appear)
5. Verify green success card appears
6. Upload SAME file again
7. Verify yellow duplicate card appears

### Download Monitoring Test
1. Download any file from internet
2. Check for browser notification: "DDAS - File Downloaded"
3. Click extension icon
4. Manually upload the downloaded file
5. Verify detection works

### UI Behavior Test
1. **Loader**: Should show spinner during upload
2. **Success Card**: Green border, checkmark icon
3. **Duplicate Card**: Yellow background, warning icon
4. **History**: Should show last 5 uploads
5. **User ID**: Should display current user ID

### Storage Test
```javascript
// Open Chrome DevTools Console on extension popup
// Check local storage
chrome.storage.local.get(['statusHistory'], (data) => {
  console.log('History:', data.statusHistory);
});
```

## Integration Tests

### End-to-End Test Flow
```bash
# 1. Start backend
./mvnw spring-boot:run

# 2. Wait for startup
sleep 10

# 3. Test health
curl http://localhost:8080/api/files/health

# 4. Create test files
echo "Test content 1" > file1.txt
echo "Test content 2" > file2.txt

# 5. Upload file1 twice (should detect duplicate on second)
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@file1.txt" -F "userId=test_user"
  
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@file1.txt" -F "userId=test_user"

# 6. Upload file2 (should succeed)
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@file2.txt" -F "userId=test_user"

# 7. List files
curl "http://localhost:8080/api/files/all?userId=test_user"

# 8. Verify S3
aws s3 ls s3://ddas-hash-files/test_user/

# 9. Verify DB
psql -U postgres -d ddas_db -c "SELECT * FROM file_records WHERE user_id='test_user';"
```

## Performance Tests

### Large File Test
```bash
# Create 10MB file
dd if=/dev/urandom of=large-file.bin bs=1M count=10

# Upload (test hash generation performance)
time curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@large-file.bin" -F "userId=perf_test"

# Should complete in < 5 seconds
```

### Concurrent Upload Test
```bash
# Upload same file from multiple terminals simultaneously
for i in {1..5}; do
  (curl -X POST http://localhost:8080/api/files/upload \
    -F "file=@test-file.txt" -F "userId=concurrent_test" &)
done

# Check DB - should have only ONE record (no race condition)
psql -U postgres -d ddas_db -c \
  "SELECT COUNT(*) FROM file_records WHERE user_id='concurrent_test';"
```

## Error Handling Tests

### Invalid File Test
```bash
# Upload empty file
touch empty-file.txt
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@empty-file.txt" -F "userId=error_test"

# Expected: 400 Bad Request
```

### Missing Parameters Test
```bash
# Missing userId
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@test-file.txt"

# Expected: 400 Bad Request
```

### Invalid S3 Credentials Test
```bash
# Temporarily set invalid AWS credentials
export AWS_ACCESS_KEY_ID=invalid
export AWS_SECRET_ACCESS_KEY=invalid

# Restart app and try upload
# Expected: 500 Internal Server Error with clear message
```

## Success Criteria

✅ All tests should pass:
- Health check returns 200
- First upload returns 201 (Created)
- Duplicate upload returns 409 (Conflict)
- Different users don't interfere
- S3 contains hash text files
- PostgreSQL contains metadata
- Chrome extension displays correct UI
- History persists across popup closes

## Troubleshooting Failed Tests

### Backend Tests Fail
- Check logs: `tail -f logs/spring.log`
- Verify DB connection: `psql -U postgres -d ddas_db`
- Check AWS credentials: `aws sts get-caller-identity`

### Extension Tests Fail
- Open DevTools on popup (right-click → Inspect)
- Check console for JavaScript errors
- Verify API URL in `popup.js`

### S3 Tests Fail
- Check bucket exists: `aws s3 ls | grep ddas`
- Verify permissions: `aws s3api get-bucket-acl --bucket ddas-hash-files`
- Test write access: `echo "test" | aws s3 cp - s3://ddas-hash-files/test.txt`

---

**After Testing**: Clean up test data
```bash
# Delete test files from S3
aws s3 rm s3://ddas-hash-files/ --recursive

# Clear database
psql -U postgres -d ddas_db -c "TRUNCATE file_records RESTART IDENTITY;"
```

