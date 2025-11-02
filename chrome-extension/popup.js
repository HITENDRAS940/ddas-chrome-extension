// Configuration
const API_BASE_URL = 'http://localhost:8081/api';
const AUTH_URL = `${API_BASE_URL}/auth`;
const FILES_URL = `${API_BASE_URL}/files`;

// Auth state
let currentUser = null;
let authToken = null;

// DOM Elements - Auth
const authContainer = document.getElementById('authContainer');
const appContainer = document.getElementById('appContainer');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginMessage = document.getElementById('loginMessage');
const signupMessage = document.getElementById('signupMessage');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');

// DOM Elements - App
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const selectedFileName = document.getElementById('selectedFileName');
const loader = document.getElementById('loader');
const statusSection = document.getElementById('statusSection');
const emptyState = document.getElementById('emptyState');

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthStatus();
    setupEventListeners();
    setupAutoDetection();
});

/**
 * Check if user is authenticated
 */
async function checkAuthStatus() {
    try {
        const storedAuth = await getStoredAuth();
        if (storedAuth && storedAuth.token) {
            authToken = storedAuth.token;
            currentUser = storedAuth.user;
            showAppScreen();
            loadStatusHistory();
        } else {
            showAuthScreen();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showAuthScreen();
    }
}

/**
 * Get stored authentication data
 */
function getStoredAuth() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['authToken', 'currentUser'], (data) => {
            resolve({
                token: data.authToken,
                user: data.currentUser
            });
        });
    });
}

/**
 * Store authentication data
 */
function storeAuth(token, user) {
    chrome.storage.local.set({
        authToken: token,
        currentUser: user
    });
}

/**
 * Clear stored authentication data
 */
function clearAuth() {
    chrome.storage.local.remove(['authToken', 'currentUser']);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Auth tab switching
    loginTab.addEventListener('click', () => switchAuthTab('login'));
    signupTab.addEventListener('click', () => switchAuthTab('signup'));

    // Auth forms
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // File upload
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
}

/**
 * Switch between auth tabs
 */
