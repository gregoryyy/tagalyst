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
 * @deprecated use Snippet.serialize() instead
 */
export function serializeHighlight(highlight, snippetId) {
  const serialized = highlighter.serialize({
    // Serialize only this single highlight
    highlights: [highlight]
  });
  return serialized;
}

/**
 * Restore a highlight from a serialized snippet
 *
 * @param {*} snippet
 */
export function restoreHighlight(snippet) {
  try {
    logInfo('Restore highlight', snippet);
    highlighter.deserialize(snippet.anchors?.rangySerialized || snippet.serialized);
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

/// collision detection

/**
 * Utility: Deserialize a snippet's range (requires rangy-serializer)
 * @param {*} snippet
 * @param {Document} doc - optional, defaults to current document
 * @returns {Range|null}
 */
export function deserializeSnippetRange(snippet, doc = document) {
  if (!snippet.serialized && !(snippet.anchors && snippet.anchors.rangySerialized)) return null;
  try {
    return rangy.deserializeRange(snippet.anchors?.rangySerialized || snippet.serialized, doc);
  } catch (e) {
    logWarn('Failed to deserialize snippet range', e);
    return null;
  }
}

/**
 * Check if two DOM Ranges overlap.
 * @param {Range} rangeA
 * @param {Range} rangeB
 * @returns {boolean}
 */
export function rangesOverlap(rangeA, rangeB) {
  if (!rangeA || !rangeB) return false;
  // Not before and not after logic: if both false, they overlap
  const before = rangeA.compareBoundaryPoints(Range.END_TO_START, rangeB) <= 0;
  const after = rangeA.compareBoundaryPoints(Range.START_TO_END, rangeB) >= 0;
  return !(before || after);
}

/**
 * Find overlapping snippets for a given range and snippet list.
 * Returns array of snippets that overlap (on the same url, excluding the new one).
 * @param {Range} newRange
 * @param {Array} existingSnippets
 * @param {string} url - current page URL
 * @returns {Array} overlappingSnippets
 */
export function findOverlappingSnippets(newRange, existingSnippets, url = window.location.href) {
  const overlapping = [];
  for (const snippet of existingSnippets) {
    if (snippet.url !== url) continue;
    const otherRange = deserializeSnippetRange(snippet);
    if (rangesOverlap(newRange, otherRange)) {
      overlapping.push(snippet);
    }
  }
  return overlapping;
}
