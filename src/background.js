
import { logInfo } from './modules/logger.js';

chrome.runtime.onInstalled.addListener(() => {
  logInfo('Tagalyst installed and ready.');
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  logInfo('Service worker received message:', msg, 'from:', sender);
  sendResponse({ status: 'ok' });
});

