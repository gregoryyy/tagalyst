/*
 * TextHighlighter ES Module
 * AI-based modernization port of https://mir3z.github.io/texthighlighter/
 * License: https://github.com/mir3z/texthighlighter/blob/master/LICENSE
 * Note: Not tested yet.
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
    remove: () => el.parentNode.removeChild(el),
    contains: child => el !== child && el.contains(child),
    wrap: wrapper => { el.parentNode?.insertBefore(wrapper, el); wrapper.appendChild(el); return wrapper; },
    unwrap: () => {
      const nodes = Array.from(el.childNodes);
      nodes.forEach(node => {
        const wrapper = node.parentNode;
        wrapper.parentNode?.insertBefore(node, wrapper);
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

function bindEvents(el, scope) {
  el.addEventListener('mouseup', scope.highlightHandler.bind(scope));
  el.addEventListener('touchend', scope.highlightHandler.bind(scope));
}

function unbindEvents(el, scope) {
  el.removeEventListener('mouseup', scope.highlightHandler.bind(scope));
  el.removeEventListener('touchend', scope.highlightHandler.bind(scope));
}

class TextHighlighter {
  constructor(element, options) {
    if (!element) throw 'Missing anchor element';
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
    bindEvents(this.el, this);
  }
  destroy() {
    unbindEvents(this.el, this);
    dom(this.el).removeClass(this.options.contextClass);
  }
  highlightHandler() {
    this.doHighlight();
  }
  doHighlight(keepRange) {
    const range = dom(this.el).getRange();
    if (!range || range.collapsed) return;
    if (this.options.onBeforeHighlight(range) === true) {
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
    if (!range || range.collapsed) return [];
    const { startContainer, endContainer, goDeeper } = refineRangeBoundaries(range);
    let done = false, node = startContainer, highlights = [], highlight, wrapperClone;
    let go = goDeeper;
    do {
      if (go && node.nodeType === NODE_TYPE.TEXT_NODE && !IGNORE_TAGS.includes(node.parentNode.tagName) && node.nodeValue.trim() !== '') {
        wrapperClone = wrapper.cloneNode(true);
        wrapperClone.setAttribute(DATA_ATTR, true);
        const nodeParent = node.parentNode;
        if (dom(this.el).contains(nodeParent) || nodeParent === this.el) {
          highlight = dom(node).wrap(wrapperClone);
          highlights.push(highlight);
        }
        go = false;
      }
      if (node === endContainer && !(endContainer.hasChildNodes() && go)) done = true;
      if (node.tagName && IGNORE_TAGS.includes(node.tagName)) {
        if (endContainer.parentNode === node) done = true;
        go = false;
      }
      if (go && node.hasChildNodes()) {
        node = node.firstChild;
      } else if (node.nextSibling) {
        node = node.nextSibling;
        go = true;
      } else {
        node = node.parentNode;
        go = false;
      }
    } while (!done);
    return highlights;
  }
  normalizeHighlights(highlights) {
    this.flattenNestedHighlights(highlights);
    this.mergeSiblingHighlights(highlights);
    return unique(highlights.filter(hl => hl.parentElement)).sort((a, b) => a.offsetTop - b.offsetTop || a.offsetLeft - b.offsetLeft);
  }
  flattenNestedHighlights(highlights) {
    sortByDepth(highlights, true);
    let again;
    do {
      again = false;
      highlights.forEach((hl, i) => {
        const parent = hl.parentElement;
        if (this.isHighlight(parent)) {
          if (!haveSameColor(parent, hl)) {
            if (!hl.nextSibling) dom(hl).insertBefore(parent.nextSibling || parent);
            if (!hl.previousSibling) dom(hl).insertAfter(parent.previousSibling || parent);
            if (!parent.hasChildNodes()) dom(parent).remove();
          } else {
            parent.replaceChild(hl.firstChild, hl);
            highlights[i] = parent;
            again = true;
          }
        }
      });
    } while (again);
  }
  mergeSiblingHighlights(highlights) {
    highlights.forEach(hl => {
      const prev = hl.previousSibling, next = hl.nextSibling;
      if (this.isHighlight(prev) && haveSameColor(hl, prev)) {
        dom(hl).prepend(prev.childNodes);
        dom(prev).remove();
      }
      if (this.isHighlight(next) && haveSameColor(hl, next)) {
        dom(hl).append(next.childNodes);
        dom(next).remove();
      }
      dom(hl).normalizeTextNodes();
    });
  }
  setColor(color) { this.options.color = color; }
  getColor() { return this.options.color; }
  removeHighlights(element) {
    const container = element || this.el;
    const highlights = this.getHighlights({ container });
    sortByDepth(highlights, true);
    highlights.forEach(hl => {
      if (this.options.onRemoveHighlight(hl) === true) {
        const textNodes = dom(hl).unwrap();
        textNodes.forEach(node => {
          const prev = node.previousSibling, next = node.nextSibling;
          if (prev?.nodeType === NODE_TYPE.TEXT_NODE) {
            node.nodeValue = prev.nodeValue + node.nodeValue;
            dom(prev).remove();
          }
          if (next?.nodeType === NODE_TYPE.TEXT_NODE) {
            node.nodeValue = node.nodeValue + next.nodeValue;
            dom(next).remove();
          }
        });
      }
    });
  }
  getHighlights({ container = this.el, andSelf = true, grouped = false } = {}) {
    const nodeList = container.querySelectorAll(`[${DATA_ATTR}]`);
    let highlights = Array.from(nodeList);
    if (andSelf && container.hasAttribute(DATA_ATTR)) highlights.push(container);
    return grouped ? groupHighlights(highlights) : highlights;
  }
  isHighlight(el) {
    return el && el.nodeType === NODE_TYPE.ELEMENT_NODE && el.hasAttribute(DATA_ATTR);
  }
  serializeHighlights() {
    const highlights = this.getHighlights();
    const refEl = this.el;
    function getElementPath(el, refElement) {
      const path = [];
      do {
        path.unshift(Array.prototype.indexOf.call(el.parentNode.childNodes, el));
        el = el.parentNode;
      } while (el !== refElement);
      return path;
    }
    sortByDepth(highlights, false);
    return JSON.stringify(highlights.map(hl => {
      const path = getElementPath(hl, refEl).join(':');
      const wrapper = hl.cloneNode(true);
      wrapper.innerHTML = '';
      return [wrapper.outerHTML, hl.textContent, path, hl.previousSibling?.length || 0, hl.textContent.length];
    }));
  }
  deserializeHighlights(json) {
    if (!json) return [];
    const highlights = [];
    const hlDescriptors = JSON.parse(json);
    hlDescriptors.forEach(desc => {
      try {
        const [wrapperHTML, text, pathStr, offset, length] = desc;
        const path = pathStr.split(':').map(Number);
        const elIndex = path.pop();
        let node = this.el;
        path.forEach(idx => node = node.childNodes[idx]);
        if (node.childNodes[elIndex - 1]?.nodeType === NODE_TYPE.TEXT_NODE) elIndex--;
        node = node.childNodes[elIndex];
        const hlNode = node.splitText(offset);
        hlNode.splitText(length);
        if (!hlNode.nextSibling?.nodeValue) dom(hlNode.nextSibling).remove();
        if (!hlNode.previousSibling?.nodeValue) dom(hlNode.previousSibling).remove();
        highlights.push(dom(hlNode).wrap(dom().fromHTML(wrapperHTML)[0]));
      } catch (e) {
        console.warn("Can't deserialize highlight descriptor. Cause: " + e);
      }
    });
    return highlights;
  }
  find(text, caseSensitive = true) {
    const wnd = dom(this.el).getWindow();
    const scrollX = wnd.scrollX, scrollY = wnd.scrollY;
    dom(this.el).removeAllRanges();
    if (wnd.find) {
      while (wnd.find(text, caseSensitive)) this.doHighlight(true);
    } else if (wnd.document.body.createTextRange) {
      const textRange = wnd.document.body.createTextRange();
      textRange.moveToElementText(this.el);
      while (textRange.findText(text, 1, caseSensitive ? 4 : 0)) {
        if (!dom(this.el).contains(textRange.parentElement()) && textRange.parentElement() !== this.el) break;
        textRange.select();
        this.doHighlight(true);
        textRange.collapse(false);
      }
    }
    dom(this.el).removeAllRanges();
    wnd.scrollTo(scrollX, scrollY);
  }
  static createWrapper(options) {
    const span = document.createElement('span');
    span.style.backgroundColor = options.color;
    span.className = options.highlightedClass;
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
