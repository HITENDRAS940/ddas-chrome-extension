// Background service worker for Chrome Extension
// Monitors file downloads and can trigger automatic processing

console.log('DDAS Background Service Worker Started');

// Listen for download completion
chrome.downloads.onChanged.addListener((downloadDelta) => {
    if (downloadDelta.state && downloadDelta.state.current === 'complete') {
        console.log('Download completed:', downloadDelta);

        // Get download details
        chrome.downloads.search({ id: downloadDelta.id }, (downloads) => {
            if (downloads && downloads.length > 0) {
                const download = downloads[0];
                console.log('Downloaded file:', download.filename);

                // Notify popup
                chrome.runtime.sendMessage({
                    type: 'FILE_DOWNLOADED',
                    fileName: download.filename,
                    url: download.url,
                    filePath: download.filename
                });

                // Show notification
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'DDAS - File Downloaded',
                    message: `${download.filename} - Click extension to check for duplicates`,
                    priority: 2
                });
            }
        });
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    sendResponse({ status: 'received' });
});

