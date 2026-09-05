import { createLogger, format, transports, Logger } from 'winston';
import * as path from 'path';
import * as fs from 'fs';

const { combine, printf, colorize } = format;

const logDir = process.env.LOG_PATH || 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const dateFormat = () =>
  new Date().toLocaleString('en-EG', { timeZone: 'Africa/Cairo' });

const customFormat = printf(({ level, message, ...meta }) => {
  let log = `${dateFormat()} | ${level.toUpperCase()} | ${String(message)}`;
  if (Object.keys(meta).length > 0) {
    log += ` | ${JSON.stringify(meta)}`;
  }
  return log;
});

export class LoggerService {
  private logger: Logger;
  private topic: string;

  constructor(topic: string) {
    this.topic = topic;
    const filename = path.join(logDir, `${topic}.log`);

    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: combine(customFormat),
      transports: [
        new transports.Console({
          format: combine(customFormat, colorize({ all: true })),
        }),
        new transports.File({ filename }),
      ],
    });
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }
}

export { logDir };
