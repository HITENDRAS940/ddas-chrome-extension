// DDAS Chrome Extension - HTTP Server Communication
// Replaces native messaging with local HTTP server communication

console.log('🚀 DDAS Chrome Extension Started (HTTP Server Mode)');
console.log('🔧 Service Worker Status: ACTIVE');

// Chrome Extension Service Worker - no need for traditional SW events

// Configuration
const LOCAL_SERVER_URL = "http://localhost:5001";
const BACKEND_API_URL = "http://localhost:8080/api";

// Extension state
let isServerConnected = false;

// Keep service worker alive
let keepAliveInterval;

function keepServiceWorkerAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
    }

    keepAliveInterval = setInterval(() => {
        console.log('💓 Service worker heartbeat - staying active');
        // Multiple API calls to ensure worker stays active
        chrome.runtime.getPlatformInfo(() => {
            if (chrome.runtime.lastError) {
                console.log('Heartbeat error:', chrome.runtime.lastError.message);
            }
        });

        // Additional keep-alive calls
        chrome.storage.local.get(['keepAlive'], () => {
            chrome.storage.local.set({keepAlive: Date.now()});
        });

        // Check downloads to maintain active state
        chrome.downloads.search({limit: 1}, () => {
            if (chrome.runtime.lastError) {
                console.log('Downloads check error:', chrome.runtime.lastError.message);
            }
        });
    }, 20000); // Every 20 seconds (more frequent)
}

// Service worker activation and lifecycle management
chrome.runtime.onStartup.addListener(() => {
    console.log('🚀 Service worker startup event');
    keepServiceWorkerAlive();
    initializeExtension();
});

chrome.runtime.onInstalled.addListener((details) => {
    console.log('🚀 Service worker installed/updated:', details.reason);
    keepServiceWorkerAlive();
    initializeExtension();
});

// Handle service worker suspension
chrome.runtime.onSuspend.addListener(() => {
    console.log('⏸️ Service worker suspending');
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
    }
});

// Handle service worker suspension cancellation
chrome.runtime.onSuspendCanceled.addListener(() => {
    console.log('▶️ Service worker suspension cancelled');
    keepServiceWorkerAlive();
});

// Update badge count with pending downloads
async function updateBadgeCount() {
    try {
        const data = await chrome.storage.local.get();
        const pendingCount = Object.keys(data).filter(key => key.startsWith('pending_')).length;

        if (pendingCount > 0) {
            chrome.action.setBadgeText({text: pendingCount.toString()});
            chrome.action.setBadgeBackgroundColor({color: '#FF9800'});
        } else {
            chrome.action.setBadgeText({text: ''});
        }

        console.log(`📊 Badge updated: ${pendingCount} pending downloads`);
    } catch (error) {
        console.error('❌ Error updating badge:', error);
    }
}

// Test server connection
async function testServerConnection() {
    try {
        console.log('🔗 Testing connection to local server...');
        const response = await fetch(`${LOCAL_SERVER_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Local server connected:', data);
            isServerConnected = true;
            return true;
        } else {
            console.error('❌ Server responded with error:', response.status);
            isServerConnected = false;
            return false;
        }
    } catch (error) {
        console.error('❌ Cannot connect to local server:', error.message);
        isServerConnected = false;
        return false;
    }
}

// Simplified background script - only handles download detection and storage

// Handle download completion
chrome.downloads.onChanged.addListener(async (delta) => {
    console.log('📥 Download event received:', JSON.stringify(delta, null, 2));

    // Keep service worker alive on download activity
    keepServiceWorkerAlive();

    // Log all state changes for debugging
    if (delta.state) {
        console.log(`🔄 Download ${delta.id} state changed to: ${delta.state.current}`);
    }

    if (delta.state && delta.state.current === 'complete') {
        console.log('✅ Download completed with ID:', delta.id);

        // Process after a short delay to ensure file is ready
        setTimeout(async () => {
            try {
                console.log('🔍 Searching for download with ID:', delta.id);
                const downloads = await chrome.downloads.search({id: delta.id});
                console.log('🔍 Search results:', JSON.stringify(downloads, null, 2));

                if (downloads && downloads.length > 0) {
                    const download = downloads[0];
                    console.log('📂 Processing download:', JSON.stringify(download, null, 2));
                    await handleDownloadCompletion(download);
                } else {
                    console.error('❌ No download found with ID:', delta.id);
                }
            } catch (error) {
                console.error('❌ Error processing download:', error);
            }
        }, 2000);
    }
});

// Handle completed download
async function handleDownloadCompletion(download) {
    try {
        console.log('🔄 Starting download completion handler...');
        console.log('📂 Download object:', JSON.stringify(download, null, 2));

        const filename = download.filename ? download.filename.split('/').pop() : 'Unknown file';
        console.log('📄 Extracted filename:', filename);
        console.log('📁 Full path:', download.filename);

        // Check if user is authenticated
        console.log('🔐 Checking authentication...');
        const authData = await chrome.storage.local.get(['authToken']);
        console.log('🔐 Auth data found:', !!authData.authToken);

        if (!authData.authToken) {
            console.log('❌ User not authenticated - storing pending file for later');
            // Still store the file, user can login later and then process it
        }

        // Store as pending download for popup to handle
        const pendingData = {
            filename: filename,
            filepath: download.filename,
            authToken: authData.authToken || null,
            timestamp: Date.now(),
            downloadId: download.id
        };

        console.log('💾 Storing pending download:', JSON.stringify(pendingData, null, 2));

        await chrome.storage.local.set({
            [`pending_${download.id}`]: pendingData
        });

        // Update badge to show pending downloads count
        updateBadgeCount();

        console.log('✅ Download stored as pending - user can process via extension popup');

    } catch (error) {
        console.error('❌ Error in handleDownloadCompletion:', error);
    }
}

// Listen for storage changes to update badge
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        const hasPendingChanges = Object.keys(changes).some(key => key.startsWith('pending_'));
        if (hasPendingChanges) {
            updateBadgeCount();
        }
    }
});









// Extension initialization
async function initializeExtension() {
    console.log('🔧 Initializing DDAS Extension (Simplified Mode)...');

    // Start keep-alive mechanism
    keepServiceWorkerAlive();

    // Test server connection
    const serverConnected = await testServerConnection();
    console.log(`🔗 Server connection status: ${serverConnected ? 'Connected' : 'Offline'}`);

    // Set initial badge
    chrome.action.setBadgeText({text: ''});
    chrome.action.setBadgeBackgroundColor({color: '#4CAF50'});

    console.log('✅ DDAS Extension initialized - Ready to detect downloads');
}



// Debug functions for testing
globalThis.ddas_test_server = async function() {
    console.log('🧪 Testing server connection...');
    const connected = await testServerConnection();
    console.log('Server status:', connected ? 'Connected' : 'Offline');
    return connected;
};


globalThis.ddas_test_downloads = async function() {
    console.log('🧪 Testing download detection...');
    try {
        const downloads = await chrome.downloads.search({limit: 5, orderBy: ['-startTime']});
        console.log('Recent downloads:', downloads);
        return downloads;
    } catch (error) {
        console.error('Error getting downloads:', error);
        return null;
    }
};

globalThis.ddas_debug_storage = async function() {
    console.log('🧪 Checking storage contents...');
    try {
        const allStorage = await chrome.storage.local.get();
        console.log('Storage contents:', allStorage);
        return allStorage;
    } catch (error) {
        console.error('Error reading storage:', error);
        return null;
    }
};

// Initialize extension immediately
initializeExtension();

console.log('✅ DDAS Extension loaded and ready');


