import { logger } from '../services/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('🚨 Error no manejado:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error response
  let statusCode = 500;
  let message = 'Error interno del servidor';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'No autorizado';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Prohibido';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'No encontrado';
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
    message = 'Conflicto';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
      stack: err.stack
    })
  });
};

// Custom error classes
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'No autorizado') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Prohibido') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'No encontrado') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message = 'Conflicto') {
    super(message);
    this.name = 'ConflictError';
  }
}