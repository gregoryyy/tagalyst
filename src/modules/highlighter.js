import { HIGHLIGHT_CLASS } from './config.js';

export function getSelectedRange() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  return selection.getRangeAt(0).cloneRange();
}

// Get all text nodes intersecting the selection range
function getTextNodesInRange(range) {
  const textNodes = [];
  const treeWalker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    }
  );
  while (treeWalker.nextNode()) {
    textNodes.push(treeWalker.currentNode);
  }
  return textNodes;
}

// Robust multi-node highlighter
export function applyHighlight(range, id) {
  const textNodes = getTextNodesInRange(range);

  for (const node of textNodes) {
    const highlightRange = document.createRange();

    const startOffset = node === range.startContainer ? range.startOffset : 0;
    const endOffset = node === range.endContainer ? range.endOffset : node.length;

    if (startOffset >= endOffset) continue;

    highlightRange.setStart(node, startOffset);
    highlightRange.setEnd(node, endOffset);

    const span = document.createElement('span');
    span.className = HIGHLIGHT_CLASS;
    span.dataset.tagalystId = id;
    span.style.backgroundColor = 'yellow';
    span.style.borderRadius = '2px';
    span.style.padding = '0.1em';

    try {
      highlightRange.surroundContents(span);
    } catch (e) {
      console.warn('Failed to highlight range in node:', node, e);
    }
  }
}

export function serializeRange(range) {
  return {
    text: range.toString(),
    startContainerPath: getDomPath(range.startContainer),
    startOffset: range.startOffset,
    endContainerPath: getDomPath(range.endContainer),
    endOffset: range.endOffset,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    id: crypto.randomUUID()
  };
}

export function restoreHighlight(snippet) {
  const startNode = queryDomPath(snippet.startContainerPath);
  const endNode = queryDomPath(snippet.endContainerPath);
  if (!startNode || !endNode) return;

  const range = document.createRange();
  range.setStart(startNode, snippet.startOffset);
  range.setEnd(endNode, snippet.endOffset);

  applyHighlight(range, snippet.id);
}

// Serialize a DOM node path like BODY:0/DIV:2/P:1
function getDomPath(node) {
  const path = [];
  while (node && node !== document.body && node.nodeType === Node.ELEMENT_NODE) {
    let index = 0;
    let sibling = node.previousSibling;
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === node.nodeName) {
        index++;
      }
      sibling = sibling.previousSibling;
    }
    path.unshift(`${node.nodeName}:${index}`);
    node = node.parentNode;
  }
  return path.join('/');
}

// Reconstruct the node from a serialized path
function queryDomPath(path) {
  const segments = path.split('/');
  let node = document.body;
  for (const segment of segments) {
    const [tag, index] = segment.split(':');
    let count = 0;
    let found = null;
    for (const child of node.childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE && child.nodeName === tag) {
        if (count === parseInt(index)) {
          found = child;
          break;
        }
        count++;
      }
    }
    if (!found) return null;
    node = found;
  }
  return node;
}
