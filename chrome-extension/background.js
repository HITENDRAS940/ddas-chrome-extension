// Background service worker for Chrome Extension
// Automatically monitors file downloads and processes them for duplicate detection

console.log('🚀 DDAS Background Service Worker Started - Auto-monitoring enabled');

const API_BASE_URL = 'http://localhost:8080/api/files';
const USER_ID = 'user_demo_001'; // In production, this would come from authentication

// Listen for download completion
chrome.downloads.onChanged.addListener(async (downloadDelta) => {
    // Only process when download state changes to 'complete'
    if (downloadDelta.state && downloadDelta.state.current === 'complete') {
        console.log('📥 Download completed, processing...', downloadDelta.id);

        // Get download details
        chrome.downloads.search({ id: downloadDelta.id }, async (downloads) => {
            if (downloads && downloads.length > 0) {
                const download = downloads[0];
                await processDownloadedFile(download);
            }
        });
    }
});

/**
 * Process downloaded file automatically
 */
async function processDownloadedFile(download) {
    console.log('🔍 Processing download:', download.filename);

    try {
        // Show initial notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon.svg'),
            title: 'DDAS - Processing Download',
            message: `Checking ${download.filename} for duplicates...`,
            priority: 1
        });

        // Get file blob from the downloaded file
        const response = await fetch(download.url);
        const blob = await response.blob();
        const file = new File([blob], download.filename);

        // Upload to backend for duplicate detection
        await uploadFileToBackend(file);

    } catch (error) {
        console.error('❌ Error processing download:', error);

        // Show error notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon.svg'),
            title: 'DDAS - Error',
            message: `Failed to process ${download.filename}. Backend may not be running.`,
            priority: 2
        });

        // Store error in history
        saveToHistory({
            duplicate: false,
            message: `Error: ${error.message}`,
            fileName: download.filename
        });
    }
}

/**
 * Upload file to backend API for duplicate detection
 */
async function uploadFileToBackend(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', USER_ID);

    try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        // Show result notification
        const notificationTitle = result.duplicate
            ? '⚠️ DDAS - Duplicate Detected!'
            : '✅ DDAS - File Stored Successfully!';

        const notificationMessage = result.duplicate
            ? `${file.name} already exists in your storage.`
            : `${file.name} has been stored successfully.`;

        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon.svg'),
            title: notificationTitle,
            message: notificationMessage,
            priority: 2
        });

        // Save to history
        saveToHistory(result, file.name);

        console.log('✅ File processed successfully:', result);

    } catch (error) {
        console.error('❌ Backend upload failed:', error);
        throw error;
    }
}

/**
 * Save result to Chrome storage for history
 */
function saveToHistory(result, fileName) {
    chrome.storage.local.get(['statusHistory'], (data) => {
        let history = data.statusHistory || [];

        history.unshift({
            fileName: fileName || result.fileName,
            result: result,
            timestamp: new Date().toISOString()
        });

        // Keep only last 50 items
        history = history.slice(0, 50);

        chrome.storage.local.set({ statusHistory: history }, () => {
            console.log('💾 Saved to history');
        });
    });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Background received message:', message);

    if (message.type === 'GET_STATUS') {
        sendResponse({ status: 'running', autoDetect: true });
    }

    return true;
});

console.log('✅ DDAS Auto-detection ready!');

