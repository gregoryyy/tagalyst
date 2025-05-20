
import { logInfo } from './logger.js';

export async function saveSnippet(snippet) {
  const { snippets = [] } = await chrome.storage.local.get('snippets');
  logInfo('Saving snippet:', snippet)
  snippets.push(snippet);
  await chrome.storage.local.set({ snippets });
}

export async function loadSnippets() {
  const { snippets = [] } = await chrome.storage.local.get('snippets');
  logInfo('Loading snippets:', snippets);
  return snippets;
}
