#!/bin/bash

# DDAS Setup Script
# Configures Native Messaging for Chrome Extension

echo "🚀 DDAS Setup - Native Messaging Configuration"
echo "=============================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.7 or later."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"
echo ""

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt
echo ""

# Get Extension ID from user
echo "📋 Please enter your Chrome Extension ID:"
echo "(You can find this in chrome://extensions/ after loading the extension)"
read -p "Extension ID: " EXTENSION_ID

if [ -z "$EXTENSION_ID" ]; then
    echo "❌ Extension ID cannot be empty!"
    exit 1
fi

echo ""
echo "Extension ID: $EXTENSION_ID"
echo ""

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PYTHON_SCRIPT="$SCRIPT_DIR/file_uploader.py"

# Make Python script executable
chmod +x "$PYTHON_SCRIPT"

# Determine Chrome Native Messaging directory based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    NATIVE_HOST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    NATIVE_HOST_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
else
    echo "❌ Unsupported OS: $OSTYPE"
    exit 1
fi

# Create directory if it doesn't exist
mkdir -p "$NATIVE_HOST_DIR"

# Create native messaging manifest
MANIFEST_FILE="$NATIVE_HOST_DIR/com.ddas.file_uploader.json"

cat > "$MANIFEST_FILE" << EOF
{
  "name": "com.ddas.file_uploader",
  "description": "DDAS File Uploader Native Messaging Host",
  "path": "$PYTHON_SCRIPT",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXTENSION_ID/"
  ]
}
EOF

echo "✅ Native messaging manifest created at:"
echo "   $MANIFEST_FILE"
echo ""

# Also update the local copy
LOCAL_MANIFEST="$SCRIPT_DIR/com.ddas.file_uploader.json"
cat > "$LOCAL_MANIFEST" << EOF
{
  "name": "com.ddas.file_uploader",
  "description": "DDAS File Uploader Native Messaging Host",
  "path": "$PYTHON_SCRIPT",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXTENSION_ID/"
  ]
}
EOF

echo "✅ Local manifest updated at:"
echo "   $LOCAL_MANIFEST"
echo ""

# Add shebang to Python script if missing
if ! head -n 1 "$PYTHON_SCRIPT" | grep -q "^#!"; then
    echo "#!/usr/bin/env python3" | cat - "$PYTHON_SCRIPT" > temp && mv temp "$PYTHON_SCRIPT"
    chmod +x "$PYTHON_SCRIPT"
fi

echo "=============================================="
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Start the Spring Boot backend:"
echo "   ./mvnw spring-boot:run"
echo ""
echo "2. Open Chrome and go to chrome://extensions/"
echo "3. Reload the DDAS extension"
echo "4. Download a file to test the system"
echo ""
echo "Troubleshooting:"
echo "- If native messaging fails, check console in chrome://extensions/"
echo "- Ensure Python script path is correct in the manifest"
echo "- Verify Extension ID matches in chrome://extensions/"
echo ""

