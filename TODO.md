# Development tasks

## Bugs

- Highlight
  - Create
    - [ ] Multiline selection works but breaks DOM
    - [ ] Single line selection does not show highlight
  - Replay
    - [ ] Reload does not reapply highlights
- Storage
  - [x] Data not saved to localstorage
  - [ ] Data not retrieved


## Features

- Browser page
  - [x] Selection on a page highlights an arbitrary section of text (snippet)
  - [x] Snippet is saved to local storage
  - [ ] Choose color
  - [ ] Add tags
  - [ ] Add note
  - [ ] Edge cases
    - [ ] Multiline snippets
    - [ ] Overlapping snippets
- Reload page (URL with snippets)
  - [x] Reproduce selection from storage (DOM path and offset)
  - [ ] 
- Snippet page (extension popup)
  - [ ] List known snippets (bug)
  - [ ] Delete snippets
  - [ ] Transpose snippets: Sort by tags
  - [ ] Search snippets: fulltext
- Import and Export page (on snippet page)
  - [ ] Serialize to JSON
  - [ ] Import from JSON