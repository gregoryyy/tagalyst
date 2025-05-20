import { getSelectedText } from './highlighter.js';
import { logInfo } from './logger.js';
import { saveSnippet } from './storage.js';

document.addEventListener('mouseup', async () => {
  const selectedText = getSelectedText();
  if (selectedText) {
    const snippet = {
      text: selectedText,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    await saveSnippet(snippet);
    logInfo('Snippet saved:', snippet);
  }
});
