
const HIGHLIGHT_CLASS = 'tagalyst-highlight';

export function getSelectedRange() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  return selection.getRangeAt(0).cloneRange();
}

export function applyHighlight(range, id) {
  const span = document.createElement('span');
  span.className = HIGHLIGHT_CLASS;
  span.dataset.tagalystId = id;
  span.style.backgroundColor = 'yellow';

  range.surroundContents(span);
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

function getDomPath(node) {
  const path = [];
  while (node && node.nodeType === Node.ELEMENT_NODE) {
    let index = 0;
    let sibling = node.previousSibling;
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === node.nodeName) index++;
      sibling = sibling.previousSibling;
    }
    path.unshift(`${node.nodeName}:${index}`);
    node = node.parentNode;
  }
  return path.join('/');
}

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
