
# Tagalyst – Chrome Extension

Highlight + Tag + Annotate any webpage content.

# Features

- Highlight text on any site
- Automatically saves it with timestamp
- View saved snippets in popup


# Development

## Project structure

```
tagalyst-extension/
├── build/                     ← Load this in `chrome://extensions`
│   ├── manifest.json
│   ├── background.js          ← Bundled background script (from Rollup)
│   ├── content.js             ← Bundled content script (from Rollup)
│   ├── injected.js
│   ├── popup/
│   │   ├── popup.html
│   │   └── popup.js
│   └── assets/
│       └── icon48.png
│
├── src/                       ← Source modules for Rollup bundling
│   ├── content.js
│   ├── logger.js
│   ├── highlighter.js
│   └── storage.js
│
├── rollup.config.js
├── README.md
└── .gitignore
```

## Develop


```bash
# prerequisite (Mac example):
brew install node

# install dependencies
npm install --save-dev rollup @rollup/plugin-node-resolve

# compile src/content.js and its module imports into dist/content.js.
npx rollup -c
# Alternative: Use package.json and run build
npm run build
# Alternative: Use package.json and dev with watch option -w
npm run dev
```

## Run

Reload extension from `build/` in `chrome://extensions`


# Appendix: Chrome Extension Structure

- Manifest V3 – ES Modules
- relative to /build directory

see: https://chatgpt.com/share/682c32b0-9580-8012-9a16-f20d8cd6a73c

## 1. `background.js`
- **Job**: Central controller, handles extension lifecycle events
- **Context**: Extension service worker
  - ✅ Chrome APIs
  - ❌ Page DOM
  - ❌ Page JS
  - ✅ ES6 modules (native, ES)
- **Typical tasks**:
  - Manage messaging
  - Handle extension installation, updates
  - Trigger scripts in tabs or react to tab events
- **Notes**: Runs independently in the background, event-driven

## 2. `content.js`
- **Job**: Interface between extension and page DOM
- **Context**: Isolated world injected into the webpage
  - ✅ Page DOM
  - ❌ Page JS context
  - ✅ Chrome APIs
  - ❌ Native ES6 module `import` (CORS and sandbox restrictions)
- **Typical tasks**:
  - Read or modify DOM (e.g., highlight selections)
  - Inject scripts into the page
- **Notes**: Content scripts must be bundled (e.g. IIFE type with Rollup, Webpack) to use ES6 module logic; native `import` statements fail due to cross-origin isolation

## 3. `injected.js`
- **Job**: Script executed in the page’s own JavaScript context
- **Context**: Page JS context (injected via `<script>` tag)
  - ✅ Page DOM
  - ✅ Page JS (same global scope as site)
  - ❌ Chrome extension APIs
  - ⚠️ ES6 modules only work if fully bundled or paths resolve correctly via `type="module"`
- **Typical tasks**:
  - Hook into or patch site frameworks (e.g., React state, third-party widgets)
  - Listen for or dispatch custom events
- **Notes**: Must use `postMessage` or DOM events to communicate with the extension; bundle all logic into a single file if using modules

## 4. `/popup/` 
E.g. `popup.html`, `popup.js`:
- **Job**: Extension UI shown when the extension icon is clicked
- **Context**: HTML document in extension context
  - ✅ DOM
  - ❌ Page JS
  - ✅ Chrome APIs
  - ✅ ES6 modules (via `<script type="module">`)
- **Typical tasks**:
  - Display data stored in the extension (e.g., snippets)
  - Trigger actions (e.g., clear data, open tab)
- **Notes**: Fully isolated like a mini web app; behaves like a standalone HTML page

## 5. `../src/modules/`
If bundled, else `./modules`:
- **Job**: Internal shared logic
- **Context**: Imported by background, popup, or bundled content scripts
  - ✅ ES6 modules (used at build time or in popup/background)
  - Inherits capabilities from the importing script
- **Typical tasks**:
  - Utilities (logging, time formatting, storage abstraction, etc.)
- **Notes**: Should be bundled when used in `content.js`

## 6. `../node_modules/`
If bundled, else `./modules`:
- **Job**: Vendored external libraries written in ES6 module format
  - Libraries are typically integrated using `npm install`
  - `package.json` to get an overview
- **Context**: Imported where needed (typically via bundler)
  - ✅ ES6 modules (must be resolvable by Rollup/Webpack/etc.)
- **Typical tasks**:
  - e.g. `uuid`, `marked`, `lodash-es`, custom client SDKs
- **Notes**: Avoid direct imports from `content.js` unless bundled; use only ESM-compatible libraries
