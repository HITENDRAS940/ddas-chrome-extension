# 🪣 AWS S3 Bucket Access Guide for DDAS

Complete guide to access, view, and manage your DDAS hash files in AWS S3.

---

## 🎯 Quick Access Methods

### Method 1: AWS Management Console (Web Browser) - Easiest

1. **Login to AWS Console**
   - Go to: https://console.aws.amazon.com/
   - Enter your AWS account credentials

2. **Navigate to S3**
   - Search for "S3" in the top search bar
   - Click on "S3" service

3. **Find Your Bucket**
   - Look for bucket name: `ddas-hash-files`
   - Click on the bucket name

4. **Browse Files**
   - You'll see folders for each user: `user_demo_001/`, `user_test_001/`, etc.
   - Click on a folder to see hash files: `hash_abc123.txt`, `hash_xyz789.txt`
   - Click on any file to view/download it

5. **View File Contents**
   - Select a hash file
   - Click "Download" or "Open" to see the SHA-256 hash inside

---

### Method 2: AWS CLI (Command Line) - Developer Friendly

#### Setup AWS CLI (One-time)

```bash
# Install AWS CLI (if not installed)
# macOS:
brew install awscli

# Or download from: https://aws.amazon.com/cli/

# Configure AWS credentials
aws configure
# Enter:
#   AWS Access Key ID: YOUR_ACCESS_KEY
#   AWS Secret Access Key: YOUR_SECRET_KEY
#   Default region name: ap-south-1  (Mumbai)
#   Default output format: json
```

#### Common S3 Commands

```bash
# List all buckets
aws s3 ls

# List all files in DDAS bucket
aws s3 ls s3://ddas-hash-files/

# List files for specific user
aws s3 ls s3://ddas-hash-files/user_demo_001/

# View contents of a hash file
aws s3 cp s3://ddas-hash-files/user_demo_001/hash_abc123.txt -

# Download a hash file to your computer
aws s3 cp s3://ddas-hash-files/user_demo_001/hash_abc123.txt ./downloaded_hash.txt

# Download all files from a user folder
aws s3 sync s3://ddas-hash-files/user_demo_001/ ./local_hashes/

# Count total files in bucket
aws s3 ls s3://ddas-hash-files/ --recursive | wc -l

# Show file sizes
aws s3 ls s3://ddas-hash-files/ --recursive --human-readable
```

---

### Method 3: S3 Browser Tools (GUI)

#### Option A: Cyberduck (Free, macOS/Windows)
1. Download: https://cyberduck.io/
2. Open → New Connection → Amazon S3
3. Enter AWS credentials
4. Browse buckets like Finder/Explorer

#### Option B: S3 Browser (Windows Only)
1. Download: https://s3browser.com/
2. Add AWS account
3. Browse files visually

---

## 📊 Understanding Your S3 Structure

```
s3://ddas-hash-files/
├── user_demo_001/
│   ├── hash_a1b2c3d4e5f6...uuid.txt  → Contains: "abc123def456..." (SHA-256)
│   ├── hash_x7y8z9...uuid.txt        → Contains: "789xyz123..." (SHA-256)
│   └── hash_...more files...
├── user_test_001/
│   ├── hash_...txt
│   └── hash_...txt
└── [other users]/
    └── ...
```

