import { logInfo } from './modules/logger.js';

async function renderSnippets() {
  const container = document.getElementById('snippets');
  const { snippets = [] } = await chrome.storage.local.get('snippets');

  if (snippets.length === 0) {
    container.textContent = 'No snippets yet.';
    return;
  }

  container.innerHTML = snippets.map(snippet => `
    <div class="snippet">
      <div>${snippet.text}</div>
      <small>${new Date(snippet.timestamp).toLocaleString()}</small>
      <small><a href="${snippet.url}" target="_blank">${new URL(snippet.url).hostname}</a></small>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  logInfo('Popup loaded.');
  renderSnippets();
});
