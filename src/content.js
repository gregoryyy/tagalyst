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

import { logInfo } from './modules/logger.js';
import { HIGHLIGHT_CLASS } from './modules/config.js';

async function handleMouseUp() {
  const range = getSelectedRange();
  if (!range || range.collapsed) return;

  const snippet = serializeRange(range);
  applyHighlight(range, snippet.id);
  await saveSnippet(snippet);
  logInfo('Saved and highlighted:', snippet.text);
}

async function restoreAllSnippets() {
  const snippets = await loadSnippets();
  for (const snippet of snippets) {
    if (snippet.url === window.location.href) {
      try {
        restoreHighlight(snippet);
      } catch (error) {
        logInfo(`Error restoring snippet ${snippet.id}:`, error);
      }
    }
  }
}

document.addEventListener('mouseup', handleMouseUp);

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    restoreAllSnippets();
  }, 100);
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
