# GitHub Setup Guide for DDAS

## Problem
GitHub no longer accepts password authentication. You need a Personal Access Token (PAT).

## Solution: Complete Setup Steps

### Step 1: Create a GitHub Personal Access Token

1. Go to GitHub: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `DDAS Project`
4. Set expiration: Choose your preference (90 days, 1 year, or no expiration)
5. Select scopes (check these boxes):
   - ✅ **repo** (all repo permissions)
   - ✅ **workflow** (if using GitHub Actions)
6. Click **"Generate token"** at the bottom
7. **IMPORTANT**: Copy the token immediately (you won't see it again!)
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Initialize Git Repository (if not already done)

```bash
cd /Users/hitendrasingh/Desktop/DDAS

# Initialize Git (if not already initialized)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: DDAS - Data Duplication Alert System"
```

### Step 3: Add Remote Repository

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/HITENDRAS940/ddas-chrome-extension.git

# Or if remote already exists, update it:
git remote set-url origin https://github.com/HITENDRAS940/ddas-chrome-extension.git
```

### Step 4: Push to GitHub Using Token

**Option A: Use Token in URL (Quick, but less secure)**
```bash
git push https://YOUR_TOKEN@github.com/HITENDRAS940/ddas-chrome-extension.git main
```

**Option B: Use Git Credential Helper (Recommended)**
```bash
# Store credentials securely in macOS Keychain
git config --global credential.helper osxkeychain

# Push - Git will prompt for credentials
git push -u origin main

# When prompted:
# Username: HITENDRAS940
# Password: [PASTE YOUR TOKEN HERE - not your GitHub password!]
```

**Option C: Use SSH Instead (Most Secure)**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
# Then change remote URL:
git remote set-url origin git@github.com:HITENDRAS940/ddas-chrome-extension.git

# Push
git push -u origin main
```

### Step 5: Create .gitignore (Recommended)

Create a `.gitignore` file to exclude unnecessary files:

```bash
# Already created in the project root
```

## Quick Commands for Your Project

```bash
# Navigate to project
cd /Users/hitendrasingh/Desktop/DDAS

# Check Git status
git status

# Add all files
git add .

# Commit changes
git commit -m "Complete DDAS implementation with Chrome Extension"

# Push to GitHub (will prompt for token)
git push -u origin main
```

## Troubleshooting

### Error: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/HITENDRAS940/ddas-chrome-extension.git
```

### Error: "failed to push some refs"
```bash
# Pull first, then push
git pull origin main --rebase
git push -u origin main
```

### Error: "Repository not found"
- Make sure the repository exists on GitHub
- Check the repository name is correct
- Ensure you have access to the repository

### Still having authentication issues?
```bash
# Clear cached credentials
git credential-osxkeychain erase
host=github.com
protocol=https
[Press Enter twice]

# Try pushing again - it will prompt for new credentials
git push -u origin main
```

## What Gets Pushed

Your DDAS project includes:
- ✅ Complete Spring Boot Backend
- ✅ Chrome Extension (popup, background, manifest)
- ✅ Documentation (README, QUICKSTART, TESTING)
- ✅ Configuration files
- ✅ Database schema
- ✅ Setup scripts

Total project structure ready for GitHub! 🚀

