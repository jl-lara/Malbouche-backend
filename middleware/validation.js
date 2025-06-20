import Joi from 'joi';

// Validation schemas
const eventSchema = Joi.object({
  eventName: Joi.string().min(1).max(100).required(),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  days: Joi.array().items(Joi.string()).min(1).required(),
  movements: Joi.array().items(Joi.object({
    type: Joi.string().valid('Left', 'Right', 'Swing', 'Crazy').required(),
    speed: Joi.number().min(1).max(100).required(),
    time: Joi.number().min(1).max(3600).required()
  })).optional()
});

const deviceSchema = Joi.object({
  deviceId: Joi.string().min(1).max(50).required(),
  name: Joi.string().min(1).max(100).required(),
  type: Joi.string().valid('ESP32_CLOCK').default('ESP32_CLOCK'),
  macAddress: Joi.string().pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/).required(),
  ipAddress: Joi.string().ip().required()
});

const movementSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  type: Joi.string().valid('Left', 'Right', 'Swing', 'Crazy').required(),
  speed: Joi.number().min(1).max(100).required(),
  time: Joi.number().min(1).max(3600).required(),
  description: Joi.string().max(500).optional()
});

const commandSchema = Joi.object({
  command: Joi.string().valid(
    'calibrate', 
    'set_time', 
    'execute_movement', 
    'get_status', 
    'reset',
    'update_settings'
  ).required(),
  parameters: Joi.object().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(1).max(100).required()
});

const userSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional()
});

// Validation middleware functions
export function validateEvent(req, res, next) {
  const { error } = eventSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details[0].message
    });
  }
  next();
}

export function validateDevice(req, res, next) {
  const { error } = deviceSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details[0].message
    });
  }
  next();
}

export function validateMovement(req, res, next) {
  const { error } = movementSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details[0].message
    });
  }
  next();
}

export function validateCommand(req, res, next) {
  const { error } = commandSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details[0].message
    });
  }
  next();
}

export function validateLogin(req, res, next) {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details[0].message
    });
  }
  next();
}

export function validateRegister(req, res, next) {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details[0].message
    });
  }
  next();
}

export function validateUser(req, res, next) {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details[0].message
    });
  }
  next();
}