/*
 * TextHighlighter ES Module
 * Ported from IIFE version with fixes for:
 * - Proper event unbinding using stored bound handler
 * - window.find fallback support
 * - Removed IE TextRange code
 * - More robust deserialization with path validation
 */

const DATA_ATTR = 'data-highlighted';
const TIMESTAMP_ATTR = 'data-timestamp';
const NODE_TYPE = { ELEMENT_NODE: 1, TEXT_NODE: 3 };
const IGNORE_TAGS = [
  'SCRIPT', 'STYLE', 'SELECT', 'OPTION', 'BUTTON', 'OBJECT', 'APPLET', 'VIDEO', 'AUDIO', 'CANVAS', 'EMBED',
  'PARAM', 'METER', 'PROGRESS'
];

function haveSameColor(a, b) {
  return dom(a).color() === dom(b).color();
}

function defaults(obj, source) {
  obj = obj || {};
  for (const prop in source) {
    if (Object.prototype.hasOwnProperty.call(source, prop) && obj[prop] === void 0) {
      obj[prop] = source[prop];
    }
  }
  return obj;
}

function unique(arr) {
  return arr.filter((value, idx, self) => self.indexOf(value) === idx);
}

function refineRangeBoundaries(range) {
  let startContainer = range.startContainer,
      endContainer = range.endContainer,
      ancestor = range.commonAncestorContainer,
      goDeeper = true;

  if (range.endOffset === 0) {
    while (!endContainer.previousSibling && endContainer.parentNode !== ancestor) {
      endContainer = endContainer.parentNode;
    }
    endContainer = endContainer.previousSibling;
  } else if (endContainer.nodeType === NODE_TYPE.TEXT_NODE) {
    if (range.endOffset < endContainer.nodeValue.length) {
      endContainer.splitText(range.endOffset);
    }
  } else if (range.endOffset > 0) {
    endContainer = endContainer.childNodes.item(range.endOffset - 1);
  }

  if (startContainer.nodeType === NODE_TYPE.TEXT_NODE) {
    if (range.startOffset === startContainer.nodeValue.length) {
      goDeeper = false;
    } else if (range.startOffset > 0) {
      startContainer = startContainer.splitText(range.startOffset);
      if (endContainer === startContainer.previousSibling) {
        endContainer = startContainer;
      }
    }
  } else if (range.startOffset < startContainer.childNodes.length) {
    startContainer = startContainer.childNodes.item(range.startOffset);
  } else {
    startContainer = startContainer.nextSibling;
  }

  return { startContainer, endContainer, goDeeper };
}

function sortByDepth(arr, descending) {
  arr.sort((a, b) => dom(descending ? b : a).parents().length - dom(descending ? a : b).parents().length);
}

function groupHighlights(highlights) {
  const order = [], chunks = {}, grouped = [];
  highlights.forEach(hl => {
    const timestamp = hl.getAttribute(TIMESTAMP_ATTR);
    if (!chunks[timestamp]) {
      chunks[timestamp] = [];
      order.push(timestamp);
    }
    chunks[timestamp].push(hl);
  });
  order.forEach(timestamp => {
    const group = chunks[timestamp];
    grouped.push({
      chunks: group,
      timestamp,
      toString: () => group.map(h => h.textContent).join('')
    });
  });
  return grouped;
}

function dom(el) {
  return {
    addClass: className => el.classList ? el.classList.add(className) : (el.className += ' ' + className),
    removeClass: className => el.classList ? el.classList.remove(className) : (el.className = el.className.replace(new RegExp('(^|\\b)' + className + '(\\b|$)', 'gi'), ' ')),
    prepend: nodesToPrepend => nodesToPrepend.slice().reverse().forEach(n => el.insertBefore(n, el.firstChild)),
    append: nodesToAppend => nodesToAppend.forEach(n => el.appendChild(n)),
    insertAfter: refEl => refEl.parentNode.insertBefore(el, refEl.nextSibling),
    insertBefore: refEl => refEl.parentNode.insertBefore(el, refEl),
    remove: () => el?.parentNode?.removeChild(el),
    contains: child => el !== child && el.contains(child),
    wrap: wrapper => { el.parentNode?.insertBefore(wrapper, el); wrapper.appendChild(el); return wrapper; },
    unwrap: () => {
      const nodes = Array.from(el.childNodes);
      nodes.forEach(node => {
        const wrapper = node.parentNode;
        wrapper?.parentNode?.insertBefore(node, wrapper);
        dom(wrapper).remove();
      });
      return nodes;
    },
    parents: () => {
      const path = [];
      let parent = el;
      while ((parent = parent.parentNode)) path.push(parent);
      return path;
    },
    normalizeTextNodes: () => {
      if (!el) return;
      if (el.nodeType === NODE_TYPE.TEXT_NODE) {
        while (el.nextSibling?.nodeType === NODE_TYPE.TEXT_NODE) {
          el.nodeValue += el.nextSibling.nodeValue;
          el.parentNode.removeChild(el.nextSibling);
        }
      } else {
        dom(el.firstChild).normalizeTextNodes();
      }
      dom(el.nextSibling).normalizeTextNodes();
    },
    color: () => el.style.backgroundColor,
    fromHTML: html => {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.childNodes;
    },
    getRange: () => dom(el).getSelection()?.rangeCount > 0 ? dom(el).getSelection().getRangeAt(0) : null,
    removeAllRanges: () => dom(el).getSelection().removeAllRanges(),
    getSelection: () => dom(el).getWindow().getSelection(),
    getWindow: () => dom(el).getDocument().defaultView,
    getDocument: () => el.ownerDocument || el
  };
}

