// snippet.js

import { v4 as uuidv4 } from "uuid";
import rangy from "rangy";
import "rangy/lib/rangy-serializer";
import * as textPosition from "dom-anchor-text-position";
import * as textQuote from "dom-anchor-text-quote";
import { maxMatchLevel } from "./config.js";
import { applyHighlight, restoreHighlight, highlighter } from './highlighter.js';
import { logDebug } from "./logger.js";

/**
 * Snippet data class
 * Stores all 3 selectors for robust anchoring, i.e., robust text 
 * restore using fallbacks textPosition and textQuote
 */
export class Snippet {

  /**
   * constructor with forward compatibility: 
   * 
   * @param {JSON} params - snippet properties
   * 
   * Properties:
   * @param {string} id - Unique ID for the snippet
   * @param {string} url - URL of the page where the snippet was created
   * @param {string} text - The text of the snippet
   * @param {string} annotation - Optional annotation for the snippet
   * @param {Object} anchors - Anchors for the snippet
   * @param {Object} style - Style for the snippet
   */  
  constructor({ id, url, text, annotation = "", anchors = {}, style = "tagalyst-highlight" }) {
    this.id = id;
    this.url = url;
    this.text = text;
    this.annotation = annotation;
    this.anchors = anchors;
    this.style = style;
  }
  
  /**
   * Create a snippet from the current selection
   * 
   * @param {Selection} selection - The current selection
   * @param {HTMLElement} root - The root element to use for anchoring
   */ 
  static fromSelection(selection, root = document.body) {
    if (!selection.rangeCount) return null;
    const range = selection.getRangeAt(0);

    // Create highlight and serialize it
    const snippetId = uuidv4();
    const highlight = applyHighlight(range, snippetId);
    const rangySerialized = highlighter.serialize({ highlights: [highlight] });

    const anchors = {
      rangySerialized, // highlight serialization for robust restore
      textPosition: textPosition.fromRange(root, range),
      textQuote: textQuote.fromRange(root, range)
    };

    return new Snippet({
      id: snippetId,
      url: window.location.href,
      text: selection.toString(),
      annotation: "",
      anchors
    });
  }

  /**
   * Restore highlight for this snippet, escalating from DOM to text matching
   * 
   * @param {HTMLElement} root 
   * @returns 
   */
  restoreHighlight(root = document.body) {
    // 1. Rangy Highlight (DOM structure)
    if (maxMatchLevel >= 1 && this.anchors.rangySerialized) {
      try {
        // If the serialization doesn't look like a highlight serialization,
        // skip to fallback (e.g. old data with range serialization)
        if (typeof this.anchors.rangySerialized === 'string' && this.anchors.rangySerialized.includes('type:textContent')) {
          restoreHighlight(this);
          return true;
        }
      } catch (e) {
        logDebug('1. Failed to restore highlight from rangy serialization:', e);
      }
    }
    // 2. TextPosition (char offsets)
    if (maxMatchLevel >= 2 && this.anchors.textPosition) {
      try {
        const range = textPosition.toRange(root, this.anchors.textPosition);
        if (range) {
          applyHighlight(range, this.id);
          return true;
        }
      } catch (e) {
        logDebug('2. Failed to restore highlight from text position:', e);
      }
    }
    // 3. TextQuote (content + context)
    if (maxMatchLevel >= 3 && this.anchors.textQuote) {
      try {
        const range = textQuote.toRange(root, this.anchors.textQuote);
        if (range) {
          applyHighlight(range, this.id);
          return true;
        }
      } catch (e) {
        logDebug('3. Failed to restore highlight from text content:', e);
      }
    }
    // 4. Fallback: content search
    if (maxMatchLevel >= 4) {
      const text = this.text;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while (node = walker.nextNode()) {
        const idx = node.textContent.indexOf(text);
        if (idx !== -1) {
          const range = document.createRange();
          range.setStart(node, idx);
          range.setEnd(node, idx + text.length);
          applyHighlight(range, this.id);
          return true;
        }
      }
    }
    logDebug(`4. Failed to restore highlight for snippet ${this.id} on ${this.url}`);
    return false;
  }


  /**
   * 
   * @returns {string} Serialized range for this snippet
   */
  getRange() {
    try {
      return rangy.deserializeRange(this.serialized, this.doc);
    } catch (e) {
      console.warn('Failed to deserialize range', e);
      return null;
    }
  }

  /**
   * collision detection: check if two snippets overlap
   * 
   * @param {Snippet} a 
   * @param {Snippet} b 
   * @returns 
   */
  static overlaps(a, b) {
    const rangeA = a.getRange();
    const rangeB = b.getRange();
    if (!rangeA || !rangeB) return false;
    // Not overlapping if one is completely before or after the other
    return !(rangeA.compareBoundaryPoints(Range.END_TO_START, rangeB) <= 0 ||
             rangeA.compareBoundaryPoints(Range.START_TO_END, rangeB) >= 0);
  }
}
