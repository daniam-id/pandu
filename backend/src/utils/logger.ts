import pino from 'pino';

const pinoInstance = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ severity: label.toUpperCase() }),
    bindings: () => ({ service: 'pandu-backend' }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ['req.headers["x-api-key"]', 'req.headers.cookie'],
});

/**
 * Console-compatible logger for incremental migration.
 * Accepts the same call signatures as console.log/warn/error/info
 * but outputs structured JSON via Pino.
 */
export const logger = {
  info(...args: unknown[]): void {
    pinoInstance.info(serializeArgs(args));
  },
  warn(...args: unknown[]): void {
    pinoInstance.warn(serializeArgs(args));
  },
  error(...args: unknown[]): void {
    pinoInstance.error(serializeArgs(args));
  },
  fatal(...args: unknown[]): void {
    pinoInstance.fatal(serializeArgs(args));
  },
};

function serializeArgs(args: unknown[]): Record<string, unknown> | string {
  if (args.length === 0) return {};
  if (args.length === 1 && typeof args[0] === 'string') return args[0];
  // Merge all args: strings become "msg", objects/errors become structured fields
  const msgParts: string[] = [];
  const obj: Record<string, unknown> = {};
  for (const arg of args) {
    if (typeof arg === 'string') {
      msgParts.push(arg);
    } else if (arg instanceof Error) {
      obj.err = { message: arg.message, stack: arg.stack };
    } else if (typeof arg === 'object' && arg !== null) {
      Object.assign(obj, arg);
    }
  }
  if (msgParts.length > 0) obj.msg = msgParts.join(' ');
  return obj;
}
