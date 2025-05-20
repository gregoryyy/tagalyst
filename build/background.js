
import { logInfo } from './modules/logger.js';

chrome.runtime.onInstalled.addListener(() => {
  logInfo('Tagalyst installed and ready.');
});
