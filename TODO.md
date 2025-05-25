# Development tasks

## Bugs

- Highlight
  - Create
    - [x] Multiline selection works but breaks DOM
    - [x] Single line selection does not show highlight
  - Restore
    - [x] Reload does not reapply highlights
    - [x] ...some highlights (storage format issue)
    - [x] last highlight on one page not displayed on reload
    - [ ] Lookup breaks for dynamic pages incl. unlost markit and chatGPT UI
      - [x] try robust escalating variant in snippet.js
        - [ ] port Hypothesis logic
        - [ ] port 
      - [ ] text for single word selection not stored
- Storage
  - [x] Data not saved to localstorage
  - [x] Data not retrieved

## Features

High-level: see README.md

- Browser page
  - [x] Selection on a page highlights an arbitrary section of text (snippet)
  - [x] Snippet is saved to local storage
  - [x] Scroll to snippet position (incl. page change if needed)
  - [ ] Choose color
  - [ ] Add tags
  - [ ] Add note
  - [ ] Edge cases
    - [x] Multiline snippets
    - [ ] Overlapping snippets
- Reload page (URL with snippets)
  - [x] Reproduce selection from storage (DOM path and offset)
  - [ ] Delete snippets: a) when overlapping, b) via popup list
  - [ ] Change color of snippets
- Snippet page (extension popup)
  - [x] List known snippets
  - [ ] List UX and adjust size (sidebar?)
  - [ ] Delete snippets
  - [ ] Search snippets: fulltext
- Mashups page
  - [ ] Snippet manager page
  - [ ] Transpose snippets: Sort by tags and other predicates, 
  - [ ] Documents from Snippet mashups
- Options page
  - [ ] Key settings
  - [ ] Credentials
- Import and Export page (on snippet page)
  - [ ] Serialize to JSON
  - [ ] Import from JSON
- Build system
  - [x] Start in Chrome instance --> lounch.json
  - [x] Create source maps
- Chrome Webstore
  - [ ] Publish version 1.0

Note:
- On chatgpt: Uncaught (in promise) Error: Extension context invalidated.
  - In Snippet.restore().attemptRestore() in or around checkHighlight
- Robust annotation anchoring and management:
  - https://github.com/hypothesis/ 
    - ./browser-extension: extensions
    - ./client: Used by the extension and directly embedded into pages
      - https://github.com/hypothesis/client/blob/main/src/annotator/highlighter.ts
      - https://github.com/hypothesis/client/tree/main/src/annotator/anchoring
  - https://www.w3.org/TR/annotation-model/
    - cf. #textquoteselector
  - https://github.com/recogito/recogito-js
     - Implements the W3C Web Annotation Data Model.
     - Supports XPathSelector (for HTML) and position-based selectors (for PDFs).
  - https://github.com/openannotation/annotator
    - building annotation applications in browsers
    - seems mostly XPath centric
  - https://github.com/net7/pundit-client
    - Pundit Annotator incl. Chrome extension
    - ./pundit-anchoring: DOM anchoring strategies: Fragment (XPath), Text Position, Text Quote
  - --> adapt


## History

- 24 May 2025  v0.4.0:
  - scroll to snippet
  - snippet structure and serialization
  - robust multi-anchor positioning and escalated restore
  - fix: last selection bug
- 23 May 2025  v0.3:
  - rangy working 
  - bug: last selection is ignored (although in stored)
  - test cascaded restore based on text location and content (cf. Web Annotation model)
- 22 May 2025  v0.2.3:
  - try_rangy branch: Replace texthighlighter with newer rangy -> main
  - Longer-term concepts
  - Fixes
- 21 May 2025  v0.2.2:
  - Rollup branch: Fixes -> merge to main
  - Debug environment: Code maps, Debug all contexts in VS Code
- 20 May 2025  v0.2.1:
  - Working round-trip, with bugs 2h
  - Dev environment, research JS module types, Chrome runtime contexts and sandboxing 4h
  - Insight: LLM gives you hints but you need to keep using System 1
- 19 May 2025  v0.1.0:
  - Requirements, other solutions
  - Quick naive attempt without rollup
  - Insight: There's a lot of plugins out there but none work with ChatGPT properly
