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
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

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
            reconnectAttempts = 0;
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

// Send file to local HTTP server
async function sendFileToServer(filePath, authToken) {
    try {
        console.log('📤 Sending file to server:', filePath);
        console.log('🔑 Using auth token:', authToken ? `${authToken.substring(0, 20)}...` : 'None');

        const requestData = {
            path: filePath,
            auth_token: authToken
        };

        console.log('📋 Request data:', requestData);

        const response = await fetch(`${LOCAL_SERVER_URL}/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Server error response:', errorText);
            throw new Error(`Server error (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        console.log('📨 Server response:', result);

        if (result.success) {
            return result;
        } else {
            throw new Error(result.error || 'Server processing failed');
        }

    } catch (error) {
        console.error('❌ Error sending to server:', error.message);
        console.error('❌ Full error:', error);
        throw error;
    }
}

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

        // Show immediate notification that we detected a download
        showNotification('download_detected', {
            type: 'basic',
            title: 'DDAS - Download Detected',
            message: `Processing download ${delta.id}...`
        });

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
                    showNotification('download_not_found', {
                        type: 'basic',
                        title: 'DDAS - Error',
                        message: `Could not find download with ID ${delta.id}`
                    });
                }
            } catch (error) {
                console.error('❌ Error processing download:', error);
                showNotification('processing_error', {
                    type: 'basic',
                    title: 'DDAS - Processing Error',
                    message: `Error processing download: ${error.message}`
                });
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

        // Clear the initial detection notification (popup auto-removes)

        // Check if user is authenticated
        console.log('🔐 Checking authentication...');
        const authData = await chrome.storage.local.get(['authToken']);
        console.log('🔐 Auth data found:', !!authData.authToken);

        if (!authData.authToken) {
            console.log('❌ User not authenticated - showing login notification');
            showNotification('login_required', {
                type: 'basic',
                title: 'DDAS - Login Required',
                message: `File downloaded: ${filename}. Please login to check for duplicates.`
            });
            return;
        }

        console.log('✅ User authenticated - showing consent notification');
        // Show consent notification
        showConsentNotification(download, authData.authToken);

    } catch (error) {
        console.error('❌ Error in handleDownloadCompletion:', error);
        showNotification('handler_error', {
            type: 'basic',
            title: 'DDAS - Handler Error',
            message: `Error in download handler: ${error.message}`
        });
    }
}

// Show consent notification for user approval
function showConsentNotification(download, authToken) {
    console.log('🔔 Creating consent notification...');
    console.log('📂 Download for consent:', JSON.stringify(download, null, 2));

    const filename = download.filename ? download.filename.split('/').pop() : 'Unknown file';
    const notificationId = `consent_${download.id}`;

    console.log('🔔 Notification ID:', notificationId);
    console.log('📄 Filename for notification:', filename);

    // Create consent notification
    console.log('🔔 Calling showNotification...');
    showNotification(notificationId, {
        type: 'basic',
        title: 'DDAS - Check File for Duplicates?',
        message: `${filename} - Click this notification to check for duplicates`
    });

    // Store pending file data
    const pendingData = {
        filename: filename,
        filepath: download.filename,
        authToken: authToken,
        timestamp: Date.now(),
        downloadId: download.id
    };

    console.log('💾 Storing pending data:', JSON.stringify(pendingData, null, 2));

    chrome.storage.local.set({
        [`pending_${download.id}`]: pendingData
    }).then(() => {
        console.log('✅ Pending data stored successfully');
    }).catch((error) => {
        console.error('❌ Failed to store pending data:', error);
    });
}

// Handle consent responses from in-page popups
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log('📨 Message received:', message);

    if (message.action === 'consentResponse' && message.notificationId.startsWith('consent_')) {
        const downloadId = message.notificationId.replace('consent_', '');
        console.log('✅ User consented to file checking');

        try {
            const data = await chrome.storage.local.get([`pending_${downloadId}`]);
            const fileData = data[`pending_${downloadId}`];

            if (fileData) {
                console.log('📂 Processing file:', fileData.filename);
                await processFileWithServer(fileData);

                // Clean up
                await chrome.storage.local.remove([`pending_${downloadId}`]);
            } else {
                console.error('❌ No pending file data found');
            }
        } catch (error) {
            console.error('❌ Error processing consent:', error);
        }

        sendResponse({success: true});
        return true; // Keep message channel open for async response
    }
});

