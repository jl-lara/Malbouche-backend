import express from 'express';
import { register, login } from '../controllers/authController.js';
import { validateLogin, validateRegister } from '../middleware/validation.js';

const router = express.Router();

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', validateRegister, register);

// POST /api/auth/login - Iniciar sesión
router.post('/login', validateLogin, login);

export default router;
