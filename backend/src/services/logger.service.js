const winston = require('winston');
const path = require('path');

/**
 * Structured Logger (Winston)
 *
 * Enterprise logging strategy:
 * - Console transport: JSON format for production, colorized for dev
 * - File transport: rotating files for long-term retention
 * - Error-level logs separated for alerting
 *
 * Log levels: error, warn, info, http, verbose, debug, silly
 */

const logDir = path.resolve(__dirname, '../../logs');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(omitSensitive(meta))}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

function omitSensitive(obj) {
  const sensitive = ['password', 'token', 'authorization', 'secret', 'key'];
  const cleaned = { ...obj };
  for (const key of sensitive) {
    if (cleaned[key]) cleaned[key] = '[REDACTED]';
  }
  if (cleaned.headers?.authorization) cleaned.headers.authorization = '[REDACTED]';
  return cleaned;
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'hospital-management-api' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    }),
  ],
});

// File transports only in non-serverless environments
if (process.env.NODE_ENV !== 'production' || process.env.LOG_TO_FILE === 'true') {
  const fs = require('fs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 20,
    })
  );
}

// Create a stream object for Morgan
logger.stream = {
  write(message) {
    logger.http(message.trim());
  },
};

module.exports = logger;