**Each hash file contains:**
- Just the SHA-256 hash string (64 characters)
- Example: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`

---

## 🔍 Useful S3 Operations

### Search for Specific Hash

```bash
# Search all files for a specific hash
aws s3 ls s3://ddas-hash-files/ --recursive | while read line; do
    key=$(echo $line | awk '{print $4}')
    content=$(aws s3 cp s3://ddas-hash-files/$key - 2>/dev/null)
    if [[ "$content" == *"abc123"* ]]; then
        echo "Found in: $key"
    fi
done
```

### Check Bucket Size

```bash
# Total bucket size
aws s3 ls s3://ddas-hash-files/ --recursive --summarize --human-readable

# Files per user
aws s3 ls s3://ddas-hash-files/user_demo_001/ | wc -l
```

### Delete Old Files (Cleanup)

```bash
# ⚠️ CAUTION: This deletes files!

# Delete specific hash file
aws s3 rm s3://ddas-hash-files/user_demo_001/hash_xyz.txt

# Delete all files for a user
aws s3 rm s3://ddas-hash-files/user_demo_001/ --recursive

# Delete entire bucket (use carefully!)
aws s3 rb s3://ddas-hash-files --force
```

### Copy Between Users

```bash
# Copy hash files from one user to another
aws s3 cp s3://ddas-hash-files/user_demo_001/ s3://ddas-hash-files/backup_user_001/ --recursive
```

---

## 🔐 Check Your Access Permissions

```bash
# Test if you have access to the bucket
aws s3 ls s3://ddas-hash-files/

# If you get "Access Denied" error:
# 1. Check your AWS credentials: aws sts get-caller-identity
# 2. Verify bucket exists: aws s3 ls | grep ddas
# 3. Check IAM permissions for S3 access
```

---

## 🛠️ Python Script to View S3 Contents

Create `view_s3_files.py`:

```python
#!/usr/bin/env python3
import boto3
from datetime import datetime

# Initialize S3 client
s3 = boto3.client('s3', region_name='ap-south-1')
bucket_name = 'ddas-hash-files'

def list_all_files():
    """List all files in DDAS bucket"""
    try:
        response = s3.list_objects_v2(Bucket=bucket_name)
        
        if 'Contents' not in response:
            print("Bucket is empty")
            return
        
        print(f"\n📦 Files in {bucket_name}:")
        print("-" * 80)
        
        for obj in response['Contents']:
            key = obj['Key']
            size = obj['Size']
            modified = obj['LastModified']
            
            print(f"📄 {key}")
            print(f"   Size: {size} bytes | Modified: {modified}")
            
            # Read hash content
            if key.endswith('.txt'):
                file_obj = s3.get_object(Bucket=bucket_name, Key=key)
                hash_content = file_obj['Body'].read().decode('utf-8').strip()
                print(f"   Hash: {hash_content[:32]}...")
            
            print()
        
        print(f"Total files: {len(response['Contents'])}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def list_user_files(user_id):
    """List files for specific user"""
    try:
        response = s3.list_objects_v2(
            Bucket=bucket_name,
            Prefix=f"{user_id}/"
        )
        
        if 'Contents' not in response:
            print(f"No files found for user: {user_id}")
            return
        
        print(f"\n📁 Files for {user_id}:")
        print("-" * 80)
        
        for obj in response['Contents']:
            print(f"  • {obj['Key']} ({obj['Size']} bytes)")
        
        print(f"\nTotal: {len(response['Contents'])} files")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🔍 DDAS S3 Bucket Viewer")
    print("=" * 80)
    
    # List all files
    list_all_files()
    
    # List files for demo user
    list_user_files("user_demo_001")
```

Run it:
```bash
python3 view_s3_files.py
```

---

## 📱 Mobile Access

### AWS Mobile App
1. Download "AWS Console" app (iOS/Android)
2. Login with AWS credentials
3. Navigate to S3 service
4. Browse your buckets

---

## 🔑 Create Read-Only Access for Others

```bash
# Create IAM policy for read-only access
aws iam create-policy --policy-name DDAS-ReadOnly --policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::ddas-hash-files",
        "arn:aws:s3:::ddas-hash-files/*"
      ]
    }
  ]
}'
```

---

## 🧪 Quick Test

```bash
# Upload a test file
echo "test_hash_12345" > test.txt
aws s3 cp test.txt s3://ddas-hash-files/test_user/test.txt

# List it
aws s3 ls s3://ddas-hash-files/test_user/

# Download it
aws s3 cp s3://ddas-hash-files/test_user/test.txt downloaded.txt

# View contents
cat downloaded.txt

# Delete it
aws s3 rm s3://ddas-hash-files/test_user/test.txt
```

---

## 🚨 Troubleshooting

### Error: "Bucket does not exist"
```bash
# Create the bucket
aws s3 mb s3://ddas-hash-files --region ap-south-1
```

### Error: "Access Denied"
```bash
# Check your credentials
aws sts get-caller-identity

# Check bucket permissions
aws s3api get-bucket-acl --bucket ddas-hash-files
```

### Error: "Invalid credentials"
```bash
# Reconfigure AWS CLI
aws configure
```

---

## 📊 Dashboard View (AWS Console)

Quick link: https://s3.console.aws.amazon.com/s3/buckets/ddas-hash-files?region=ap-south-1

You'll see:
- Total objects count
- Bucket size
- Folder structure
- File listing with metadata

---

## 💡 Pro Tips

1. **Bookmark** the S3 console URL for quick access
2. **Use AWS CLI** for bulk operations
3. **Enable versioning** to keep file history
4. **Set lifecycle policies** to auto-delete old files
5. **Monitor costs** - S3 charges per GB stored

---

**Need help? Run:**
```bash
aws s3 help
aws s3 ls help
aws s3 cp help
```

Happy browsing! 🪣✨