// Process file using HTTP server
async function processFileWithServer(fileData) {
    try {
        console.log('🔄 Processing file with HTTP server:', fileData.filename);

        // Update progress: Step 1 - File hash calculation (already shown)
        updateProgressStep(1, '✅ File hash calculated');

        // Update progress: Step 2 - Connecting to server
        updateProgressStep(2, '🔗 Connecting to server...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX

        // Test server connection first
        const serverAvailable = await testServerConnection();
        if (!serverAvailable) {
            throw new Error('Local server is not available');
        }

        updateProgressStep(2, '✅ Connected to server');

        // Update progress: Step 3 - Checking duplicates
        updateProgressStep(3, '🔎 Checking for duplicates...');
        await new Promise(resolve => setTimeout(resolve, 300));

        // Send file to server for processing
        const result = await sendFileToServer(fileData.filepath, fileData.authToken);

        updateProgressStep(3, '✅ Duplicate check complete');

        // Update progress: Step 4 - Processing result
        updateProgressStep(4, '📤 Processing result...');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Show result notification
        if (result.duplicate) {
            showDuplicateAlert(result);
        } else {
            showSuccessNotification(result);
        }

    } catch (error) {
        console.error('❌ File processing failed:', error);

        // Show error notification with retry option
        showErrorNotification(error.message, fileData);
    }
}

// Helper function to update progress steps
function updateProgressStep(stepNumber, message) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0] && !tabs[0].url.startsWith('chrome://')) {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                func: (step, msg) => {
                    const stepElement = document.getElementById(`step-${step}`);
                    if (stepElement) {
                        stepElement.innerHTML = msg;
                        stepElement.style.opacity = '1';
                        stepElement.style.fontWeight = 'bold';
                    }
                },
                args: [stepNumber, message]
            }).catch(() => {
                console.log('Could not update progress on current tab');
            });
        }
    });
}

// Show duplicate file alert
function showDuplicateAlert(result) {
    console.log('⚠️ Duplicate file detected:', result);

    // Show notification
    showNotification('duplicate_found', {
        type: 'basic',
        title: 'DDAS - Duplicate File Found',
        message: `${result.filename || 'File'} already exists as: ${result.original_filename || 'existing file'}`
    });

    // Also show browser alert for visibility
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0] && !tabs[0].url.startsWith('chrome://')) {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                func: (filename, original, message) => {
                    alert(`🚨 DUPLICATE FILE DETECTED!\n\n${message}`);
                },
                args: [result.filename || 'Unknown file', result.original_filename || 'existing file', result.message || 'Duplicate detected']
            }).catch(() => {
                console.log('Could not show alert on current tab');
            });
        }
    });
}

// Show success notification
function showSuccessNotification(result) {
    console.log('✅ File processed successfully:', result);

    showNotification('upload_success', {
        type: 'basic',
        title: 'DDAS - File Processed',
        message: result.message || `${result.filename || 'File'} uploaded successfully`
    });
}

// Show error notification with retry option
function showErrorNotification(errorMessage, fileData = null) {
    console.error('❌ Showing error notification:', errorMessage);

    let message = errorMessage;
    let title = 'DDAS - Processing Error';

    if (errorMessage.includes('Local server is not available')) {
        title = 'DDAS - Server Not Running';
        message = 'Local server is not running. Please start server.py and try again.';
    } else if (errorMessage.includes('Failed to fetch')) {
        title = 'DDAS - Connection Error';
        message = 'Cannot connect to local server. Please ensure server.py is running on port 5001.';
    } else if (errorMessage.includes('Backend')) {
        title = 'DDAS - Backend Error';
        message = 'Backend server error. Please check if the Spring Boot backend is running on port 8080.';
    }

    showNotification('processing_error', {
        type: 'basic',
        title: title,
        message: `${message}\n\nOriginal error: ${errorMessage}`
    });

    // If we have file data, offer retry after server reconnection
    if (fileData && errorMessage.includes('server')) {
        scheduleRetry(fileData);
    }
}

// Schedule retry for failed file processing
function scheduleRetry(fileData) {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log('❌ Max retry attempts reached');
        return;
    }

    reconnectAttempts++;
    const retryDelay = 5000 * reconnectAttempts; // Exponential backoff

    console.log(`🔄 Scheduling retry ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${retryDelay}ms`);

    setTimeout(async () => {
        const serverAvailable = await testServerConnection();
        if (serverAvailable) {
            console.log('✅ Server reconnected, retrying file processing');
            await processFileWithServer(fileData);
        } else {
            console.log('❌ Server still not available');
            scheduleRetry(fileData);
        }
    }, retryDelay);
}

