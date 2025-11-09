#!/bin/bash

# Test script for DDAS duplicate file functionality
echo "🧪 Testing DDAS Duplicate File Functionality"
echo "==========================================="

# Check if server is running
echo "📡 Checking if server is running..."
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running. Starting server..."
    python3 server.py &
    sleep 3
fi

# Create test duplicate files in Downloads
echo "📁 Creating test files in Downloads..."
DOWNLOADS_DIR="$HOME/Downloads"
TEST_FILE1="$DOWNLOADS_DIR/test-duplicate-file.txt"
TEST_FILE2="$DOWNLOADS_DIR/test-original-file.txt"

# Create test files
echo "This is a test file for DDAS duplicate detection" > "$TEST_FILE1"
echo "This is the original file" > "$TEST_FILE2"

echo "✅ Test files created:"
echo "   - $TEST_FILE1"
echo "   - $TEST_FILE2"

echo ""
echo "🔧 Test Instructions:"
echo "1. Open Chrome and go to the DDAS extension popup"
echo "2. Make sure you're logged in"
echo "3. Download any file to trigger the DDAS monitoring"
echo "4. When processing starts, you should see:"
echo "   - File processing steps"
echo "   - If duplicate detected: Choice dialog with 'Delete' or 'Keep' options"
echo "   - Result in Recent Activity with appropriate icons"
echo ""
echo "Expected behaviors:"
echo "🗑️  Delete: File removed from Downloads, shows 'Duplicate Deleted' in history"
echo "📁  Keep: File stays in Downloads, shows 'Duplicate Kept' in history"
echo "⏭️  Skip: File processing skipped, shows 'File Skipped' in history"
echo ""
echo "📊 To test duplicate detection, use the console in the popup:"
echo "   ddas_test_pending(1)  // Creates a test pending file"

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up test files..."
    rm -f "$TEST_FILE1" "$TEST_FILE2"
    echo "✅ Cleanup complete"
}

# Set trap to cleanup on exit
trap cleanup EXIT

echo ""
echo "Press Ctrl+C to stop and cleanup test files"
read -p "Press Enter to continue or Ctrl+C to exit..."
