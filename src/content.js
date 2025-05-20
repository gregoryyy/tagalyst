// src/content.js
import { getSelectedRange, serializeRange, applyHighlight, restoreHighlight } from './modules/highlighter.js';
import { saveSnippet, loadSnippets } from './modules/storage.js';
import { logInfo } from './modules/logger.js';

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
  snippets
    .filter(s => s.url === window.location.href)
    .forEach(restoreHighlight);
}

document.addEventListener('mouseup', handleMouseUp);
window.addEventListener('DOMContentLoaded', restoreAllSnippets);

const style = document.createElement('style');
style.textContent = `.tagalyst-highlight { background-color: yellow; padding: 0.1em; border-radius: 2px; }`;
document.head.appendChild(style);

