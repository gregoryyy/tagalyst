// highlighter.js
import rangy from 'rangy/lib/rangy-core';
import 'rangy/lib/rangy-highlighter';
import 'rangy/lib/rangy-classapplier';

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
 * Apply a highlight to a given range and return the created highlight object.
 *
 * @param {Range} range
 * @param {string} id
 * @returns {object} highlight
 */
export function applyHighlight(range, id) {
  // Use highlighter to create a highlight for the specified range
  const rangyRange = rangy.createRange();
  rangyRange.setStart(range.startContainer, range.startOffset);
  rangyRange.setEnd(range.endContainer, range.endOffset);
  const highlight = highlighter.highlightRanges(highlightClass, [rangyRange])[0];

  // Set data attribute for identification
  highlight.getHighlightElements().forEach(span => {
    span.dataset.tagalystId = id;
  });

  logInfo('Highlight applied', highlight);

  return highlight;
}

/**
 * Serialize a single highlight into a storable snippet.
 *
 * @param {object} highlight
 */
export function serializeHighlight(highlight) {
  logInfo('Highlight serializing', highlight);

  const serialized = highlighter.serialize({
    highlights: [highlight] // Crucially serialize only this single highlight
  });

  return {
    text: highlight.getText(),
    serialized,
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
