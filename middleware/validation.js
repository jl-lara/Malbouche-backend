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

// User validations
export const validateUser = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('apellidos')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email'),
  body('puesto')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Position cannot exceed 100 characters'),
  body('rol')
    .isIn(['admin', 'usuario', 'vip'])
    .withMessage('Role must be: admin, usuario or vip'),
  handleValidationErrors
];

// Login validations
export const validateLogin = [
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

// Register validations
export const validateRegister = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
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
  body('duracion')
    .isInt({ min: 1 })
    .withMessage('La duración debe ser un número entero positivo'),
  body('movimiento')
    .optional()
    .isObject()
    .withMessage('El campo movimiento debe ser un objeto'),
  body('movimiento.direccionGeneral')
    .optional()
    .isIn(['derecha', 'izquierda'])
    .withMessage('direccionGeneral debe ser "derecha" o "izquierda"'),
  body('movimiento.horas')
    .optional()
    .isObject()
    .withMessage('El campo movimiento.horas debe ser un objeto'),
  body('movimiento.horas.direccion')
    .optional()
    .isIn(['derecha', 'izquierda'])
    .withMessage('movimiento.horas.direccion debe ser "derecha" o "izquierda"'),
  body('movimiento.horas.velocidad')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('movimiento.horas.velocidad debe ser un número entre 1 y 100'),
  body('movimiento.horas.angulo')
    .optional()
    .isFloat({ min: 0.1, max: 360 })
    .withMessage('movimiento.horas.angulo debe ser un número entre 0.1 y 360 grados'),
  body('movimiento.minutos')
    .optional()
    .isObject()
    .withMessage('El campo movimiento.minutos debe ser un objeto'),
  body('movimiento.minutos.direccion')
    .optional()
    .isIn(['derecha', 'izquierda'])
    .withMessage('movimiento.minutos.direccion debe ser "derecha" o "izquierda"'),
  body('movimiento.minutos.velocidad')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('movimiento.minutos.velocidad debe ser un número entre 1 y 100'),
  body('movimiento.minutos.angulo')
    .optional()
    .isFloat({ min: 0.1, max: 360 })
    .withMessage('movimiento.minutos.angulo debe ser un número entre 0.1 y 360 grados'),
  handleValidationErrors
];

// Validación para actualización de movimientos (todos los campos opcionales)
export const validateMovimientoUpdate = [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('duracion')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La duración debe ser un número entero positivo'),
  body('movimiento')
    .optional()
    .isObject()
    .withMessage('El campo movimiento debe ser un objeto'),
  body('movimiento.direccionGeneral')
    .optional()
    .isIn(['derecha', 'izquierda'])
    .withMessage('direccionGeneral debe ser "derecha" o "izquierda"'),
  body('movimiento.horas')
    .optional()
    .isObject()
    .withMessage('El campo movimiento.horas debe ser un objeto'),
  body('movimiento.horas.direccion')
    .optional()
    .isIn(['derecha', 'izquierda'])
    .withMessage('movimiento.horas.direccion debe ser "derecha" o "izquierda"'),
  body('movimiento.horas.velocidad')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('movimiento.horas.velocidad debe ser un número entre 1 y 100'),
  body('movimiento.horas.angulo')
    .optional()
    .isFloat({ min: 0.1, max: 360 })
    .withMessage('movimiento.horas.angulo debe ser un número entre 0.1 y 360 grados'),
  body('movimiento.minutos')
    .optional()
    .isObject()
    .withMessage('El campo movimiento.minutos debe ser un objeto'),
  body('movimiento.minutos.direccion')
    .optional()
    .isIn(['derecha', 'izquierda'])
    .withMessage('movimiento.minutos.direccion debe ser "derecha" o "izquierda"'),
  body('movimiento.minutos.velocidad')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('movimiento.minutos.velocidad debe ser un número entre 1 y 100'),
  body('movimiento.minutos.angulo')
    .optional()
    .isFloat({ min: 0.1, max: 360 })
    .withMessage('movimiento.minutos.angulo debe ser un número entre 0.1 y 360 grados'),
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
    .isIn(['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'])
    .withMessage('Día de la semana inválido'),
  body('movementId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('El ID del movimiento es requerido'),
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('El campo enabled debe ser booleano'),
  handleValidationErrors
];

// Validación para parámetros de ID
export const validateId = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID requerido'),
  handleValidationErrors
];