// DDAS Popup Script v2.0
// Configuration
const API_BASE_URL = 'http://localhost:8080/api';
const AUTH_URL = `${API_BASE_URL}/auth`;

// Auth state
let currentUser = null;
let authToken = null;

// DOM Elements
const authContainer = document.getElementById('authContainer');
const appContainer = document.getElementById('appContainer');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const otpTab = document.getElementById('otpTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const otpForm = document.getElementById('otpForm');
const loginMessage = document.getElementById('loginMessage');
const signupMessage = document.getElementById('signupMessage');
const otpMessage = document.getElementById('otpMessage');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const historyList = document.getElementById('historyList');
const emptyState = document.getElementById('emptyState');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthStatus();
    setupEventListeners();
    loadHistory();
});

/**
 * Check authentication status
 */
async function checkAuthStatus() {
    const storedAuth = await getStoredAuth();
    if (storedAuth && storedAuth.token && storedAuth.user) {
        authToken = storedAuth.token;
        currentUser = storedAuth.user;
        showAppScreen();
    } else {
        showAuthScreen();
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Tab switching
    loginTab.addEventListener('click', () => {
        switchToTab('login');
    });

    signupTab.addEventListener('click', () => {
        switchToTab('signup');
    });

    otpTab.addEventListener('click', () => {
        switchToTab('otp');
    });

    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    otpForm.addEventListener('submit', handleOtpVerification);
    logoutBtn.addEventListener('click', handleLogout);

    // OTP form buttons
    document.getElementById('resendOtpBtn').addEventListener('click', handleResendOtp);
    document.getElementById('backToSignupBtn').addEventListener('click', () => {
        switchToTab('signup');
        otpTab.style.display = 'none';
    });
}

/**
 * Switch between tabs
 */
function switchToTab(tab) {
    // Remove active from all tabs
    loginTab.classList.remove('active');
    signupTab.classList.remove('active');
    otpTab.classList.remove('active');

    // Remove active from all forms
    loginForm.classList.remove('active');
    signupForm.classList.remove('active');
    otpForm.classList.remove('active');

    // Activate selected tab and form
    if (tab === 'login') {
        loginTab.classList.add('active');
        loginForm.classList.add('active');
    } else if (tab === 'signup') {
        signupTab.classList.add('active');
        signupForm.classList.add('active');
    } else if (tab === 'otp') {
        otpTab.classList.add('active');
        otpForm.classList.add('active');
    }
}

/**
 * Handle login
 */
async function handleLogin(e) {
    e.preventDefault();

    const usernameOrEmail = document.getElementById('loginUsernameOrEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        showMessage(loginMessage, 'Logging in...', 'info');

        const response = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernameOrEmail, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            authToken = data.token;
            currentUser = data.user;

            // Store authentication
            await chrome.storage.local.set({
                authToken: authToken,
                currentUser: currentUser
            });

            showMessage(loginMessage, 'Login successful!', 'success');
            setTimeout(() => showAppScreen(), 500);
        } else {
            showMessage(loginMessage, data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage(loginMessage, 'Network error. Please try again.', 'error');
    }
}

/**
 * Handle signup
 */
async function handleSignup(e) {
    e.preventDefault();

    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
        showMessage(signupMessage, 'Creating account...', 'info');

        const response = await fetch(`${AUTH_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(signupMessage, data.message || 'OTP sent to your email!', 'success');

            // Show OTP verification form
            setTimeout(() => {
                document.getElementById('otpEmail').value = email;
                otpTab.style.display = 'block';
                switchToTab('otp');
                document.getElementById('otpCode').focus();
            }, 1000);
        } else {
            showMessage(signupMessage, data.message || 'Signup failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showMessage(signupMessage, 'Network error. Please try again.', 'error');
    }
}

/**
 * Handle OTP verification
 */
async function handleOtpVerification(e) {
    e.preventDefault();

    const email = document.getElementById('otpEmail').value;
    const otp = document.getElementById('otpCode').value;

    try {
        showMessage(otpMessage, 'Verifying code...', 'info');

        const response = await fetch(`${AUTH_URL}/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            showMessage(otpMessage, 'Verification successful! Logging you in...', 'success');

            // Store authentication
            authToken = data.token;
            currentUser = data.user;

            await chrome.storage.local.set({
                authToken: authToken,
                currentUser: currentUser
            });

            // Clear forms and show app
            setTimeout(() => {
                signupForm.reset();
                otpForm.reset();
                otpTab.style.display = 'none';
                showAppScreen();
            }, 500);
        } else {
            showMessage(otpMessage, data.message || 'Invalid verification code', 'error');
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        showMessage(otpMessage, 'Network error. Please try again.', 'error');
    }
}

/**
 * Handle resend OTP
 */
async function handleResendOtp() {
    const email = document.getElementById('otpEmail').value;

    try {
        showMessage(otpMessage, 'Sending new code...', 'info');

        const response = await fetch(`${AUTH_URL}/resend-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(otpMessage, data.message || 'New code sent to your email!', 'success');
        } else {
            showMessage(otpMessage, data.message || 'Failed to resend code', 'error');
        }
    } catch (error) {
        console.error('Resend OTP error:', error);
        showMessage(otpMessage, 'Network error. Please try again.', 'error');
    }
}

/**
 * Handle logout
 */
async function handleLogout() {
    await chrome.storage.local.remove(['authToken', 'currentUser']);
    authToken = null;
    currentUser = null;
    showAuthScreen();
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

    loadHistory();
}

/**
 * Show auth screen
 */
function showAuthScreen() {
    appContainer.classList.remove('active');
    authContainer.classList.add('active');
}

/**
 * Show message
 */
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = 'auth-message';
    if (type) {
        element.classList.add(type);
    }
}

/**
 * Get stored authentication
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
 * Load file history
 */
async function loadHistory() {
    chrome.storage.local.get(['fileHistory'], (data) => {
        const history = data.fileHistory || [];

        if (history.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        historyList.innerHTML = '';

        history.forEach(item => {
            const card = createHistoryCard(item);
            historyList.appendChild(card);
        });
    });
}

/**
 * Create history card
 */
function createHistoryCard(item) {
    const card = document.createElement('div');
    card.className = 'status-card';

    if (item.duplicate) {
        card.classList.add('duplicate');
    } else if (item.success) {
        card.classList.add('success');
    } else {
        card.classList.add('error');
    }

    const icon = item.duplicate ? '⚠️' : item.success ? '✅' : '❌';
    const title = item.duplicate ? 'Duplicate Detected' : item.success ? 'File Processed' : 'Error';

    let message = '';
    if (item.duplicate) {
        message = `File: ${item.filename}<br>Original: ${item.original_filename}`;
    } else if (item.success) {
        message = `File: ${item.filename}<br>No duplicates found`;
    } else {
        message = `Error: ${item.error || 'Unknown error'}`;
    }

    const timestamp = new Date(item.timestamp).toLocaleString();

    card.innerHTML = `
        <div class="status-title">${icon} ${title}</div>
        <div class="status-message">${message}</div>
        <div class="status-details">${timestamp}</div>
    `;

    return card;
}

// Listen for storage changes to update history in real-time
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.fileHistory) {
        loadHistory();
    }
});

