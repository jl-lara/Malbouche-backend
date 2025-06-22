import express from 'express';
import { 
  getAllUsers, 
  createUser, 
  getUserById, 
  updateUser, 
  deleteUser 
} from '../controllers/usersController.js';
import { verifyToken, checkRole } from '../middlewares/auth.js';
import { validateUser, validateId } from '../middlewares/validation.js';

const router = express.Router();

// GET /api/users - Obtener todos los usuarios (solo admin)
router.get('/', verifyToken, checkRole('admin'), getAllUsers);

// POST /api/users - Crear nuevo usuario (solo admin)
router.post('/', verifyToken, checkRole('admin'), validateUser, createUser);

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', verifyToken, validateId, getUserById);

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', verifyToken, validateId, validateUser, updateUser);

// DELETE /api/users/:id - Eliminar usuario (solo admin)
router.delete('/:id', verifyToken, checkRole('admin'), validateId, deleteUser);

export default router;