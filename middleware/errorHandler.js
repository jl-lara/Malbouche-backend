import { logger } from '../services/logger.js';

export const errorHandler = (err, req, res, next) => {
<<<<<<< HEAD
  logger.error('🚨 Error no manejado:', {
=======
  logger.error('🚨 Unhandled error:', {
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error response
  let statusCode = 500;
<<<<<<< HEAD
  let message = 'Error interno del servidor';
=======
  let message = 'Internal server error';
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
<<<<<<< HEAD
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
=======
    message = 'Validation error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Not found';
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
    message = 'Conflict';
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
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
<<<<<<< HEAD
  constructor(message = 'No autorizado') {
=======
  constructor(message = 'Unauthorized') {
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
<<<<<<< HEAD
  constructor(message = 'Prohibido') {
=======
  constructor(message = 'Forbidden') {
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
<<<<<<< HEAD
  constructor(message = 'No encontrado') {
=======
  constructor(message = 'Not found') {
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
<<<<<<< HEAD
  constructor(message = 'Conflicto') {
=======
  constructor(message = 'Conflict') {
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
    super(message);
    this.name = 'ConflictError';
  }
}