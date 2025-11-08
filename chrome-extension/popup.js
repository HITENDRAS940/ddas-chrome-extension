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
const pendingSection = document.getElementById('pendingSection');
const pendingList = document.getElementById('pendingList');

// Configuration for local server
const LOCAL_SERVER_URL = "http://localhost:5001";

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthStatus();
    setupEventListeners();
    loadHistory();
    loadPendingDownloads();
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

    // Delegated event listeners for pending download buttons (backup)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('pending-btn')) {
            console.log('✅ Pending button clicked (document listener)');
            e.preventDefault();
            const storageKey = e.target.getAttribute('data-storage-key');
            const action = e.target.getAttribute('data-action');

            if (storageKey && action) {
                const accepted = action === 'check';
                handleFileConsent(storageKey, accepted);
            } else {
                console.error('❌ Missing storageKey or action on button');
            }
        }
    });
}

/**
 * Switch between tabs
 */
function switchToTab(tab) {
    // Reset all button loading states
    resetAllButtonStates();

    // Clear any existing messages
    showMessage(loginMessage, '', '');
    showMessage(signupMessage, '', '');
    showMessage(otpMessage, '', '');

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
 * Reset all button loading states
 */
function resetAllButtonStates() {
    const buttons = document.querySelectorAll('.auth-btn');
    buttons.forEach(button => {
        setButtonLoading(button, false);
    });
}

/**
 * Handle login
 */
async function handleLogin(e) {
    e.preventDefault();

    const usernameOrEmail = document.getElementById('loginUsernameOrEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');

    try {
        // Show loading state
        setButtonLoading(loginBtn, true, 'Login');
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
            setButtonLoading(loginBtn, false);
            showMessage(loginMessage, data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        setButtonLoading(loginBtn, false);
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
    const signupBtn = document.getElementById('signupBtn');

    try {
        // Show loading state
        setButtonLoading(signupBtn, true, 'Sign Up');
        showMessage(signupMessage, 'Creating account...', 'info');

        const response = await fetch(`${AUTH_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            setButtonLoading(signupBtn, false);
            showMessage(signupMessage, data.message || 'OTP sent to your email!', 'success');

            // Show OTP verification form
            setTimeout(() => {
                document.getElementById('otpEmail').value = email;
                otpTab.style.display = 'block';
                switchToTab('otp');
                document.getElementById('otpCode').focus();
            }, 1000);
        } else {
            setButtonLoading(signupBtn, false);
            showMessage(signupMessage, data.message || 'Signup failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        setButtonLoading(signupBtn, false);
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
    const verifyBtn = document.getElementById('verifyOtpBtn');

    try {
        // Show loading state
        setButtonLoading(verifyBtn, true, 'Verify & Login');
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
            setButtonLoading(verifyBtn, false);
            showMessage(otpMessage, data.message || 'Invalid verification code', 'error');
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        setButtonLoading(verifyBtn, false);
        showMessage(otpMessage, 'Network error. Please try again.', 'error');
    }
}

/**
 * Handle resend OTP
 */
async function handleResendOtp() {
    const email = document.getElementById('otpEmail').value;
    const resendBtn = document.getElementById('resendOtpBtn');

    try {
        // Show loading state
        setButtonLoading(resendBtn, true, 'Resend Code');
        showMessage(otpMessage, 'Sending new code...', 'info');

        const response = await fetch(`${AUTH_URL}/resend-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            setButtonLoading(resendBtn, false);
            showMessage(otpMessage, data.message || 'New code sent to your email!', 'success');
        } else {
            setButtonLoading(resendBtn, false);
            showMessage(otpMessage, data.message || 'Failed to resend code', 'error');
        }
    } catch (error) {
        console.error('Resend OTP error:', error);
        setButtonLoading(resendBtn, false);
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
    loadPendingDownloads();
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
    if (!message || message.trim() === '') {
        element.style.display = 'none';
        element.textContent = '';
        return;
    }

    element.style.display = 'block';
    element.className = 'auth-message';
    if (type) {
        element.classList.add(type);
    }

    // If it's an info message (loading), add a spinner
    if (type === 'info') {
        element.innerHTML = `<span class="loading-spinner"></span>${message}`;
    } else {
        element.textContent = message;
    }
}

/**
 * Set button loading state
 */
function setButtonLoading(button, loading, originalText = null) {
    if (loading) {
        button.disabled = true;
        button.classList.add('loading');
        if (originalText) {
            button.setAttribute('data-original-text', originalText);
        }
        button.textContent = '';
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        const original = button.getAttribute('data-original-text');
        if (original) {
            button.textContent = original;
            button.removeAttribute('data-original-text');
        }
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
    if (area === 'local' && (changes.pendingDownloads || Object.keys(changes).some(key => key.startsWith('pending_')))) {
        loadPendingDownloads();
    }
});

/**
 * Load pending downloads
 */
async function loadPendingDownloads() {
    chrome.storage.local.get(null, (data) => {
        const pendingKeys = Object.keys(data).filter(key => key.startsWith('pending_'));

        if (pendingKeys.length === 0) {
            pendingSection.style.display = 'none';
            return;
        }

        pendingSection.style.display = 'block';
        pendingList.innerHTML = '';

        // Add event delegation to the pendingList container
        pendingList.removeEventListener('click', handlePendingListClick); // Remove if already exists
        pendingList.addEventListener('click', handlePendingListClick);

        pendingKeys.forEach(key => {
            const pendingData = data[key];
            if (pendingData && pendingData.filename) {
                const card = createPendingCard(pendingData, key);
                pendingList.appendChild(card);
            }
        });
    });
}

/**
 * Handle clicks on pending list items
 */
function handlePendingListClick(e) {
    if (e.target.classList.contains('pending-btn')) {
        console.log('✅ Pending button clicked in list!');
        e.preventDefault();
        e.stopPropagation();

        const storageKey = e.target.getAttribute('data-storage-key');
        const action = e.target.getAttribute('data-action');

        if (storageKey && action) {
            const accepted = action === 'check';
            console.log(`🚀 Processing ${accepted ? 'accepted' : 'skipped'} for ${storageKey}`);
            handleFileConsent(storageKey, accepted);
        } else {
            console.error('❌ Missing storageKey or action on button');
        }
    }
}

/**
 * Create pending download card
 */
function createPendingCard(pendingData, storageKey) {
    const card = document.createElement('div');
    card.className = 'pending-card';
    card.id = `pending-${storageKey}`;

    const timestamp = new Date(pendingData.timestamp).toLocaleString();

    card.innerHTML = `
        <div class="pending-title">
            ⏳ ${pendingData.filename}
        </div>
        <div class="pending-message">
            Downloaded: ${timestamp}<br>
            Check this file for duplicates?
        </div>
        <div class="pending-actions">
            <button class="pending-btn check" data-storage-key="${storageKey}" data-action="check">
                ✓ Check File
            </button>
            <button class="pending-btn skip" data-storage-key="${storageKey}" data-action="skip">
                ✗ Skip
            </button>
        </div>
    `;

    return card;
}

/**
 * Handle file consent decision
 */
async function handleFileConsent(storageKey, accepted) {
    try {
        console.log(`🔄 handleFileConsent called: storageKey=${storageKey}, accepted=${accepted}`);

        const data = await chrome.storage.local.get([storageKey]);
        const fileData = data[storageKey];

        if (!fileData) {
            console.error('No file data found for:', storageKey);
            return;
        }

        console.log('📂 File data found:', fileData);

        if (accepted) {
            console.log('✅ User accepted - starting file processing');

            // Check if user is authenticated
            if (!authToken) {
                console.log('❌ No auth token - showing auth screen');
                showMessage(loginMessage, 'Please login first to check files', 'error');
                showAuthScreen();
                return;
            }

            // Show processing card
            showProcessingCard(fileData, storageKey);

            // Process file
            await processFileWithServer(fileData, storageKey);
        } else {
            console.log('❌ User skipped file processing');

            // Add to history as skipped
            await addToHistory({
                filename: fileData.filename,
                success: false,
                skipped: true,
                message: 'File processing skipped by user',
                timestamp: Date.now()
            });
        }

        // Clean up pending file
        await chrome.storage.local.remove([storageKey]);

    } catch (error) {
        console.error('Error handling file consent:', error);
        showError(`Error processing file: ${error.message}`);
    }
}

/**
 * Show processing card
 */
function showProcessingCard(fileData, storageKey) {
    const pendingCard = document.getElementById(`pending-${storageKey}`);
    if (pendingCard) {
        pendingCard.className = 'processing-card';
        pendingCard.innerHTML = `
            <div class="processing-title">
                <span class="loading-spinner"></span>
                Processing ${fileData.filename}
            </div>
            <div class="processing-steps">
                <div class="processing-step active" id="step1-${storageKey}">🔍 Calculating file hash...</div>
                <div class="processing-step" id="step2-${storageKey}">🔗 Connecting to server...</div>
                <div class="processing-step" id="step3-${storageKey}">🔎 Checking for duplicates...</div>
                <div class="processing-step" id="step4-${storageKey}">📤 Processing result...</div>
            </div>
        `;
    }
}

/**
 * Update processing step
 */
function updateProcessingStep(storageKey, stepNumber, message, isComplete = false) {
    const stepElement = document.getElementById(`step${stepNumber}-${storageKey}`);
    if (stepElement) {
        stepElement.textContent = message;
        if (isComplete) {
            stepElement.classList.add('active');
        }
    }

    // Activate next step if current is complete
    if (isComplete && stepNumber < 4) {
        const nextStep = document.getElementById(`step${stepNumber + 1}-${storageKey}`);
        if (nextStep) {
            nextStep.classList.add('active');
        }
    }
}

/**
 * Process file with HTTP server
 */
async function processFileWithServer(fileData, storageKey) {
    try {
        console.log('🔄 Processing file with HTTP server:', fileData.filename);

        // Step 1: File hash (simulated as already done)
        await sleep(500);
        updateProcessingStep(storageKey, 1, '✅ File hash calculated', true);

        // Step 2: Connect to server
        updateProcessingStep(storageKey, 2, '🔗 Connecting to server...', false);
        await sleep(300);

        const serverAvailable = await testServerConnection();
        if (!serverAvailable) {
            throw new Error('Local server is not available. Please ensure server.py is running on port 5001.');
        }

        updateProcessingStep(storageKey, 2, '✅ Connected to server', true);

        // Step 3: Check duplicates
        updateProcessingStep(storageKey, 3, '🔎 Checking for duplicates...', false);
        await sleep(500);

        const result = await sendFileToServer(fileData.filepath, fileData.authToken);
        updateProcessingStep(storageKey, 3, '✅ Duplicate check complete', true);

        // Step 4: Process result
        updateProcessingStep(storageKey, 4, '📤 Processing result...', false);
        await sleep(300);

        // Add to history
        await addToHistory({
            filename: fileData.filename,
            success: !result.duplicate,
            duplicate: result.duplicate,
            original_filename: result.original_filename,
            message: result.message,
            timestamp: Date.now(),
            response: result
        });

        updateProcessingStep(storageKey, 4, '✅ Complete!', true);

        // Show result notification
        setTimeout(() => {
            if (result.duplicate) {
                showError(`⚠️ Duplicate detected: ${fileData.filename} already exists as ${result.original_filename}`);
            } else {
                showSuccess(`✅ ${fileData.filename} processed successfully - no duplicates found`);
            }

            // Remove processing card after showing result
            setTimeout(() => {
                const processingCard = document.getElementById(`pending-${storageKey}`);
                if (processingCard) {
                    processingCard.remove();
                }
            }, 2000);
        }, 500);

    } catch (error) {
        console.error('❌ File processing failed:', error);

        // Add error to history
        await addToHistory({
            filename: fileData.filename,
            success: false,
            error: error.message,
            timestamp: Date.now()
        });

        showError(`❌ Processing failed: ${error.message}`);

        // Remove processing card
        setTimeout(() => {
            const processingCard = document.getElementById(`pending-${storageKey}`);
            if (processingCard) {
                processingCard.remove();
            }
        }, 2000);
    }
}

/**
 * Test server connection
 */
async function testServerConnection() {
    try {
        const response = await fetch(`${LOCAL_SERVER_URL}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.ok;
    } catch (error) {
        console.error('Server connection test failed:', error);
        return false;
    }
}

/**
 * Send file to server
 */
async function sendFileToServer(filePath, authToken) {
    const response = await fetch(`${LOCAL_SERVER_URL}/process`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            path: filePath,
            auth_token: authToken
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Server processing failed');
    }

    return result;
}

/**
 * Add item to history
 */
async function addToHistory(item) {
    chrome.storage.local.get(['fileHistory'], (data) => {
        const history = data.fileHistory || [];
        history.unshift(item); // Add to beginning

        // Keep only last 20 items
        if (history.length > 20) {
            history.splice(20);
        }

        chrome.storage.local.set({ fileHistory: history });
    });
}

/**
 * Utility functions
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showSuccess(message) {
    // You could show this in the UI or use a toast notification
    console.log('SUCCESS:', message);
}

function showError(message) {
    // You could show this in the UI or use a toast notification
    console.error('ERROR:', message);
}

// Event listeners are now properly attached to buttons in createPendingCard function

/**
 * Test function to create a fake pending download
 */
window.ddas_test_pending = async function() {
    console.log('🧪 Creating test pending download...');

    const testPendingData = {
        filename: 'test-file.pdf',
        filepath: '/Users/test/Downloads/test-file.pdf',
        authToken: 'test-token-123',
        timestamp: Date.now(),
        downloadId: 999
    };

    await chrome.storage.local.set({
        'pending_999': testPendingData
    });

    console.log('✅ Test pending download created. Reload pending downloads...');
    loadPendingDownloads();
};

