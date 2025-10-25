@echo off
REM DDAS Setup Script for Windows
REM This script helps set up the DDAS application

echo ========================================
echo DDAS - Data Duplication Alert System
echo ========================================
echo.

REM Check Java
echo Checking Java version...
java -version 2>nul
if %errorlevel% neq 0 (
    echo Java not found. Please install Java 17 or higher
    pause
    exit /b 1
) else (
    echo Java found
)
echo.

REM Check PostgreSQL
echo Checking PostgreSQL...
psql --version 2>nul
if %errorlevel% neq 0 (
    echo PostgreSQL not found. Please install PostgreSQL
) else (
    echo PostgreSQL found
)
echo.

REM Check AWS CLI
echo Checking AWS CLI...
aws --version 2>nul
if %errorlevel% neq 0 (
    echo AWS CLI not found. Install from: https://aws.amazon.com/cli/
) else (
    echo AWS CLI found
    echo Run 'aws configure' to set up credentials
)
echo.

REM Database setup
echo PostgreSQL Database Setup
set /p createdb="Create database 'ddas_db'? (y/n): "
if /i "%createdb%"=="y" (
    createdb ddas_db 2>nul
    if %errorlevel% equ 0 (
        echo Database created successfully
    ) else (
        echo Database may already exist or PostgreSQL is not running
    )
)
echo.

REM S3 Bucket setup
echo AWS S3 Bucket Setup
set /p creates3="Create S3 bucket 'ddas-hash-files'? (y/n): "
if /i "%creates3%"=="y" (
    aws s3 mb s3://ddas-hash-files 2>nul
    if %errorlevel% equ 0 (
        echo S3 bucket created successfully
    ) else (
        echo Bucket may already exist or AWS credentials not configured
    )
)
echo.

REM Build application
echo Building Spring Boot Application
set /p build="Build the application now? (y/n): "
if /i "%build%"=="y" (
    echo Building...
    mvnw.cmd clean install -DskipTests
    if %errorlevel% equ 0 (
        echo Build successful
    ) else (
        echo Build failed
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo Setup Complete!
echo.
echo Next steps:
echo 1. Configure application.properties with your DB and AWS credentials
echo 2. Run: mvnw.cmd spring-boot:run
echo 3. Install Chrome Extension from 'chrome-extension' folder
echo 4. Access API at: http://localhost:8080
echo.
echo See README.md for detailed instructions
echo ========================================
pause

