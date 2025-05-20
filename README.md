
# Tagalyst – Chrome Extension

Highlight + Tag + Annotate any webpage content.

## Features

- Highlight text on any site
- Automatically saves it with timestamp
- View saved snippets in popup

# Chrome Extension Structure (Manifest V3 – ES Modules)

see: https://chatgpt.com/share/682c32b0-9580-8012-9a16-f20d8cd6a73c

## 1. `background.js`
- **Job**: Central controller, handles extension lifecycle events
- **Context**: Extension service worker
  - ✅ Chrome APIs
  - ❌ Page DOM
  - ❌ Page JS
  - ✅ ES6 modules
- **Typical tasks**:
  - Manage messaging
  - Install/update logic
  - Trigger scripts in tabs
- **Notes**: Runs in its own thread, event-driven

## 2. `content.js`
- **Job**: Interface between extension and page DOM
- **Context**: Isolated world injected into webpage
  - ✅ Page DOM
  - ❌ Page JS context
  - ✅ Chrome APIs
  - ✅ ES6 modules
- **Typical tasks**:
  - Highlighting, selection, annotations
  - Injecting scripts
- **Notes**: Shares DOM, not JS; good for observing/interacting with the page visually

## 3. `injected.js`
- **Job**: Script executed in page's own JS context
- **Context**: Page context (via `<script>` injection)
  - ✅ Page DOM
  - ✅ Page JS
  - ❌ Chrome APIs (directly)
  - ✅ ES6 modules (if `type="module"`)
- **Typical tasks**:
  - Hook into page frameworks (e.g., React/Vue)
  - Intercept global JS functions/events
- **Notes**: Use `postMessage` or DOM events to communicate with extension

## 4. `/popup/` (e.g. `popup.html`, `popup.js`)
- **Job**: Extension UI shown when icon is clicked
- **Context**: Isolated HTML page
  - ✅ DOM
  - ❌ Page JS
  - ✅ Chrome APIs
  - ✅ ES6 modules
- **Typical tasks**:
  - Show saved data (e.g., snippets)
  - Trigger actions (e.g., "clear all")
- **Notes**: Like a small web app or widget

## 5. `/modules/`
- **Job**: Internal shared logic
- **Context**: Depends on importer (background/content/popup)
  - Inherits capabilities from caller
  - ✅ ES6 modules
- **Typical tasks**:
  - Utility functions (e.g., logging, storage, text handling)
- **Notes**: Promotes modularity and reuse

## 6. `/libs/`
- **Job**: External ES6-compatible libraries


