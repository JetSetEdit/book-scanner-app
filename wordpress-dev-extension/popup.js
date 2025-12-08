document.addEventListener('DOMContentLoaded', () => {
    const hardReloadBtn = document.getElementById('hardReloadBtn');
    const purgeCacheBtn = document.getElementById('purgeCacheBtn');
    const statusDiv = document.getElementById('status');

    function showStatus(msg, type = 'info') {
        statusDiv.textContent = msg;
        statusDiv.style.color = type === 'error' ? '#ef4444' : '#94a3b8';
        setTimeout(() => {
            statusDiv.textContent = '';
        }, 3000);
    }

    hardReloadBtn.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                // Hard reload ignores cache for the current page load
                await chrome.tabs.reload(tab.id, { bypassCache: true });
                window.close();
            }
        } catch (err) {
            showStatus('Error: ' + err.message, 'error');
        }
    });

    purgeCacheBtn.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) return;

            const url = new URL(tab.url);
            const origin = url.origin;

            // We can only clear these data types by origin.
            // Standard HTTP cache is global, but Hard Reload (bypassCache: true) handles that for the immediate load.
            const removalOptions = {
                origins: [origin]
            };

            const dataToRemove = {
                "cookies": true,
                "localStorage": true,
                "indexedDB": true,
                "serviceWorkers": true,
                "cacheStorage": true,
                "fileSystems": true
            };

            statusDiv.textContent = 'Clearing data...';

            chrome.browsingData.remove(removalOptions, dataToRemove, async () => {
                // After clearing storage/cookies, perform hard reload
                await chrome.tabs.reload(tab.id, { bypassCache: true });
                window.close();
            });

        } catch (err) {
            showStatus('Error: ' + err.message, 'error');
        }
    });
});
