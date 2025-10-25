# DDAS Auto-Detection Setup Guide

## 🎯 What's Changed

Your DDAS extension now **automatically detects and processes all downloads**! No more manual file selection needed.

## 📦 Components Added

### 1. **Chrome Extension (Automatic)**
- ✅ `manifest.json` - Added `notifications` permission
- ✅ `background.js` - Monitors downloads automatically
- ✅ `popup.js` - Shows auto-detection status

### 2. **Python File Watcher (Optional Advanced)**
- ✅ `file_watcher.py` - Desktop-level monitoring
- ✅ `requirements.txt` - Python dependencies

## 🚀 Quick Start

### Option A: Chrome Extension Only (Recommended)

1. **Reload Extension**
   ```bash
   # Go to chrome://extensions/
   # Click reload icon on DDAS extension
   ```

2. **Test It**
   - Download any file from the internet
   - Chrome will show notification: "Processing Download"
   - Then shows: "✅ File Stored Successfully" or "⚠️ Duplicate Detected"

3. **View Results**
   - Click DDAS extension icon
   - See "🤖 Auto-detection: Active"
   - View history of processed files

### Option B: Python Watcher (Advanced)

1. **Install Python Dependencies**
   ```bash
   cd /Users/hitendrasingh/Desktop/DDAS
   pip install -r requirements.txt
   ```

2. **Start File Watcher**
   ```bash
   python3 file_watcher.py
   ```

3. **Download Files**
   - Python script monitors ~/Downloads folder
   - Automatically sends files to backend
   - Shows duplicate detection in terminal

## ✨ How It Works Now

### Before (Manual)
1. Download file
2. Click extension
3. Click "Choose File"
4. Select downloaded file
5. Wait for result

### After (Automatic) ✅
1. Download file
2. **DONE!** Everything happens automatically

## 🔔 Notifications

You'll see 3 types of notifications:

1. **Processing** (Blue)
   - "Checking [filename] for duplicates..."

2. **Success** (Green)
   - "✅ [filename] has been stored successfully"

3. **Duplicate** (Yellow)
   - "⚠️ [filename] already exists in your storage"

## 🧪 Test It

1. **Start Backend**
   ```bash
   cd /Users/hitendrasingh/Desktop/DDAS
   ./mvnw spring-boot:run
   ```

2. **Download Test File**
   - Download any file (PDF, image, etc.)
   - Watch for notification

3. **Download Same File Again**
   - Should show "Duplicate Detected!"

## 📊 View History

Click DDAS extension icon to see:
- Auto-detection status indicator
- Last 50 processed files
- Success/duplicate indicators
- Timestamps

## 🐛 Troubleshooting

### Notifications not showing?
- Check Chrome notification settings
- System Preferences → Notifications → Chrome

### Backend errors?
- Make sure Spring Boot is running
- Check http://localhost:8080/api/files/health

### Python watcher not working?
```bash
# Install dependencies
pip3 install watchdog requests

# Run with verbose output
python3 file_watcher.py
```

## 🎯 Features

✅ **Fully Automatic** - Zero manual intervention
✅ **Real-time Processing** - Instant duplicate detection  
✅ **Desktop Notifications** - Know immediately
✅ **History Tracking** - View all processed files
✅ **Dual Monitoring** - Chrome + Python (optional)
✅ **Background Processing** - Doesn't interrupt browsing

## 📝 Notes

- Chrome extension monitors all downloads automatically
- Python watcher is optional for advanced desktop monitoring
- Files are sent to backend immediately after download
- Only hash files stored in S3 (not actual files)
- Each user's data isolated in separate S3 folders

---

**Your DDAS is now fully automatic! Download files and watch the magic happen! 🎉**
#!/usr/bin/env python3
"""
DDAS File Watcher - Advanced Download Monitor
Monitors Downloads folder and automatically sends files to backend for duplicate detection
Uses Python watchdog library for file system monitoring
"""

import os
import sys
import time
import hashlib
import requests
from pathlib import Path
from datetime import datetime

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("❌ Error: watchdog library not installed")
    print("📦 Install it with: pip install watchdog requests")
    sys.exit(1)


