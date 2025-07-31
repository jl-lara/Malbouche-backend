import winston from 'winston';

// Nivel de log configurable via variable de entorno para debugging
const logLevel = process.env.LOG_LEVEL || 'info'; // Por defecto info para debugging

// Create a logger that shows info for EventScheduler debugging
const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'malbouche-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      level: logLevel
    })
  ]
});

// Log de configuración inicial
logger.info(`🔧 Logger configurado - Nivel: ${logLevel} (NODE_ENV: ${process.env.NODE_ENV})`);

// Keep the logger functional for EventScheduler
export { logger };