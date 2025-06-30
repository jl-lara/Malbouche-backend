import { body, param, validationResult } from 'express-validator';

// Middleware para manejar errores de validación
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Errores de validación',
      details: errors.array()
    });
  }
  next();
};

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
    .isIn(['admin', 'usuario', 'vip'])
    .withMessage('El rol debe ser: admin, usuario o vip'),
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
  body('tipoMovimientoHoras')
    .isIn(['derecha', 'izquierda'])
    .withMessage('Tipo de movimiento inválido'),
  body('velocidadHora')
    .isInt({ min: 1, max: 100 })
    .withMessage('La velocidad debe ser un número entre 1 y 100'),
  body('tipoMovimientoMinutos')
    .isIn(['derecha', 'izquierda'])
    .withMessage('Tipo de movimiento inválido'),
  body('velocidadMinuto')
    .isInt({ min: 1, max: 100 })
    .withMessage('La velocidad debe ser un número entre 1 y 100'),
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
  handleValidationErrors
];