class TextHighlighter {
  constructor(element, options = {}) {
    if (!element) throw new Error('Missing anchor element');
    this.el = element;
    this.options = defaults(options, {
      color: '#ffff7b',
      highlightedClass: 'highlighted',
      contextClass: 'highlighter-context',
      onRemoveHighlight: () => true,
      onBeforeHighlight: () => true,
      onAfterHighlight: () => {}
    });
    dom(this.el).addClass(this.options.contextClass);
    this._boundHighlightHandler = this.highlightHandler.bind(this);
    this._bindEvents();
  }

  _bindEvents() {
    this.el.addEventListener('mouseup', this._boundHighlightHandler);
    this.el.addEventListener('touchend', this._boundHighlightHandler);
  }

  _unbindEvents() {
    this.el.removeEventListener('mouseup', this._boundHighlightHandler);
    this.el.removeEventListener('touchend', this._boundHighlightHandler);
  }

  destroy() {
    this._unbindEvents();
    dom(this.el).removeClass(this.options.contextClass);
  }

  highlightHandler() {
    this.doHighlight();
  }

  doHighlight(keepRange = false) {
    const range = dom(this.el).getRange();
    if (!range || range.collapsed) return;
    if (this.options.onBeforeHighlight(range)) {
      const timestamp = +new Date();
      const wrapper = TextHighlighter.createWrapper(this.options);
      wrapper.setAttribute(TIMESTAMP_ATTR, timestamp);
      const createdHighlights = this.highlightRange(range, wrapper);
      const normalizedHighlights = this.normalizeHighlights(createdHighlights);
      this.options.onAfterHighlight(range, normalizedHighlights, timestamp);
    }
    if (!keepRange) dom(this.el).removeAllRanges();
  }

  highlightRange(range, wrapper) {
    const result = refineRangeBoundaries(range);
    let node = result.startContainer;
    const endContainer = result.endContainer;
    let goDeeper = result.goDeeper;
    const highlights = [];

    do {
      if (goDeeper && node.nodeType === NODE_TYPE.TEXT_NODE) {
        if (!IGNORE_TAGS.includes(node.parentNode.tagName) && node.nodeValue.trim() !== '') {
          const wrapperClone = wrapper.cloneNode(true);
          const highlight = dom(node).wrap(wrapperClone);
          highlights.push(highlight);
        }
        goDeeper = false;
      }
      if (node === endContainer && !(endContainer.hasChildNodes() && goDeeper)) break;
      if (node.tagName && IGNORE_TAGS.includes(node.tagName)) {
        if (endContainer.parentNode === node) break;
        goDeeper = false;
      }
      if (goDeeper && node.hasChildNodes()) {
        node = node.firstChild;
      } else if (node.nextSibling) {
        node = node.nextSibling;
        goDeeper = true;
      } else {
        node = node.parentNode;
        goDeeper = false;
      }
    } while (node);

    return highlights;
  }

  normalizeHighlights(highlights) {
    this.flattenNestedHighlights(highlights);
    this.mergeSiblingHighlights(highlights);
    return unique(highlights.filter(hl => hl.parentElement));
  }

  flattenNestedHighlights(highlights) {
    sortByDepth(highlights, true);
    let again;
    do {
      again = false;
      highlights.forEach((hl, i) => {
        const parent = hl.parentElement;
        if (this.isHighlight(parent) && !haveSameColor(parent, hl)) {
          if (!hl.nextSibling) dom(hl).insertBefore(parent.nextSibling || parent);
          if (!hl.previousSibling) dom(hl).insertAfter(parent.previousSibling || parent);
          if (!parent.hasChildNodes()) dom(parent).remove();
        } else if (this.isHighlight(parent)) {
          parent.replaceChild(hl.firstChild, hl);
          highlights[i] = parent;
          again = true;
        }
      });
    } while (again);
  }

