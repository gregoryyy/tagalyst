// highlighter.js
import rangy from 'rangy/lib/rangy-core';
import 'rangy/lib/rangy-highlighter';
import 'rangy/lib/rangy-classapplier';
import 'rangy/lib/rangy-serializer';

import { logInfo, logWarn } from './logger.js';
import { HIGHLIGHT_CLASS } from './config.js';

// Initialize Rangy once
rangy.init();

// Create and export a highlighter instance
export const highlighter = rangy.createHighlighter();

// Add a class applier for the highlight class with styling
highlighter.addClassApplier(
  rangy.createClassApplier(HIGHLIGHT_CLASS, {
    elementTagName: 'span',
    elementProperties: {
      className: HIGHLIGHT_CLASS,
      style: {
        backgroundColor: 'yellow',
        padding: '0.1em',
        borderRadius: '2px'
      }
    }
  })
);

// Get the current selection range
export function getSelectedRange() {
  const selection = rangy.getSelection();
  logInfo('Selection applied', selection);
  if (!selection || selection.rangeCount === 0) return null;
  return selection.getRangeAt(0).cloneRange();
}

// Apply a highlight and return its serialized form
export function applyHighlight(range, id) {
  rangy.getSelection().removeAllRanges();
  rangy.getSelection().addRange(range);
  highlighter.highlightSelection(HIGHLIGHT_CLASS);

  const spans = Array.from(document.querySelectorAll(`.${HIGHLIGHT_CLASS}`))
    .filter(el => !el.dataset.tagalystId); // only new highlights

  spans.forEach(span => {
    span.dataset.tagalystId = id;
  });

  logInfo('Highlight applied', spans);

  return spans;
}

// Serialize a highlight range into a storable snippet
export function serializeRange(range) {
  logInfo('Range serializing', range);
  const x = highlighter.serialize();
  logInfo('Serialized range', x);
  return {
    text: range.toString(),
    serialized: highlighter.serialize(),
    url: window.location.href,
    timestamp: new Date().toISOString(),
    id: crypto.randomUUID()
  };
}

// Restore a highlight from a serialized snippet
export function restoreHighlight(snippet) {
  try {
    logInfo('Restore highlight', snippet);
    highlighter.deserialize(snippet.serialized);

    // Add dataset ID to restored highlights
    const spans = document.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
    spans.forEach(span => {
      if (!span.dataset.tagalystId) {
        span.dataset.tagalystId = snippet.id;
      }
    });
  } catch (e) {
    logWarn('Failed to restore highlight', e);
  }
}
