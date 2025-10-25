-- DDAS Database Schema
-- This file documents the database structure
-- Spring Boot will auto-create tables, but this is for reference

-- Create database (run manually)
-- CREATE DATABASE ddas_db;

-- File Records Table (auto-created by JPA)
CREATE TABLE IF NOT EXISTS file_records (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(500) NOT NULL,
    hash_file_url VARCHAR(1000) NOT NULL UNIQUE,
    file_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT idx_user_hash UNIQUE (user_id, file_hash)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_records_user_id ON file_records(user_id);
CREATE INDEX IF NOT EXISTS idx_file_records_file_hash ON file_records(file_hash);
CREATE INDEX IF NOT EXISTS idx_file_records_created_at ON file_records(created_at DESC);

-- Sample queries

-- Find all files for a user
-- SELECT * FROM file_records WHERE user_id = 'user_001' ORDER BY created_at DESC;

-- Check if hash exists for user
-- SELECT * FROM file_records WHERE user_id = 'user_001' AND file_hash = 'abc123...';

-- Count files per user
-- SELECT user_id, COUNT(*) as file_count FROM file_records GROUP BY user_id;

-- Recent uploads (last 24 hours)
-- SELECT * FROM file_records WHERE created_at > NOW() - INTERVAL '24 hours';
#!/bin/bash

# DDAS Setup Script
# This script helps set up the DDAS application

echo "🔍 DDAS - Data Duplication Alert System Setup"
echo "=============================================="
echo ""

# Check Java version
echo "📌 Checking Java version..."
if command -v java &> /dev/null; then
    java_version=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
    echo "✅ Java $java_version found"
    if [ "$java_version" -lt 17 ]; then
        echo "⚠️  Warning: Java 17 or higher is recommended"
    fi
else
    echo "❌ Java not found. Please install Java 17 or higher"
    exit 1
fi

echo ""

# Check PostgreSQL
echo "📌 Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL found"
else
    echo "⚠️  PostgreSQL not found. Please install PostgreSQL"
fi

echo ""

# Check AWS CLI
echo "📌 Checking AWS CLI..."
if command -v aws &> /dev/null; then
    echo "✅ AWS CLI found"
    echo "   Run 'aws configure' to set up credentials"
else
    echo "⚠️  AWS CLI not found. Install from: https://aws.amazon.com/cli/"
fi

echo ""

# Create database
echo "📌 PostgreSQL Database Setup"
read -p "Create database 'ddas_db'? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    createdb ddas_db 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Database 'ddas_db' created successfully"
    else
        echo "ℹ️  Database may already exist or PostgreSQL is not running"
    fi
fi

echo ""

# AWS S3 Bucket
echo "📌 AWS S3 Bucket Setup"
read -p "Create S3 bucket 'ddas-hash-files'? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    aws s3 mb s3://ddas-hash-files 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ S3 bucket created successfully"
    else
        echo "ℹ️  Bucket may already exist or AWS credentials not configured"
    fi
fi

echo ""

# Build application
echo "📌 Building Spring Boot Application"
read -p "Build the application now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Building..."
    ./mvnw clean install -DskipTests
    if [ $? -eq 0 ]; then
        echo "✅ Build successful"
    else
        echo "❌ Build failed"
        exit 1
    fi
fi

echo ""
echo "=============================================="
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Configure application.properties with your DB and AWS credentials"
echo "2. Run: ./mvnw spring-boot:run"
echo "3. Install Chrome Extension from 'chrome-extension' folder"
echo "4. Access API at: http://localhost:8080"
echo ""
echo "📖 See README.md for detailed instructions"
echo "=============================================="

