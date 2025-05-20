function stacklog(level, ...args) {
  const fullLine = new Error().stack.split('\n')[3].trim();
  const match = fullLine.match(/\(?(.+):(\d+):(\d+)\)?$/);
  if (!match) return console.log('[Tagalyst]', ...args);

  const fullPath = `${match[1]}:${match[2]}:${match[3]}`;
  const shortName = match[1].split('/').pop();
  const prefix = `${shortName}:${match[2]}:${match[3]} [Tagalyst]`;

  const logFn = { 1: console.log, 2: console.error, 3: console.warn }[level] || console.log;

  // Log from a fake stack frame so Chrome won't link to here
  logFn.bind(null)(`${prefix}`, ...args);
}

export const logInfo = (...args) => stacklog(1, ...args);
export const logError = (...args) => stacklog(2, ...args);
export const logWarn = (...args) => stacklog(3, ...args);

export const logTrace = (...args) => {
  const stackLine = new Error().stack.split('\n')[2].trim(); // skip logTrace and Error lines
  const match = stackLine.match(/\(?(.+):(\d+):(\d+)\)?$/);
  const loc = match ? `${match[1].split('/').pop()}:${match[2]}:${match[3]}` : 'unknown';

  const label = `[Tagalyst] TRACE ${loc}`;
  console.groupCollapsed(label, ...args);
  console.trace();
  console.groupEnd();
};
