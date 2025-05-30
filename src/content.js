import { Snippet } from './modules/snippet.js';
import { saveSnippet, loadSnippets } from './modules/storage.js';
import { logInfo, logWarn, logError, logDebug } from './modules/logger.js';
import { highlightClass, highlightStyle, highlightFlashClass, highlightFlashStyle } from './modules/config.js';

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
  const selection = window.getSelection();
  const snippet = Snippet.fromSelection(selection, document.body);
  if (snippet) {
    await saveSnippet(snippet);
    logInfo('Saved and highlighted:', snippet.text);
  }
  lastValidRange = null;
});

async function restoreAllSnippets() {
  const snippets = await loadSnippets();
  logInfo('Restoring snippets:', snippets);
  for (const snippetObj of snippets) {
    if (snippetObj.url === window.location.href) {
      try {
        logDebug(`Restoring snippet with ID: ${snippetObj.id} for URL: ${snippetObj.url}`);
        const snippet = new Snippet(snippetObj);
        snippet.restore(document.body);
      } catch (error) {
        logError(`Error restoring snippet ${snippetObj.id}:`, error);
      }
    }
  }
}

/**
 * Scroll to a specific snippet by its ID.
 * 
 * @param {uuid} snippetId
 */
export function scrollToSnippet(snippetId) {
  // Find the first element with the matching data-tagalyst-id
  const el = document.querySelector(`[data-tagalyst-id='${snippetId}']`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add('tagalyst-highlight-flash');
    setTimeout(() => el.classList.remove('tagalyst-highlight-flash'), 1200);
  }
}

// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'scroll-to-snippet' && msg.snippetId) {
    scrollToSnippet(msg.snippetId);
  }
});

/**
 * Check if the document is ready or still loading
 */
function onReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

// Debounce utility to avoid excessive calls to restoreAllSnippets during rapid DOM changes
function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

onReady(() => {
  logInfo('***** Content script ready.');
  restoreAllSnippets();

  // Adjust selector to the main chat/content container if needed
  // For ChatGPT, main content area can be detected; fallback to document.body
  let container = document.querySelector('main') || document.body;
  const debouncedRestore = debounce(restoreAllSnippets, 200);

  // Observe changes for SPA navigation or content updates
  const observer = new MutationObserver(() => {
    logDebug("Mutation detected, attempting to restore snippets...");
    debouncedRestore();
  });

  observer.observe(container, { childList: true, subtree: true });
});

// Inject highlight style dynamically
const style = document.createElement('style');
style.textContent = `
  .${highlightClass} { ${highlightStyle} }
  .${highlightFlashClass} { ${highlightFlashStyle} }
`;
document.head.appendChild(style);

// debug
chrome.runtime.sendMessage("content loaded", (response) => {
  // Handle any response from the background script if needed
  logInfo("Content script loaded and ready to go: ", response);
});
