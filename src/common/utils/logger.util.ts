import { createLogger, format, transports, Logger } from 'winston';
import * as path from 'path';
import * as fs from 'fs';

const { combine, printf, timestamp } = format;

const logDir = process.env.LOG_PATH || 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

let lastTimestampAt: number | undefined;

const ansi = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magentaBright: '\x1b[95m',
  cyanBright: '\x1b[96m',
  bold: '\x1b[1m',
} as const;

type NestLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose' | 'fatal';

interface LogEntry {
  level: string;
  message: unknown;
  timestamp: string;
  topic?: string;
  pid?: number;
  [key: string]: unknown;
}

function getColorByLogLevel(level: NestLevel): string {
  switch (level) {
    case 'debug':
      return ansi.magentaBright;
    case 'warn':
      return ansi.yellow;
    case 'error':
      return ansi.red;
    case 'verbose':
      return ansi.cyanBright;
    case 'fatal':
      return ansi.bold;
    default:
      return ansi.green;
  }
}

function colorize(text: string, levelColor: string, colored: boolean): string {
  return colored ? `${levelColor}${text}${ansi.reset}` : text;
}

function formatDate(timestampValue: string): string {
  return new Date(timestampValue).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function buildNestMessage(entry: LogEntry, colored: boolean): string {
  const {
    level: winstonLevel,
    message,
    timestamp: ts,
    topic,
    pid,
    ...meta
  } = entry;
  const nestLevel: NestLevel =
    winstonLevel === 'info' ? 'log' : (winstonLevel as NestLevel);
  const levelColor = getColorByLogLevel(nestLevel);

  const pidMessage = colorize(
    `[Nest] ${pid ?? process.pid}  - `,
    levelColor,
    colored,
  );
  const formattedDate = formatDate(ts);
  const formattedLogLevel = colorize(
    nestLevel.toUpperCase().padStart(7, ' '),
    levelColor,
    colored,
  );
  const contextMessage = topic
    ? colorize(`[${topic}] `, ansi.yellow, colored)
    : '';

  const metaStr =
    Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  const messageText =
    typeof message === 'string' ? message : JSON.stringify(message);
  const output = colorize(`${messageText}${metaStr}`, levelColor, colored);

  const now = new Date(ts).getTime();
  const timestampDiff =
    lastTimestampAt !== undefined
      ? colorize(` +${now - lastTimestampAt}ms`, ansi.yellow, colored)
      : '';
  lastTimestampAt = now;

  return `${pidMessage}${formattedDate} ${formattedLogLevel} ${contextMessage}${output}${timestampDiff}`;
}

const nestFileFormat = printf((info) =>
  buildNestMessage(info as unknown as LogEntry, false),
);
const nestConsoleFormat = printf((info) =>
  buildNestMessage(info as unknown as LogEntry, true),
);

export class LoggerService {
  private logger: Logger;
  private topic: string;

  constructor(topic: string) {
    this.topic = topic;
    const filename = path.join(logDir, `${topic}.log`);

    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: combine(timestamp(), nestFileFormat),
      transports: [
        new transports.Console({
          format: combine(timestamp(), nestConsoleFormat),
        }),
        new transports.File({
          filename,
          format: combine(timestamp(), nestFileFormat),
        }),
      ],
    });
  }

  info(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.info(message, { ...meta, topic: this.topic, pid: process.pid });
  }

  error(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.error(message, {
      ...meta,
      topic: this.topic,
      pid: process.pid,
    });
  }

  warn(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.warn(message, { ...meta, topic: this.topic, pid: process.pid });
  }

  debug(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.debug(message, {
      ...meta,
      topic: this.topic,
      pid: process.pid,
    });
  }
}

export { logDir };
