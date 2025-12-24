/**
 * Production-safe logger utility
 *
 * Only logs in development mode to prevent:
 * - Performance impact of console calls in production
 * - Exposure of sensitive information in browser console
 * - Unnecessary noise in production environments
 */

const isDev = import.meta.env.DEV;

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface Logger {
  log: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  group: (label: string) => void;
  groupEnd: () => void;
  table: (data: unknown) => void;
}

function createLogger(): Logger {
  const noop = () => {};

  const logMethod = (level: LogLevel) => {
    if (!isDev) return noop;
    return (...args: unknown[]) => {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
      const prefix = `[${timestamp}]`;
      console[level](prefix, ...args);
    };
  };

  return {
    log: logMethod('log'),
    info: logMethod('info'),
    warn: logMethod('warn'),
    // Always log errors, even in production (but without sensitive data)
    error: (...args: unknown[]) => {
      if (isDev) {
        console.error('[ERROR]', ...args);
      } else {
        // In production, only log error messages, not objects that might contain sensitive data
        const safeArgs = args.map(arg =>
          typeof arg === 'string' ? arg : '[object]'
        );
        console.error('[ERROR]', ...safeArgs);
      }
    },
    debug: logMethod('debug'),
    group: isDev ? (label: string) => console.group(label) : noop,
    groupEnd: isDev ? () => console.groupEnd() : noop,
    table: isDev ? (data: unknown) => console.table(data) : noop,
  };
}

export const logger = createLogger();

/**
 * Performance timing helper - only in development
 */
export function timeStart(label: string): void {
  if (isDev) {
    console.time(label);
  }
}

export function timeEnd(label: string): void {
  if (isDev) {
    console.timeEnd(label);
  }
}

/**
 * Conditional logging based on feature flags
 */
export function logIf(condition: boolean, ...args: unknown[]): void {
  if (condition && isDev) {
    logger.log(...args);
  }
}
