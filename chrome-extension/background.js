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
                await notifyDownloadComplete(download);
            }
        });
    }
});

/**
 * Notify user of download completion and prompt to check for duplicates
 */
async function notifyDownloadComplete(download) {
    console.log('📥 Download complete:', download.filename);

    const filename = download.filename.split('/').pop(); // Get just the filename

    // Create notification with button to check for duplicates
    if (chrome.notifications && chrome.notifications.create) {
        chrome.notifications.create(download.id.toString(), {
            type: 'basic',
            iconUrl: 'icon128.png',
            title: '🔍 DDAS - File Downloaded',
            message: `${filename}\n\nClick to check for duplicates`,
            priority: 2,
            requireInteraction: true, // Keeps notification visible
            buttons: [
                { title: 'Check for Duplicates' }
            ]
        });
    }

    // Store download info for quick access
    chrome.storage.local.set({
        lastDownload: {
            filename: filename,
            path: download.filename,
            timestamp: new Date().toISOString()
        }
    });

    // Auto-open popup after 1 second
    setTimeout(() => {
        if (chrome.action && chrome.action.openPopup) {
            chrome.action.openPopup().catch((err) => {
                console.log('Auto-open popup failed (user may need to click icon):', err);
            });
        }
    }, 1000);
}

// Listen for notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (buttonIndex === 0) {
        // Open the extension popup
        if (chrome.action && chrome.action.openPopup) {
            chrome.action.openPopup().catch(() => {
                // If popup can't open programmatically, just clear the notification
                console.log('Please click the DDAS extension icon to check for duplicates');
            });
        }
        // Clear the notification
        chrome.notifications.clear(notificationId);
    }
});

// Listen for notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
    // Open the extension popup when notification is clicked
    if (chrome.action && chrome.action.openPopup) {
        chrome.action.openPopup().catch(() => {
            console.log('Please click the DDAS extension icon');
        });
    }
    chrome.notifications.clear(notificationId);
});

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

        if (chrome.notifications && chrome.notifications.create) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon128.png',
                title: notificationTitle,
                message: notificationMessage,
                priority: 2
            });
        }

        // Save to history
        saveToHistory(result, file.name);

        console.log('✅ File processed successfully:', result);

        return result;

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

