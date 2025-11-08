// Test script for Chrome extension
console.log('DDAS Extension Test - Service Worker Registration Check');

// Simple test to verify the extension can load
const testExtension = () => {
    console.log('Extension test running...');
    console.log('LOCAL_SERVER_URL:', typeof LOCAL_SERVER_URL !== 'undefined' ? LOCAL_SERVER_URL : 'Not defined');
    console.log('BACKEND_API_URL:', typeof BACKEND_API_URL !== 'undefined' ? BACKEND_API_URL : 'Not defined');
    console.log('Chrome APIs available:', {
        downloads: typeof chrome !== 'undefined' && !!chrome.downloads,
        storage: typeof chrome !== 'undefined' && !!chrome.storage,
        scripting: typeof chrome !== 'undefined' && !!chrome.scripting,
        runtime: typeof chrome !== 'undefined' && !!chrome.runtime
    });
    return 'Extension test complete';
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testExtension };
}