  mergeSiblingHighlights(highlights) {
    highlights.forEach(highlight => {
      const prev = highlight.previousSibling;
      const next = highlight.nextSibling;
      if (this.isHighlight(prev) && haveSameColor(highlight, prev)) {
        dom(highlight).prepend(prev.childNodes);
        dom(prev).remove();
      }
      if (this.isHighlight(next) && haveSameColor(highlight, next)) {
        dom(highlight).append(next.childNodes);
        dom(next).remove();
      }
      dom(highlight).normalizeTextNodes();
    });
  }

  removeHighlights(container = this.el) {
    const highlights = this.getHighlights({ container });
    const mergeSiblings = node => {
      const prev = node.previousSibling;
      const next = node.nextSibling;
      if (prev?.nodeType === NODE_TYPE.TEXT_NODE) {
        node.nodeValue = prev.nodeValue + node.nodeValue;
        dom(prev).remove();
      }
      if (next?.nodeType === NODE_TYPE.TEXT_NODE) {
        node.nodeValue += next.nodeValue;
        dom(next).remove();
      }
    };
    highlights.forEach(hl => {
      if (this.options.onRemoveHighlight(hl)) {
        const textNodes = dom(hl).unwrap();
        textNodes.forEach(mergeSiblings);
      }
    });
  }

  getHighlights({ container = this.el, andSelf = true, grouped = false } = {}) {
    let highlights = Array.from(container.querySelectorAll(`[${DATA_ATTR}]`));
    if (andSelf && container.hasAttribute(DATA_ATTR)) {
      highlights.push(container);
    }
    return grouped ? groupHighlights(highlights) : highlights;
  }

  isHighlight(el) {
    return el?.nodeType === NODE_TYPE.ELEMENT_NODE && el.hasAttribute(DATA_ATTR);
  }

  serializeHighlights() {
    const highlights = this.getHighlights();
    const refEl = this.el;
    const getElementPath = (el, ref) => {
      const path = [];
      while (el && el !== ref) {
        path.unshift(Array.prototype.indexOf.call(el.parentNode.childNodes, el));
        el = el.parentNode;
      }
      return path;
    };
    return JSON.stringify(highlights.map(hl => {
      const path = getElementPath(hl, refEl);
      const offset = hl.previousSibling?.nodeType === NODE_TYPE.TEXT_NODE ? hl.previousSibling.length : 0;
      const length = hl.textContent.length;
      const wrapper = hl.cloneNode(false).outerHTML;
      return [wrapper, hl.textContent, path.join(':'), offset, length];
    }));
  }

  deserializeHighlights(json) {
    if (!json) return [];
    let highlights = [];
    try {
      const descriptors = JSON.parse(json);
      descriptors.forEach(([wrapper, text, pathStr, offset, length]) => {
        const path = pathStr.split(':').map(Number);
        let node = this.el;
        for (const idx of path) node = node.childNodes[idx];
        if (!node) return;
        const textNode = node.splitText(offset);
        textNode.splitText(length);
        if (!textNode.nodeValue.trim()) return;
        const highlight = dom(textNode).wrap(dom().fromHTML(wrapper)[0]);
        highlights.push(highlight);
      });
    } catch (e) {
      console.warn('Failed to deserialize highlights', e);
    }
    return highlights;
  }

  find(text, caseSensitive = true) {
    const wnd = dom(this.el).getWindow();
    const sel = dom(this.el).getSelection();
    const scrollX = wnd.scrollX;
    const scrollY = wnd.scrollY;
    sel.removeAllRanges();
    while (wnd.find(text, caseSensitive)) {
      this.doHighlight(true);
    }
    sel.removeAllRanges();
    wnd.scrollTo(scrollX, scrollY);
  }

  static createWrapper(options) {
    const span = document.createElement('span');
    span.style.backgroundColor = options.color;
    span.className = options.highlightedClass;
    span.setAttribute(DATA_ATTR, 'true');
    return span;
  }
}

export {
  TextHighlighter,
  dom,
  defaults,
  unique,
  refineRangeBoundaries,
  sortByDepth,
  groupHighlights,
  DATA_ATTR,
  TIMESTAMP_ATTR,
  NODE_TYPE,
  IGNORE_TAGS
};

/*
Usage:
In your HTML:
<script type="module">
  import { TextHighlighter } from './text-highlighter.js';
  const highlighter = new TextHighlighter(document.getElementById('content'));
</script>
*/
