
import { dataStore } from './config.js';
import { logInfo } from './logger.js';

export async function saveSnippet(snippet) {
  const { snippets = [] } = await dataStore.get('snippets');
  logInfo('Saving snippet:', snippet)
  snippets.push(snippet);
  await dataStore.set({ snippets });
}

export async function loadSnippets() {
  const { snippets = [] } = await dataStore.get('snippets');
  logInfo('Loading snippets:', snippets);
  return snippets;
}
