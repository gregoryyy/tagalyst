
import { logInfo } from './modules/logger.js';

async function fetchData() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    logInfo('Fetched data:', data);
  } catch (error) {
    logInfo('Fetch error:', error.message);
  }
}

document.addEventListener('DOMContentLoaded', fetchData);
