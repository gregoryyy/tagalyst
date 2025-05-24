// This file defines configuration.

/**
 * The highlight CSS class.
 */
export const highlightClass = 'tagalyst-highlight';

/**
 * The style to use for highlighting text.
 */
export const highlightStyle = {
        backgroundColor: 'yellow',
        padding: '0.1em',
        borderRadius: '2px'
    };
    
/**
 * The storage object to use for storing snippets.
 */
export const dataStore = chrome.storage.local;

/**
 * The maximum escalation level for matching page content with snippets.
 * 1 = DOM structure (XPath / Rangy), 2 = text position (TextPosition), 3 = text content + context (TextMatch)
 */
export const maxMatchLevel = 3;
