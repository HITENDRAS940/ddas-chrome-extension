#!/usr/bin/env python3
"""
DDAS Local HTTP Server - Replaces native messaging host
Runs on http://localhost:5000 to receive file processing requests from Chrome extension
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import hashlib
import requests
import logging
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for Chrome extension requests

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [SERVER] %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler('/Users/hitendrasingh/Desktop/DDAS/server.log'),
        logging.StreamHandler()
    ]
)

# Configuration
BACKEND_API_URL = "http://localhost:8080/api/files"

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "running",
        "service": "DDAS Local Server",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/process', methods=['POST'])
def process_file():
    """
    Main endpoint to process downloaded files
    Expects JSON: {"path": "/path/to/file", "auth_token": "jwt_token"}
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No JSON data provided"}), 400

        file_path = data.get('path')
        auth_token = data.get('auth_token')

        app.logger.info(f"Processing file request: {file_path}")

        # Validate inputs
        if not file_path:
            return jsonify({"success": False, "error": "File path is required"}), 400

        if not auth_token:
            return jsonify({"success": False, "error": "Authentication token is required"}), 400

        # Check if file exists
        if not os.path.exists(file_path):
            app.logger.error(f"File not found: {file_path}")
            return jsonify({"success": False, "error": f"File not found: {file_path}"}), 404

        # Process the file
        result = process_downloaded_file(file_path, auth_token)

        app.logger.info(f"Processing result: {result}")
        return jsonify(result)

    except Exception as e:
        app.logger.error(f"Error processing request: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

def process_downloaded_file(file_path, auth_token):
    """
    Process a downloaded file - check for duplicates and upload if new
    """
    try:
        filename = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)

        app.logger.info(f"Processing file: {filename} ({file_size} bytes)")

        # Calculate file hash for duplicate detection
        file_hash = calculate_file_hash(file_path)
        if not file_hash:
            return {"success": False, "error": "Could not calculate file hash"}

        app.logger.info(f"File hash: {file_hash[:16]}...")

        # Check for duplicates using backend API
        headers = {"Authorization": f"Bearer {auth_token}"}

        try:
            check_url = f"{BACKEND_API_URL}/check-hash/{file_hash}"
            app.logger.info(f"Checking duplicates: {check_url}")

            response = requests.get(check_url, headers=headers, timeout=10)

            if response.status_code == 200:
                data = response.json()
                if data.get('exists'):
                    app.logger.info("Duplicate file detected!")
                    return {
                        "success": True,
                        "duplicate": True,
                        "filename": filename,
                        "original_filename": data.get('filename', 'unknown'),
                        "file_hash": file_hash,
                        "message": f"File '{filename}' already exists as '{data.get('filename', 'unknown')}'"
                    }

            app.logger.info("No duplicate found, uploading file...")

        except requests.exceptions.RequestException as e:
            app.logger.warning(f"Duplicate check failed: {e}")

        # Upload file to backend
        try:
            upload_url = f"{BACKEND_API_URL}/upload"

            with open(file_path, 'rb') as f:
                files = {'file': (filename, f, 'application/octet-stream')}
                response = requests.post(upload_url, headers=headers, files=files, timeout=120)

            if response.status_code in [200, 201]:
                app.logger.info("File uploaded successfully")
                return {
                    "success": True,
                    "duplicate": False,
                    "filename": filename,
                    "file_hash": file_hash,
                    "message": f"File '{filename}' uploaded successfully"
                }
            else:
                app.logger.error(f"Upload failed: HTTP {response.status_code}")
                return {"success": False, "error": f"Upload failed: HTTP {response.status_code}"}

        except requests.exceptions.RequestException as e:
            app.logger.error(f"Upload request failed: {e}")
            return {"success": False, "error": f"Upload request failed: {str(e)}"}

    except Exception as e:
        app.logger.error(f"File processing error: {e}")
        return {"success": False, "error": f"Processing error: {str(e)}"}

def calculate_file_hash(file_path):
    """Calculate SHA-256 hash of a file"""
    try:
        hash_obj = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b""):
                hash_obj.update(chunk)
        return hash_obj.hexdigest()
    except Exception as e:
        app.logger.error(f"Hash calculation error: {e}")
        return None

@app.errorhandler(404)
def not_found(error):
    return jsonify({"success": False, "error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"success": False, "error": "Internal server error"}), 500

if __name__ == '__main__':
    print("🚀 Starting DDAS Local HTTP Server...")
    print("📡 Server will run on: http://localhost:5001")
    print("🔗 Main endpoint: POST /process")
    print("❤️ Health check: GET /health")
    print("📋 Logs: server.log")
    print("🛑 Press Ctrl+C to stop")

    # Start the Flask server
    app.run(
        host='0.0.0.0',  # Accept connections from any IP (for localhost)
        port=5001,        # Using 5001 for local HTTP server
        debug=False,      # Set to True for development
        threaded=True     # Handle multiple requests
    )
