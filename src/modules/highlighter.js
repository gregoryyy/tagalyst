// highlighter.js
import rangy from 'rangy/lib/rangy-core';
import 'rangy/lib/rangy-highlighter';
import 'rangy/lib/rangy-classapplier';
import 'rangy/lib/rangy-serializer';

import { logInfo, logWarn } from './logger.js';
import { highlightClass, highlightStyle } from './config.js';

// Initialize Rangy once
rangy.init();

// Create and export a highlighter instance
export const highlighter = rangy.createHighlighter();

// Add a class applier for the highlight class with styling
highlighter.addClassApplier(
  rangy.createClassApplier(highlightClass, {
    elementTagName: 'span',
    elementProperties: {
      className: highlightClass,
      style: highlightStyle
    }
  })
);

/**
 * Get the range of the current selection
 */ 
export function getSelectedRange() {
  const selection = rangy.getSelection();
  logInfo('Selection applied', selection);
  if (!selection || selection.rangeCount === 0) return null;
  return selection.getRangeAt(0).cloneRange();
}

/**
 * Apply a highlight and return its serialized form
 * 
 * @param {*} range 
 * @param {*} id 
 * @returns 
 */
export function applyHighlight(range, id) {
  rangy.getSelection().removeAllRanges();
  rangy.getSelection().addRange(range);
  highlighter.highlightSelection(highlightClass);

  const spans = Array.from(document.querySelectorAll(`.${highlightClass}`))
    .filter(el => !el.dataset.tagalystId); // only new highlights

  spans.forEach(span => {
    span.dataset.tagalystId = id;
  });

  logInfo('Highlight applied', spans);

  return spans;
}

/**
 * Serialize a highlight range into a storable snippet
 * 
 * @param {*} range
 */
export function serializeRange(range) {
  logInfo('Range serializing', range);
  return {
    text: range.toString(),
    serialized: highlighter.serialize(),
    url: window.location.href,
    timestamp: new Date().toISOString(),
    id: crypto.randomUUID()
  };
}

/**
 * Restore a highlight from a serialized snippet
 * 
 * @param {*} snippet 
 */
export function restoreHighlight(snippet) {
  try {
    logInfo('Restore highlight', snippet);
    highlighter.deserialize(snippet.serialized);

    // Add dataset ID to restored highlights
    const spans = document.querySelectorAll(`.${highlightClass}`);
    spans.forEach(span => {
      if (!span.dataset.tagalystId) {
        span.dataset.tagalystId = snippet.id;
      }
    });
  } catch (e) {
    logWarn('Failed to restore highlight', e);
  }
}
