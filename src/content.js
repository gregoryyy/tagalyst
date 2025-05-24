import { serializeHighlight, applyHighlight, restoreHighlight } from './modules/highlighter.js';
import { saveSnippet, loadSnippets } from './modules/storage.js';
import { logInfo, logWarn, logError } from './modules/logger.js';
import { highlightClass } from './modules/config.js';

let lastValidRange = null;

// Track valid selection while active = before pointer up
document.addEventListener('selectionchange', () => {
  logInfo("Selection change event detected");
  const selection = window.getSelection();
  if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
    lastValidRange = selection.getRangeAt(0).cloneRange();
    logInfo("Selection updated:", lastValidRange);
  }
});

// Use pointerup to trigger highlight logic
document.addEventListener('pointerup', async () => {
  logInfo("Pointer up event detected");
  if (!lastValidRange || lastValidRange.collapsed) {
    logInfo("Pointer up: No valid range to highlight.");
    return;
  }

  const snippetId = crypto.randomUUID();
  // 1. Apply highlight to DOM and get highlight object
  const highlight = applyHighlight(lastValidRange, snippetId);
  // 2. Serialize only this highlight
  const snippet = serializeHighlight(highlight);
  snippet.id = snippetId;
  // 3. Save snippet
  await saveSnippet(snippet);
  logInfo('Saved and highlighted:', snippet.text);
  lastValidRange = null;
});

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
  .${highlightClass} {
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
