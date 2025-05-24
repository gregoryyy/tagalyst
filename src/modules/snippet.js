// draft implementation:
// - structured snippet object
// - robust text restore using fallbacks textPosition and textQuote
// TODO: merge with highlighter

import { v4 as uuidv4 } from "uuid";
import rangy from "rangy";
import "rangy/lib/rangy-serializer";
import * as textPosition from "dom-anchor-text-position.js";
import * as textQuote from "dom-anchor-text-quote.js";
import { maxMatchLevel } from "./config.js";

/**
 * Snippet data class
 * Stores all 3 selectors for robust anchoring.
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
    this.anchors = anchors; // { rangySerialized, textPosition, textQuote }
    this.style = "tagalyst-highlight";
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

    const anchors = {
      rangySerialized: rangy.serializeRange(range, true, root),
      textPosition: textPosition.fromRange(root, range), // {start, end}
      textQuote: textQuote.fromRange(root, range)        // {exact, prefix, suffix}
    };

    return new Snippet({
      id: uuidv4(),
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
    // 1. Rangy (DOM structure)
    if (maxMatchLevel >= 1 && this.anchors.rangySerialized) {
      try {
        const range = rangy.deserializeRange(this.anchors.rangySerialized, root);
        if (range) {
          applyHighlightToRange(range);
          return true;
        }
      } catch (e) {}
    }
    // 2. TextPosition (char offsets)
    if (maxMatchLevel >= 2 && this.anchors.textPosition) {
      try {
        const range = textPosition.toRange(root, this.anchors.textPosition); // ({start, end})
        if (range) {
          applyHighlightToRange(range);
          return true;
        }
      } catch (e) {}
    }
    // 3. TextQuote (content + context)
    if (maxMatchLevel >= 3 && this.anchors.textQuote) {
      try {
        const range = textQuote.toRange(root, this.anchors.textQuote);
        if (range) {
          applyHighlightToRange(range);
          return true;
        }
      } catch (e) {}
    }
    // 4. Fallback: content search
    if (maxMatchLevel >= 4) {
      const text = this.text;
      const textNode = findTextNode(root, text); 
      if (textNode) {
        const range = document.createRange();
        const startIndex = textNode.textContent.indexOf(text);
        range.setStart(textNode, startIndex);
        range.setEnd(textNode, startIndex + text.length);
        applyHighlightToRange(range);
        return true;
      }
    return false;
  }
}




