// Configuration
const API_BASE_URL = 'http://localhost:8080/api/files';
const USER_ID = 'user_demo_001'; // In production, this would come from authentication

// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const selectedFileName = document.getElementById('selectedFileName');
const loader = document.getElementById('loader');
const statusSection = document.getElementById('statusSection');
const emptyState = document.getElementById('emptyState');
const userIdDisplay = document.getElementById('userId');

// Set user ID
userIdDisplay.textContent = USER_ID;

// Load previous status from storage
loadStatusHistory();

// Upload button click handler
uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

// File input change handler
fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        selectedFileName.textContent = `Selected: ${file.name}`;
        await uploadFile(file);
    }
});

/**
 * Upload file to backend API
 */
async function uploadFile(file) {
    try {
        // Show loader
        showLoader(true);
        hideEmptyState();

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', USER_ID);

        // Send to backend
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        // Hide loader
        showLoader(false);

        // Display result
        displayStatus(result, file.name);

        // Save to history
        saveToHistory(result, file.name);

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

    statusCard.innerHTML = `
        <div class="status-title">
            <span class="icon">❌</span>
            <span>Error</span>
        </div>
        <div class="status-message">${message}</div>
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
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FILE_DOWNLOADED') {
        console.log('File download detected:', message.fileName);
        // You can add auto-processing here if needed
    }
});

