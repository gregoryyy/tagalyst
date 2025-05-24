import { logInfo } from './modules/logger.js';

async function renderSnippets() {
  const container = document.getElementById('snippets');
  const { snippets = [] } = await chrome.storage.local.get('snippets');
  logInfo('Rendering snippets:', snippets);

  if (snippets.length === 0) {
    container.textContent = 'No snippets yet.';
    return;
  }

  container.innerHTML = snippets.map(snippet => `
    <div class="snippet">
      <div>${snippet.text}</div>
      <small>${new Date(snippet.timestamp).toLocaleString()}</small>
      <small><a href="${snippet.url}" target="_blank">${new URL(snippet.url).hostname}</a></small>
      <button class="scroll-to-snippet" data-id="${snippet.id}" data-url="${snippet.url}">Open</button>
    </div>
  `).join('');
}

logInfo('Popup script loading.');

document.addEventListener('DOMContentLoaded', async () => {
  logInfo('Popup loaded, render snippets.');
  await renderSnippets();
  // Add listeners AFTER DOM update
  document.querySelectorAll('.scroll-to-snippet').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const snippetId = btn.dataset.id;
      const snippetUrl = btn.dataset.url;
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab.url !== snippetUrl) {
        // Navigate tab to the snippet’s URL first
        await chrome.tabs.update(tab.id, { url: snippetUrl });

        // Wait for tab to finish loading and content script to inject
        chrome.tabs.onUpdated.addListener(function onUpdated(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(onUpdated);
            chrome.tabs.sendMessage(tab.id, {
              type: 'scroll-to-snippet',
              snippetId
            });
          }
        });
      } else {
        // Already on the right page; just scroll
        chrome.tabs.sendMessage(tab.id, {
          type: 'scroll-to-snippet',
          snippetId
        });
      }
    });
  });
});

// debug
chrome.runtime.sendMessage("popup loaded", (response) => {
  // Handle any response from the background script if needed
  logInfo("Popup script loaded and ready to go: ", response);
});
