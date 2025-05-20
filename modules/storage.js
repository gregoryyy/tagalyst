export async function saveSnippet(snippet) {
  const { snippets = [] } = await chrome.storage.local.get('snippets');
  snippets.push(snippet);
  await chrome.storage.local.set({ snippets });
}
