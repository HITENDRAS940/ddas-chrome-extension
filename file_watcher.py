#!/usr/bin/env python3
"""
DDAS File Watcher - Automatic Download Monitor
Monitors Downloads folder and sends files to backend for duplicate detection
"""

import os
import sys
import time
import hashlib
import requests
from pathlib import Path

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("❌ Error: 'watchdog' library not installed")
    print("📦 Install it with: pip3 install watchdog requests")
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

        # Skip temporary/partial download files
        if file_path.endswith(('.crdownload', '.tmp', '.part')):
            return

        # Avoid duplicate processing
        if file_path in self.processed_files or file_path in self.processing:
            return

        self.processing.add(file_path)

        # Wait for file to finish downloading
        if not self.wait_for_file_ready(file_path):
            self.processing.discard(file_path)
            return

        filename = os.path.basename(file_path)
        print(f"\n🔍 New download detected: {filename}")

        try:
            self.process_file(file_path)
            self.processed_files.add(file_path)
        except Exception as e:
            print(f"❌ Error processing {filename}: {e}")
        finally:
            self.processing.discard(file_path)

    def wait_for_file_ready(self, file_path, timeout=30):
        """Wait until file is completely downloaded and ready"""
        start_time = time.time()
        last_size = -1
        stable_count = 0

        while time.time() - start_time < timeout:
            try:
                if not os.path.exists(file_path):
                    time.sleep(0.5)
                    continue

                current_size = os.path.getsize(file_path)

                if current_size == last_size and current_size > 0:
                    stable_count += 1
                    if stable_count >= 3:  # Size stable for 1.5 seconds
                        time.sleep(1)  # Extra wait to ensure file is fully written
                        return True
                else:
                    stable_count = 0

                last_size = current_size
                time.sleep(0.5)
            except (OSError, FileNotFoundError):
                time.sleep(0.5)

        return False

    def process_file(self, file_path):
        """Process downloaded file and send to backend"""

        filename = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)

        print(f"📊 File: {filename}")
        print(f"📊 Size: {self.format_size(file_size)}")
        print(f"📤 Sending to backend...")

        # Send actual file to backend (same as Chrome extension)
        result = self.send_to_backend(file_path, filename)

        if result:
            if result.get('duplicate'):
                print(f"⚠️  DUPLICATE DETECTED!")
                print(f"   {result.get('message', 'File already exists')}")
            else:
                print(f"✅ File stored successfully!")
                print(f"   {result.get('message', 'New file saved')}")

        print("-" * 60)

    def send_to_backend(self, file_path, filename):
        """Send file to DDAS backend for duplicate detection"""
        try:
            with open(file_path, 'rb') as f:
                files = {'file': (filename, f, 'application/octet-stream')}
                data = {'userId': self.user_id}

                response = requests.post(
                    self.backend_url,
                    files=files,
                    data=data,
                    timeout=60
                )

                if response.status_code in [201, 409]:  # Created or Conflict (duplicate)
                    return response.json()
                else:
                    print(f"⚠️  Backend returned status {response.status_code}")
                    try:
                        print(f"   Response: {response.text}")
                    except:
                        pass
                    return None

        except requests.exceptions.ConnectionError:
            print(f"❌ Cannot connect to backend at {self.backend_url}")
            print(f"   Make sure Spring Boot is running:")
            print(f"   cd /Users/hitendrasingh/Desktop/DDAS && ./mvnw spring-boot:run")
            return None
        except Exception as e:
            print(f"❌ Backend request failed: {type(e).__name__}: {e}")
            return None

    def format_size(self, size_bytes):
        """Format bytes to human readable size"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} PB"


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
    print(f"🌐 Backend: http://localhost:8080/api/files/upload")
    print(f"👤 User ID: user_demo_001")
    print("=" * 60)
    print("✅ Watcher started! Download any file to test...")
    print("🛑 Press Ctrl+C to stop")
    print("=" * 60)

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
