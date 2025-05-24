import { debugLevel } from "./config.js";

// Level names for prefix
const levelNames = ['[FATAL]', '[ERROR]', '[WARN]', '[INFO]', '[DEBUG]'];

// Logging functions mapped by level (1=fatal, 5=debug)
const levelFns = [
  console.error, // 1: fatal
  console.error, // 2: error
  console.warn,  // 3: warn
  console.log,   // 4: info
  console.debug  // 5: debug
];

function stacklog(level, ...args) {
  // Ensure level is within 1-5 and not above debugLevel
  if (level < 1 || level > 5 || level > debugLevel) return;
  let prefix = levelNames[level - 1] + ' [Tagalyst]';
  try {
    const stack = new Error().stack.split('\n');
    const fullLine = stack[3]?.trim() || '';
    const match = fullLine.match(/\(?(.+):(\d+):(\d+)\)?$/);
    if (match) {
      const shortName = match[1].split('/').pop();
      prefix = `${levelNames[level - 1]} ${shortName}:${match[2]}:${match[3]} [Tagalyst]`;
    }
  } catch {}
  (levelFns[level - 1] || console.log)(`${prefix}`, ...args);
}

// Exported loggers with proper level order (1=fatal, 5=debug)
export const [logFatal, logError, logWarn, logInfo, logDebug] =
  [1, 2, 3, 4, 5].map(level => (...args) => stacklog(level, ...args));

export const logTrace = (...args) => {
  let loc = 'unknown';
  try {
    const stack = new Error().stack.split('\n');
    const match = stack[2]?.trim().match(/\(?(.+):(\d+):(\d+)\)?$/);
    if (match) loc = `${match[1].split('/').pop()}:${match[2]}:${match[3]}`;
  } catch {}
  const label = `[Tagalyst] TRACE ${loc}`;
  console.groupCollapsed(label, ...args);
  console.trace();
  console.groupEnd();
};
