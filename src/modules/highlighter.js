import TextHighlighter from '../lib/TextHighlighter.js';
import { HIGHLIGHT_CLASS } from './config.js';

// Create and export a highlighter instance
export const highlighter = new TextHighlighter(document.body, {
  highlightedClass: HIGHLIGHT_CLASS,
  onAfterHighlight: (range, highlights) => {
    console.log("Highlight applied", highlights);
  },
  onBeforeHighlight: (range) => {
    // Prevent overlapping highlights
    return !range.collapsed && range.toString().trim() !== '';
  }
});

// Get the current selection range
export function getSelectedRange() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  return selection.getRangeAt(0).cloneRange();
}

// Apply a highlight and return its serialized form
export function applyHighlight(range, id) {
  const highlights = highlighter.highlightRange(range);

  // Manually assign an ID to each span (not built-in to TextHighlighter)
  highlights.forEach(span => {
    span.dataset.tagalystId = id;
    span.style.backgroundColor = 'yellow';
    span.style.borderRadius = '2px';
    span.style.padding = '0.1em';
  });

  return highlights;
}

// Serialize a highlight range into a storable snippet
export function serializeRange(range) {
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
    highlighter.deserializeHighlights(snippet.serialized);
    // Optional: patch dataset if needed
    const spans = document.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
    spans.forEach(span => {
      if (!span.dataset.tagalystId) {
        span.dataset.tagalystId = snippet.id;
      }
    });
  } catch (e) {
    console.warn("Failed to restore highlight", e);
  }
}
