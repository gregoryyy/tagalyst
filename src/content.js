import {
  getSelectedRange,
  serializeRange,
  applyHighlight,
  restoreHighlight
} from './modules/highlighter.js';

import {
  saveSnippet,
  loadSnippets
} from './modules/storage.js';

import { logInfo, logWarn, logError } from './modules/logger.js';
import { HIGHLIGHT_CLASS } from './modules/config.js';

async function handleMouseUp() {
  const range = getSelectedRange();
  logInfo("Mouse up event detected", range);
  if (!range || range.collapsed) return;

  const snippet = serializeRange(range);
  applyHighlight(range, snippet.id);
  await saveSnippet(snippet);
  logInfo('Saved and highlighted:', snippet.text);
}

async function restoreAllSnippets() {
  const snippets = await loadSnippets();
  logInfo('Restoring snippets:', snippets);
  for (const snippet of snippets) {
    if (snippet.url === window.location.href) {
      try {
        restoreHighlight(snippet);
      } catch (error) {
        logError(`Error restoring snippet ${snippet.id}:`, error);
      }
    }
  }
}

document.addEventListener('mouseup', handleMouseUp);

// Check if the document is ready or still loading
function onReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

onReady(() => {
  logInfo('***** Content script ready.');
  restoreAllSnippets();
});


// Inject highlight style dynamically
const style = document.createElement('style');
style.textContent = `
  .${HIGHLIGHT_CLASS} {
    background-color: yellow;
    padding: 0.1em;
    border-radius: 2px;
  }
`;
document.head.appendChild(style);

// debug
chrome.runtime.sendMessage("content loaded", (response) => {
  // Handle any response from the background script if needed
  logInfo("Content script loaded and ready to go: ", response);
});
