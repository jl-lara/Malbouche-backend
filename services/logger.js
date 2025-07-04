import winston from 'winston';

// Create a minimal logger that only logs critical errors
const logger = winston.createLogger({
  level: 'error', // Changed from 'info' to 'error' - only log errors
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'malbouche-backend' },
  transports: [
    // Only console transport for critical errors
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      level: 'error' // Only show errors in console
    })
  ]
});

// Override info, warn, and debug methods to do nothing
logger.info = () => {};
logger.warn = () => {};
logger.debug = () => {};
logger.verbose = () => {};

export { logger };