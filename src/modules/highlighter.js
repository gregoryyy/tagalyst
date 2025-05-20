import TextHighlighter from '../lib/TextHighlighter.js';
import { logInfo, logWarn } from './logger.js';
import { HIGHLIGHT_CLASS } from './config.js';

// Create and export a highlighter instance
export const highlighter = new TextHighlighter(document.body, {
  highlightedClass: HIGHLIGHT_CLASS,
  onAfterHighlight: (range, highlights) => {
    logInfo("Highlight applied", highlights);
  },
  onBeforeHighlight: (range) => {
    // Prevent overlapping highlights
    return !range.collapsed && range.toString().trim() !== '';
  }
});

// Get the current selection range
export function getSelectedRange() {
  const selection = window.getSelection();
  logInfo("Selection applied", selection);
  if (!selection || selection.rangeCount === 0) return null;
  return selection.getRangeAt(0).cloneRange();
}

// Apply a highlight and return its serialized form
export function applyHighlight(range, id) {
  const wrapper = document.createElement('span');
  wrapper.className = 'tagalyst-highlight';
  wrapper.style.backgroundColor = 'yellow';
  wrapper.style.padding = '0.1em';
  wrapper.style.borderRadius = '2px';
  
  const highlights = highlighter.highlightRange(range, wrapper);
  
  logInfo("Highlight applied", highlights);
  
  highlights.forEach(span => {
    // Manually assign an ID to each span (not built-in to TextHighlighter)
    span.dataset.tagalystId = id;
  });

  return highlights;
}


// Serialize a highlight range into a storable snippet
export function serializeRange(range) {
  logInfo("Range serializing", range);
  return {
    text: range.toString(),
    serialized: highlighter.serializeHighlights(),
    url: window.location.href,
    timestamp: new Date().toISOString(),
    id: crypto.randomUUID()
  };
}

// Restore a highlight from a serialized snippet
export function restoreHighlight(snippet) {
  try {
    logInfo("Restore highlight", snippet);
    highlighter.deserializeHighlights(snippet.serialized);
    // Optional: patch dataset if needed
    const spans = document.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
    spans.forEach(span => {
      if (!span.dataset.tagalystId) {
        span.dataset.tagalystId = snippet.id;
      }
    });
  } catch (e) {
    logWarn("Failed to restore highlight", e);
  }
}
