import { body, param, validationResult } from 'express-validator';

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation errors',
      details: errors.array()
    });
  }
  next();
};

// Validations for users
export const validateUser = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email'),
  body('position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Position cannot exceed 100 characters'),
  body('role')
    .isIn(['admin', 'user', 'guest'])
    .withMessage('Role must be: admin, user or guest'),
  handleValidationErrors
];

// Validations for login
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

// Validations for registration
export const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Position cannot exceed 100 characters'),
  handleValidationErrors
];

// Validations for movements
export const validateMovement = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('movementType')
    .isIn(['right', 'left', 'swing', 'crazy', 'normal', 'custom'])
    .withMessage('Invalid movement type'),
  body('speed')
    .isInt({ min: 1, max: 100 })
    .withMessage('Speed must be a number between 1 and 100'),
  body('duration')
    .isInt({ min: 1, max: 3600 })
    .withMessage('Duration must be a number between 1 and 3600 seconds'),
  handleValidationErrors
];

// Validations for events
export const validateEvent = [
  body('eventName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Event name must be between 2 and 100 characters'),
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must have HH:MM format'),
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must have HH:MM format'),
  body('weekDays')
    .isArray({ min: 1 })
    .withMessage('Must select at least one day of the week'),
  body('weekDays.*')
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Invalid day of the week'),
  body('movementType')
    .isIn(['right', 'left', 'swing', 'crazy', 'normal', 'custom'])
    .withMessage('Invalid movement type'),
  handleValidationErrors
];

// Validation for ID parameters
export const validateId = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID required'),
  handleValidationErrors
];