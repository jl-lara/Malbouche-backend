import { body, param, validationResult } from 'express-validator';

<<<<<<< HEAD
// Middleware para manejar errores de validación
=======
// Middleware to handle validation errors
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
<<<<<<< HEAD
      error: 'Errores de validación',
=======
      error: 'Validation errors',
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
      details: errors.array()
    });
  }
  next();
};

<<<<<<< HEAD
// Validaciones para usuarios
export const validateUser = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('apellidos')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Los apellidos deben tener entre 2 y 50 caracteres'),
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un correo válido'),
  body('puesto')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El puesto no puede exceder 100 caracteres'),
  body('rol')
    .isIn(['admin', 'usuario', 'visitante'])
    .withMessage('El rol debe ser: admin, usuario o visitante'),
  handleValidationErrors
];

// Validaciones para login
export const validateLogin = [
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un correo válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  handleValidationErrors
];

// Validaciones para registro
export const validateRegister = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('apellidos')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Los apellidos deben tener entre 2 y 50 caracteres'),
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un correo válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('puesto')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El puesto no puede exceder 100 caracteres'),
  handleValidationErrors
];

// Validaciones para movimientos
export const validateMovimiento = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('tipoMovimiento')
    .isIn(['derecha', 'izquierda', 'columpiarse', 'loco', 'normal', 'personalizado'])
    .withMessage('Tipo de movimiento inválido'),
  body('velocidad')
    .isInt({ min: 1, max: 100 })
    .withMessage('La velocidad debe ser un número entre 1 y 100'),
  body('duracion')
    .isInt({ min: 1, max: 3600 })
    .withMessage('La duración debe ser un número entre 1 y 3600 segundos'),
  handleValidationErrors
];

// Validaciones para eventos
export const validateEvento = [
  body('nombreEvento')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre del evento debe tener entre 2 y 100 caracteres'),
  body('horaInicio')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('La hora de inicio debe tener formato HH:MM'),
  body('horaFin')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('La hora de fin debe tener formato HH:MM'),
  body('diasSemana')
    .isArray({ min: 1 })
    .withMessage('Debe seleccionar al menos un día de la semana'),
  body('diasSemana.*')
    .isIn(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'])
    .withMessage('Día de la semana inválido'),
  body('tipoMovimiento')
    .isIn(['derecha', 'izquierda', 'columpiarse', 'loco', 'normal', 'personalizado'])
    .withMessage('Tipo de movimiento inválido'),
  handleValidationErrors
];

// Validación para parámetros de ID
export const validateId = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID requerido'),
=======
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
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
  handleValidationErrors
];