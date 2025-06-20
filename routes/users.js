import express from 'express';
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  getUserDevices,
  getUserEvents
} from '../controllers/usersController.js';
import { validateUser } from '../middleware/validation.js';

const router = express.Router();

// GET /api/users - Get all users
router.get('/', getAllUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', getUserById);

// PUT /api/users/:id - Update user
router.put('/:id', validateUser, updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', deleteUser);

// GET /api/users/:id/devices - Get user's devices
router.get('/:id/devices', getUserDevices);

// GET /api/users/:id/events - Get user's events
router.get('/:id/events', getUserEvents);

export { router };