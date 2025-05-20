export async function saveSnippet(snippet) {
  const { snippets = [] } = await chrome.storage.local.get('snippets');
  snippets.push(snippet);
  await chrome.storage.local.set({ snippets });
}

export async function loadSnippets() {
  const { snippets = [] } = await chrome.storage.local.get('snippets');
  return snippets;
}
