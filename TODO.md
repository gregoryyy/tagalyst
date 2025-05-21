# Development tasks

## Bugs

- Highlight
  - Create
    - [x] Multiline selection works but breaks DOM
    - [x] Single line selection does not show highlight
  - Replay
    - [x] Reload does not reapply highlights
    - [ ] ...some highlights (storage format issue)
- Storage
  - [x] Data not saved to localstorage
  - [x] Data not retrieved
- Architecture
  - [ ] Full ES port of TextHighlighter lib


## Features

- Browser page
  - [x] Selection on a page highlights an arbitrary section of text (snippet)
  - [x] Snippet is saved to local storage
  - [ ] Choose color
  - [ ] Add tags
  - [ ] Add note
  - [ ] Edge cases
    - [x] Multiline snippets
    - [ ] Overlapping snippets
- Reload page (URL with snippets)
  - [x] Reproduce selection from storage (DOM path and offset)
  - [ ] Delete snippets
  - [ ] Change color of snippets
- Snippet page (extension popup)
  - [ ] List known snippets (bug)
  - [ ] Delete snippets
  - [ ] Transpose snippets: Sort by tags
  - [ ] Search snippets: fulltext
- Import and Export page (on snippet page)
  - [ ] Serialize to JSON
  - [ ] Import from JSON

## History

- 21 May 2025  v0.2.2:
  - Fixes
  - Add notes
  - Popup
- 20 May 2025  v0.2.1:
  - Working round-trip, with bugs 2h
  - Dev environment, research JS module types, Chrome runtime contexts and sandboxing 4h
  - Insight: LLM gives you hints but you need to keep using System 1
- 19 May 2025  v0.1.0:
  - Requirements, other solutions
  - Quick naive attempt without rollup
  - Insight: There's a lot of plugins out there but none work with ChatGPT properly
