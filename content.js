import { getSelectedText } from './modules/highlighter.js';
import { logInfo } from './modules/logger.js';
import { saveSnippet } from './modules/storage.js';

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
