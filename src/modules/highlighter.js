
export function getSelectedText() {
  const selection = window.getSelection();
  return selection ? selection.toString().trim() : '';
}
