// snippet.js

import { v4 as uuidv4 } from "uuid";
import rangy from "rangy";
import "rangy/lib/rangy-serializer";
import * as textPosition from "dom-anchor-text-position";
import * as textQuote from "dom-anchor-text-quote";
import { maxMatchLevel } from "./config.js";
import { applyHighlight, restoreHighlight, checkHighlight, highlighter } from './highlighter.js';
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
   * @param {number} date - Timestamp of when the snippet was created
   * @param {Object} style - Style for the snippet
   */  
  constructor({ id, url, text, annotation = "", anchors = {}, timestamp = Date.now(), style = "tagalyst-highlight" }) {
    this.id = id;
    this.url = url;
    this.text = text;
    this.annotation = annotation;
    this.anchors = anchors;
    this.timestamp = timestamp;
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
   * Restore highlight for this snippet, escalating from Rangy's positional approach (similar to XPath), 
   * to positional matching, to text content + context matching to pure content matching. The attempts
   * depend on the maxMatchLevel configured in config.js.
   * 
   * @param {HTMLElement} root 
   * @returns {boolean}
   */
  restore(root = document.body) {
    const self = this;

    // Shared attempt logic
    function attemptRestore(name, restoreFn) {
      logDebug(`${name}: attempting restore for snippet ${self.id}`);
      try {
        const result = restoreFn();
        // If result is a Range, apply the highlight
        if (result instanceof Range) {
          applyHighlight(result, self.id);
          if (checkHighlight(self, root)) {
            logDebug(`${name}: Highlight restore succeeded.`);
            return true;
          }
        } else if (result === true) {
          if (checkHighlight(self, root)) {
            logDebug(`${name}: Highlight restore succeeded.`);
            return true;
          }
        }
      } catch (e) {
        logDebug(`${name}: Exception during restore:`, e);
      }
      return false;
    }

    // Define restore strategies
    const strategies = [
      {
        name: "1. Rangy serialization",
        enabled: () => maxMatchLevel >= 1 && self.anchors.rangySerialized,
        restoreFn: () => {
          if (
            typeof self.anchors.rangySerialized === 'string' &&
            self.anchors.rangySerialized.includes('type:textContent')
          ) {
            // restoreHighlight is the imported function (from highlighter.js)
            restoreHighlight(self);
            return true; // success checked by checkHighlight
          }
          return false;
        }
      },
      {
        name: "2. TextPosition",
        enabled: () => maxMatchLevel >= 2 && self.anchors.textPosition,
        restoreFn: () => {
          try {
            return textPosition.toRange(root, self.anchors.textPosition);
          } catch (e) {
            logDebug('TextPosition: Failed to get range:', e);
            return false;
          }
        }
      },
      {
        name: "3. TextQuote",
        enabled: () => maxMatchLevel >= 3 && self.anchors.textQuote,
        restoreFn: () => {
          try {
            return textQuote.toRange(root, self.anchors.textQuote);
          } catch (e) {
            logDebug('TextQuote: Failed to get range:', e);
            return false;
          }
        }
      },
      {
        name: "4. Content search",
        enabled: () => maxMatchLevel >= 4,
        restoreFn: () => {
          const text = self.text;
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          let node;
          while ((node = walker.nextNode())) {
            const idx = node.textContent.indexOf(text);
            if (idx !== -1) {
              const range = document.createRange();
              range.setStart(node, idx);
              range.setEnd(node, idx + text.length);
              return range;
            }
          }
          return false;
        }
      }
    ];

    // Try each strategy in order
    for (const { name, enabled, restoreFn } of strategies) {
      if (enabled()) {
        if (attemptRestore(name, restoreFn)) {
          return true;
        }
      }
    }
    logDebug(`1-4. Failed to restore highlight for snippet ${self.id} on ${self.url}`);
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