class DownloadHandler(FileSystemEventHandler):
    """Handles file system events in the Downloads folder"""
    
    def __init__(self, backend_url="http://localhost:8080/api/files/upload", user_id="user_demo_001"):
        self.backend_url = backend_url
        self.user_id = user_id
        self.processed_files = set()
        self.processing = set()
        
    def on_created(self, event):
        """Called when a file is created/downloaded"""
        if event.is_directory:
            return
        
        file_path = event.src_path
        
        # Skip temporary files
        if file_path.endswith('.crdownload') or file_path.endswith('.tmp'):
            return
            
        # Avoid duplicate processing
        if file_path in self.processed_files or file_path in self.processing:
            return
        
        self.processing.add(file_path)
        
        # Wait for file to finish downloading
        print(f"⏳ Waiting for download to complete: {os.path.basename(file_path)}")
        self.wait_for_file_completion(file_path)
        
        # Process the file
        print(f"🔍 New download detected: {os.path.basename(file_path)}")
        
        try:
            self.process_file(file_path)
            self.processed_files.add(file_path)
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
        finally:
            self.processing.discard(file_path)
    
    def wait_for_file_completion(self, file_path, timeout=30):
        """Wait until file is completely downloaded"""
        start_time = time.time()
        last_size = -1
        
        while time.time() - start_time < timeout:
            try:
                current_size = os.path.getsize(file_path)
                if current_size == last_size and current_size > 0:
                    # File size hasn't changed, download complete
                    time.sleep(1)  # Extra wait to be safe
                    return True
                last_size = current_size
                time.sleep(0.5)
            except (OSError, FileNotFoundError):
                time.sleep(0.5)
        
        return True
    
    def process_file(self, file_path):
        """Process downloaded file - calculate hash and send to backend"""
        
        # Calculate SHA-256 hash
        print(f"📊 Calculating hash for: {os.path.basename(file_path)}")
        file_hash = self.calculate_hash(file_path)
        
        filename = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        
        print(f"   File: {filename}")
        print(f"   Hash: {file_hash}")
        print(f"   Size: {self.format_size(file_size)}")
        
        # Send to backend
        result = self.send_to_backend(file_path, filename)
        
        if result:
            if result.get('duplicate'):
                print(f"⚠️  DUPLICATE DETECTED! {filename} already exists")
            else:
                print(f"✅ {filename} stored successfully!")
        
        print("-" * 60)
    
    def calculate_hash(self, file_path):
        """Calculate SHA-256 hash of file"""
        sha256_hash = hashlib.sha256()
        
        with open(file_path, "rb") as f:
            # Read file in chunks to handle large files
            for byte_block in iter(lambda: f.read(8192), b""):
                sha256_hash.update(byte_block)
        
        return sha256_hash.hexdigest()
    
    def send_to_backend(self, file_path, filename):
        """Send file to DDAS backend for duplicate detection"""
        try:
            # Upload actual file (same as Chrome extension)
            with open(file_path, 'rb') as f:
                files = {'file': (filename, f, 'application/octet-stream')}
                data = {'userId': self.user_id}
                
                print(f"📤 Sending to backend: {self.backend_url}")
                response = requests.post(
                    self.backend_url,
                    files=files,
                    data=data,
                    timeout=30
                )
                
                if response.status_code in [201, 409]:  # Created or Conflict (duplicate)
                    result = response.json()
                    return result
                else:
                    print(f"⚠️  Backend returned status {response.status_code}")
                    return None
                    
        except requests.exceptions.ConnectionError:
            print(f"❌ Cannot connect to backend at {self.backend_url}")
            print(f"   Make sure Spring Boot is running on localhost:8080")
            return None
        except Exception as e:
            print(f"❌ Backend request failed: {e}")
            return None
    
    def format_size(self, size_bytes):
        """Format bytes to human readable size"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} TB"


def main():
    """Main function to start file watcher"""
    
    # Determine Downloads folder
    downloads_path = str(Path.home() / "Downloads")
    
    if not os.path.exists(downloads_path):
        print(f"❌ Downloads folder not found: {downloads_path}")
        sys.exit(1)
    
    print("=" * 60)
    print("🔍 DDAS File Watcher - Automatic Download Monitor")
    print("=" * 60)
    print(f"📁 Monitoring: {downloads_path}")
    print(f"🌐 Backend URL: http://localhost:8080/api/files/upload")
    print(f"👤 User ID: user_demo_001")
    print("=" * 60)
    print("✅ Watcher started! Download any file to test...")
    print("🛑 Press Ctrl+C to stop")
    print("=" * 60)
    print()
    
    # Create event handler and observer
    event_handler = DownloadHandler()
    observer = Observer()
    observer.schedule(event_handler, downloads_path, recursive=False)
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping file watcher...")
        observer.stop()
    
    observer.join()
    print("👋 File watcher stopped. Goodbye!")


if __name__ == "__main__":
    main()