function switchAuthTab(tab) {
    if (tab === 'login') {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    } else {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
    }
    clearAuthMessages();
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const loginData = {
        usernameOrEmail: formData.get('usernameOrEmail'),
        password: formData.get('password')
    };

    try {
        showAuthLoading('loginBtn', true);
        clearAuthMessages();

        const response = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (response.ok && result.token) {
            // Login successful
            authToken = result.token;
            currentUser = result.user;
            storeAuth(authToken, currentUser);
            showAuthMessage('loginMessage', 'Login successful!', 'success');
            setTimeout(() => {
                showAppScreen();
                loadStatusHistory();
            }, 1000);
        } else {
            // Login failed
            showAuthMessage('loginMessage', result.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAuthMessage('loginMessage', 'Network error. Please check if the server is running.', 'error');
    } finally {
        showAuthLoading('loginBtn', false);
    }
}

/**
 * Handle signup form submission
 */
async function handleSignup(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    // Validate passwords match
    if (password !== confirmPassword) {
        showAuthMessage('signupMessage', 'Passwords do not match', 'error');
        return;
    }

    const signupData = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: password
    };

    try {
        showAuthLoading('signupBtn', true);
        clearAuthMessages();

        const response = await fetch(`${AUTH_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(signupData)
        });

        const result = await response.json();

        if (response.ok && result.token) {
            // Signup successful
            authToken = result.token;
            currentUser = result.user;
            storeAuth(authToken, currentUser);
            showAuthMessage('signupMessage', 'Account created successfully!', 'success');
            setTimeout(() => {
                showAppScreen();
                loadStatusHistory();
            }, 1000);
        } else {
            // Signup failed
            showAuthMessage('signupMessage', result.message || 'Signup failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showAuthMessage('signupMessage', 'Network error. Please check if the server is running.', 'error');
    } finally {
        showAuthLoading('signupBtn', false);
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    authToken = null;
    currentUser = null;
    clearAuth();
    showAuthScreen();
    clearStatusHistory();
}

/**
 * Show authentication screen
 */
function showAuthScreen() {
    authContainer.classList.add('active');
    appContainer.classList.remove('active');
    clearAuthForms();
}

/**
 * Show app screen
 */
function showAppScreen() {
    authContainer.classList.remove('active');
    appContainer.classList.add('active');

    if (currentUser) {
        userName.textContent = currentUser.username || currentUser.email || 'User';
    }
}

/**
 * Show auth message
 */
function showAuthMessage(elementId, message, type) {
    const messageEl = document.getElementById(elementId);
    messageEl.textContent = message;
    messageEl.className = `auth-message ${type}`;
}

/**
 * Clear auth messages
 */
function clearAuthMessages() {
    loginMessage.className = 'auth-message';
    signupMessage.className = 'auth-message';
}

/**
 * Show auth loading state
 */
function showAuthLoading(buttonId, loading) {
    const button = document.getElementById(buttonId);
    button.disabled = loading;
    button.textContent = loading ? 'Please wait...' : (buttonId === 'loginBtn' ? 'Login' : 'Sign Up');
}

/**
 * Clear auth forms
 */
function clearAuthForms() {
    loginForm.reset();
    signupForm.reset();
    clearAuthMessages();
}

/**
 * Handle file selection
 */
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        selectedFileName.textContent = `Selected: ${file.name}`;
        await uploadFile(file);
    }
}

/**
 * Upload file to backend API
 */
async function uploadFile(file) {
    if (!authToken) {
        displayError('You must be logged in to upload files.', file.name);
        return;
    }

    try {
        // Show loader
        showLoader(true);
        hideEmptyState();

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);

        // Send to backend with auth token
        const response = await fetch(`${FILES_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        if (response.status === 401) {
            // Token expired or invalid
            handleLogout();
            return;
        }

        const result = await response.json();

        // Hide loader
        showLoader(false);

        if (response.ok) {
            // Display result
            displayStatus(result, file.name);

            // Save to history
            saveToHistory(result, file.name);
        } else {
            displayError(result.message || 'Upload failed', file.name);
        }

        // Reset file input
        fileInput.value = '';
        selectedFileName.textContent = '';

    } catch (error) {
        showLoader(false);
        displayError('Failed to upload file. Make sure the backend is running.', file.name);
        console.error('Upload error:', error);
    }
}

/**
 * Setup auto detection functionality
 */
function setupAutoDetection() {
    // Add auto-detection status indicator only when user is logged in
    if (currentUser) {
        addAutoDetectionIndicator();
        checkRecentDownloads();
    }
}

/**
 * Add auto-detection status indicator
 */
function addAutoDetectionIndicator() {
    // Check if indicator already exists
    if (document.querySelector('.auto-detect-indicator')) return;

    const autoDetectIndicator = document.createElement('div');
    autoDetectIndicator.className = 'auto-detect-indicator';
    autoDetectIndicator.style.cssText = 'background: #e8f5e9; padding: 8px 15px; margin-bottom: 15px; border-radius: 6px; font-size: 12px; color: #2e7d32; display: flex; align-items: center; gap: 8px;';
    autoDetectIndicator.innerHTML = '<span style="font-size: 16px;">🤖</span> <span><strong>Auto-detection:</strong> Active - Downloads are monitored automatically</span>';

    const uploadSection = document.querySelector('.upload-section');
    uploadSection.parentNode.insertBefore(autoDetectIndicator, uploadSection);
}

/**
 * Check for recent downloads
 */
function checkRecentDownloads() {
    chrome.storage.local.get(['lastDownload'], (data) => {
        if (data.lastDownload) {
            const downloadInfo = data.lastDownload;
            const timeDiff = new Date() - new Date(downloadInfo.timestamp);

            // If download was within last 2 minutes, show helpful message
            if (timeDiff < 120000) {
                showRecentDownloadBanner(downloadInfo);
            }
        }
    });
}

/**
 * Show recent download banner
 */
function showRecentDownloadBanner(downloadInfo) {
    const recentDownloadBanner = document.createElement('div');
    recentDownloadBanner.style.cssText = 'background: #fff3cd; border: 2px solid #ffc107; padding: 12px 15px; margin-bottom: 15px; border-radius: 8px; font-size: 12px; color: #856404;';
    recentDownloadBanner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 18px;">📥</span>
            <strong>Recent Download Detected!</strong>
        </div>
        <div style="font-size: 11px; margin-left: 26px;">
            ${downloadInfo.filename}
        </div>
        <div style="font-size: 11px; margin-left: 26px; margin-top: 4px; color: #666;">
            👆 Click "Choose File" below and select this file from your Downloads folder
        </div>
    `;

    const uploadSection = document.querySelector('.upload-section');
    uploadSection.parentNode.insertBefore(recentDownloadBanner, uploadSection);
}

/**
 * Display status card
 */
function displayStatus(result, fileName) {
    const statusCard = document.createElement('div');
    statusCard.className = `status-card ${result.duplicate ? 'duplicate' : 'success'}`;

    const icon = result.duplicate ? '⚠️' : '✅';
    const title = result.duplicate ? 'Duplicate Detected!' : 'File Stored Successfully!';

    statusCard.innerHTML = `
        <div class="status-title">
            <span class="icon">${icon}</span>
            <span>${title}</span>
        </div>
        <div class="status-message">${result.message}</div>
        <div class="status-details">
            <strong>File:</strong> ${fileName}<br>
            <strong>Hash:</strong> ${result.fileHash ? result.fileHash.substring(0, 16) + '...' : 'N/A'}<br>
            <strong>Time:</strong> ${new Date().toLocaleTimeString()}
        </div>
    `;

    // Insert at the top
    statusSection.insertBefore(statusCard, statusSection.firstChild);

    // Keep only last 5 items
    while (statusSection.children.length > 5) {
        statusSection.removeChild(statusSection.lastChild);
    }
}

/**
 * Display error message
 */
function displayError(message, fileName) {
    const statusCard = document.createElement('div');
    statusCard.className = 'status-card error';

    // Make error message more user-friendly
    let userMessage = message;
    if (message.includes('Failed to fetch')) {
        userMessage = 'Could not connect to server. Please check if the backend is running.';
    }

    statusCard.innerHTML = `
        <div class="status-title">
            <span class="icon">❌</span>
            <span>Upload Failed</span>
        </div>
        <div class="status-message">${userMessage}</div>
        <div class="status-details">
            <strong>File:</strong> ${fileName}<br>
            <strong>Time:</strong> ${new Date().toLocaleTimeString()}
        </div>
    `;

    statusSection.insertBefore(statusCard, statusSection.firstChild);
}

/**
 * Show/hide loader
 */
function showLoader(show) {
    if (show) {
        loader.classList.add('active');
    } else {
        loader.classList.remove('active');
    }
}

/**
 * Hide empty state
 */
function hideEmptyState() {
    emptyState.style.display = 'none';
}

/**
 * Save status to Chrome storage
 */
function saveToHistory(result, fileName) {
    chrome.storage.local.get(['statusHistory'], (data) => {
        let history = data.statusHistory || [];

        history.unshift({
            fileName,
            result,
            timestamp: new Date().toISOString()
        });

        // Keep only last 10 items
        history = history.slice(0, 10);

        chrome.storage.local.set({ statusHistory: history });
    });
}

/**
 * Load status history from Chrome storage
 */
function loadStatusHistory() {
    chrome.storage.local.get(['statusHistory'], (data) => {
        const history = data.statusHistory || [];

        if (history.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        // Display last 5 items
        history.slice(0, 5).forEach(item => {
            displayStatus(item.result, item.fileName);
        });
    });
}

/**
 * Clear status history
 */
function clearStatusHistory() {
    chrome.storage.local.remove(['statusHistory']);
    statusSection.innerHTML = '';
    emptyState.style.display = 'block';
}

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FILE_DOWNLOADED') {
        console.log('File download detected:', message.fileName);
        // You can add auto-processing here if needed
    }
});

