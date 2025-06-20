import express from 'express';
import { login, register, refreshToken, logout } from '../controllers/authController.js';
import { validateLogin, validateRegister } from '../middleware/validation.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login - User login
router.post('/login', validateLogin, login);

// POST /api/auth/register - User registration
router.post('/register', validateRegister, register);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', refreshToken);

// POST /api/auth/logout - User logout
router.post('/logout', authMiddleware, logout);

export { router };