// Utility function to show in-browser HTML popup instead of notifications
function showNotification(id, options = {}) {
    try {
        console.log('🔔 Creating in-browser popup:', id, options);

        const title = options.title || 'DDAS Notification';
        const message = options.message || 'No message provided';

        // Get current active tab and inject popup
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0] && !tabs[0].url.startsWith('chrome://') && !tabs[0].url.startsWith('chrome-extension://')) {
                chrome.scripting.executeScript({
                    target: {tabId: tabs[0].id},
                    func: showInPagePopup,
                    args: [id, title, message, options.buttons || null]
                }).catch((error) => {
                    console.log('Could not inject popup on current tab:', error.message);
                    // Fallback: try to open a new tab with the popup
                    showPopupInNewTab(id, title, message, options.buttons);
                });
            } else {
                // Fallback: open popup in new tab for chrome:// pages
                showPopupInNewTab(id, title, message, options.buttons);
            }
        });

        console.log('✅ In-browser popup created successfully:', id);

    } catch (error) {
        console.error('❌ Exception in showNotification:', error);
        console.error('   ID:', id);
        console.error('   Options:', options);
    }
}

// Function to inject popup into current page
function showInPagePopup(id, title, message, buttons) {
    // Remove any existing DDAS popup
    const existingPopup = document.getElementById('ddas-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create popup HTML
    const popup = document.createElement('div');
    popup.id = 'ddas-popup';
    popup.setAttribute('data-notification-id', id);

    const isConsent = id.startsWith('consent_');
    const isDuplicate = id === 'duplicate_found';

    let bgColor = '#4CAF50'; // Default green
    if (isDuplicate) bgColor = '#f44336'; // Red for duplicates
    if (isConsent) bgColor = '#2196F3'; // Blue for consent

    popup.innerHTML = `
        <div id="ddas-backdrop" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 2147483646;
            pointer-events: all;
        "></div>
        <div id="ddas-popup-content" style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 3px solid ${bgColor};
            border-radius: 12px;
            padding: 25px;
            min-width: 400px;
            max-width: 500px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 15px;
            line-height: 1.5;
            pointer-events: all;
            user-select: none;
        ">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="
                    width: 8px;
                    height: 8px;
                    background: ${bgColor};
                    border-radius: 50%;
                    margin-right: 10px;
                "></div>
                <strong style="color: #333; font-size: 16px;">${title}</strong>
            </div>
            <div style="color: #555; margin-bottom: 15px;">
                ${message}
            </div>
            <div style="text-align: right;">
                ${isConsent ? `
                    <button id="ddas-check-btn" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 6px;
                        margin-right: 10px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        transition: background-color 0.2s;
                        pointer-events: all;
                    " onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4CAF50'">✓ Check File</button>
                    <button id="ddas-skip-btn" style="
                        background: #757575;
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        transition: background-color 0.2s;
                        pointer-events: all;
                    " onmouseover="this.style.background='#616161'" onmouseout="this.style.background='#757575'">✗ Skip</button>
                ` : `
                    <button id="ddas-ok-btn" style="
                        background: ${bgColor};
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        transition: background-color 0.2s;
                        pointer-events: all;
                    ">OK</button>
                `}
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Add event listeners for buttons
    setTimeout(() => {
        if (isConsent) {
            const checkBtn = document.getElementById('ddas-check-btn');
            const skipBtn = document.getElementById('ddas-skip-btn');

            if (checkBtn) {
                checkBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('✅ User clicked Check File');
                    handleConsentResponse(id, true);
                });
            }

            if (skipBtn) {
                skipBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('❌ User clicked Skip');
                    handleConsentResponse(id, false);
                });
            }
        } else {
            const okBtn = document.getElementById('ddas-ok-btn');
            if (okBtn) {
                okBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('👍 User clicked OK');
                    const popupElement = document.getElementById('ddas-popup');
                    if (popupElement) {
                        popupElement.remove();
                    }
                });
            }
        }
    }, 100);

    // Auto-remove after 15 seconds if not a consent popup
    if (!isConsent) {
        setTimeout(() => {
            const popupElement = document.getElementById('ddas-popup');
            if (popupElement) {
                popupElement.remove();
            }
        }, 15000);
    }

    // Handle consent response function
    function handleConsentResponse(notificationId, accepted) {
        console.log('🔄 Handling consent response:', notificationId, accepted);

        if (accepted) {
            // Show processing popup immediately
            const popupElement = document.getElementById('ddas-popup');
            if (popupElement) {
                popupElement.innerHTML = `
                    <div style="
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: white;
                        border: 3px solid #FF9800;
                        border-radius: 12px;
                        padding: 25px;
                        min-width: 400px;
                        max-width: 500px;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                        z-index: 2147483647;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        font-size: 15px;
                        line-height: 1.5;
                        text-align: center;
                        pointer-events: all;
                    ">
                        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                            <div style="
                                width: 20px;
                                height: 20px;
                                border: 3px solid #FF9800;
                                border-top: 3px solid transparent;
                                border-radius: 50%;
                                animation: spin 1s linear infinite;
                                margin-right: 10px;
                            "></div>
                            <strong style="color: #333; font-size: 18px;">Processing File...</strong>
                        </div>
                        <div id="progress-steps" style="color: #666; font-size: 14px; line-height: 2;">
                            <div id="step-1">🔍 Calculating file hash...</div>
                            <div id="step-2" style="opacity: 0.5;">🔗 Connecting to server...</div>
                            <div id="step-3" style="opacity: 0.5;">🔎 Checking for duplicates...</div>
                            <div id="step-4" style="opacity: 0.5;">📤 Processing result...</div>
                        </div>
                        <style>
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        </style>
                    </div>
                `;
            }
            
            // Trigger the consent handling in background script
            chrome.runtime.sendMessage({
                action: 'consentResponse',
                notificationId: notificationId,
                accepted: true
            }, (response) => {
                console.log('✅ Consent message sent to background script');
            });
        } else {
            // User clicked skip - remove popup
            const popupElement = document.getElementById('ddas-popup');
            if (popupElement) {
                popupElement.remove();
            }
        }
    }
}

// Fallback function to show popup in new tab
function showPopupInNewTab(id, title, message, buttons) {
    const popupHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    max-width: 500px;
                    margin: 50px auto;
                    padding: 30px;
                    text-align: center;
                    background: #f5f5f5;
                }
                .popup {
                    background: white;
                    border: 3px solid #2196F3;
                    border-radius: 12px;
                    padding: 30px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }
                .title { font-size: 24px; margin-bottom: 20px; color: #333; }
                .message { font-size: 16px; margin-bottom: 30px; color: #555; line-height: 1.5; }
                button {
                    background: #2196F3;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 0 10px;
                }
                button:hover { background: #1976D2; }
                .skip { background: #757575; }
                .skip:hover { background: #616161; }
            </style>
        </head>
        <body>
            <div class="popup">
                <div class="title">${title}</div>
                <div class="message">${message}</div>
                <button onclick="window.close()">OK</button>
            </div>
        </body>
        </html>
    `;

    chrome.tabs.create({
        url: 'data:text/html;charset=utf-8,' + encodeURIComponent(popupHtml),
        active: false
    });
}

// Extension initialization
async function initializeExtension() {
    console.log('🔧 Initializing DDAS Extension (HTTP Mode)...');

    // Start keep-alive mechanism
    keepServiceWorkerAlive();

    // Test server connection
    const serverConnected = await testServerConnection();

    // Show initialization notification
    if (serverConnected) {
        showNotification('extension_ready', {
            type: 'basic',
            title: 'DDAS - Ready',
            message: 'Extension ready. Server connected. Download files to test duplicate detection.'
        });
    } else {
        showNotification('server_offline', {
            type: 'basic',
            title: 'DDAS - Server Offline',
            message: 'Extension ready but local server is not running. Start server.py to enable file processing.'
        });
    }

    console.log('✅ DDAS Extension initialized');
}

// These event listeners are already defined above, removing duplicates

// Debug functions for testing
globalThis.ddas_test_server = async function() {
    console.log('🧪 Testing server connection...');
    const connected = await testServerConnection();
    console.log('Server status:', connected ? 'Connected' : 'Offline');
    return connected;
};

globalThis.ddas_test_notification = function() {
    console.log('🧪 Testing notification system...');
    showNotification('test_notification', {
        type: 'basic',
        title: 'DDAS - Test Notification',
        message: 'This is a test notification. Click to dismiss.'
    });
};

globalThis.ddas_test_consent = function() {
    console.log('🧪 Testing consent notification...');
    const mockDownload = {
        id: 999,
        filename: '/Users/test/Downloads/test_file.pdf'
    };
    showConsentNotification(mockDownload, 'fake-auth-token');
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

// Immediate service worker activity test
console.log('🔧 Testing service worker activity...');
chrome.action.setBadgeText({text: 'ON'});
chrome.action.setBadgeBackgroundColor({color: '#4CAF50'});
console.log('✅ Service worker badge set - worker is ACTIVE');

// Initialize extension immediately
initializeExtension();

// Test notification system immediately
setTimeout(() => {
    console.log('🧪 Testing notification system on load...');
    showNotification('startup_test', {
        type: 'basic',
        title: 'DDAS - Service Worker Active',
        message: 'Service worker is active and ready. Extension badge shows "ON". Download a file to test.'
    });
}, 3000);

console.log('✅ DDAS Extension loaded and ready');

// Keep pinging to maintain activity
let activityPing = 0;
setInterval(() => {
    activityPing++;
    console.log(`💓 Service Worker Activity Ping #${activityPing}`);
    chrome.action.setBadgeText({text: activityPing.toString()});
}, 30000); // Every 30 seconds

