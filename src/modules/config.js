// This file defines configuration.

/**
 * The highlight CSS class and style.
 */
export const highlightClass = 'tagalyst-highlight';
export const highlightStyle = {
        backgroundColor: 'yellow',
        padding: '0.1em',
        borderRadius: '2px'
    };

/**
 * flash highlight CSS class and style.
 */
export const highlightFlashClass = 'tagalyst-highlight-flash';
export const highlightFlashStyle = {
  outline: '2px solid orange !important',
  transition: 'outline 0.2s'
};

    
/**
 * The storage object to use for storing snippets.
 */
export const dataStore = chrome.storage.local;

/**
 * The maximum escalation level for matching page content with snippets.
 * 1 = DOM structure (XPath / Rangy), 2 = text position (TextPosition), 
 * 3 = text content + context (TextMatch), 4 = text content only.
 */
export const maxMatchLevel = 3;
