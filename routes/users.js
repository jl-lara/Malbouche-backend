import express from 'express';
import { 
  getAllUsers, 
  createUser, 
  getUserById, 
  updateUser, 
  deleteUser 
} from '../controllers/usersController.js';
import { verifyToken, checkRole } from '../middleware/auth.js';
import { validateUser, validateId } from '../middleware/validation.js';

const router = express.Router();

// GET /api/users - Get all users (admin only)
router.get('/', verifyToken, checkRole('admin'), getAllUsers);

// POST /api/users - Create new user (admin only)
router.post('/', verifyToken, checkRole('admin'), validateUser, createUser);

// GET /api/users/:id - Get user by ID
router.get('/:id', verifyToken, validateId, getUserById);

// PUT /api/users/:id - Update user
router.put('/:id', verifyToken, validateId, validateUser, updateUser);

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', verifyToken, checkRole('admin'), validateId, deleteUser);

export default router;
