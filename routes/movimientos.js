import express from 'express';
import { 
  getAllMovements, 
  createMovement, 
  updateMovement, 
  deleteMovement 
} from '../controllers/movementsController.js';
import { verifyToken } from '../middleware/auth.js';
import { validateMovimiento, validateId } from '../middleware/validation.js';

const router = express.Router();

// GET /api/movimientos - Obtener todos los movimientos
router.get('/', verifyToken, getAllMovements);

// POST /api/movimientos - Crear nuevo movimiento
router.post('/', verifyToken, validateMovimiento, createMovement);

// PUT /api/movimientos/:id - Actualizar movimiento
router.put('/:id', verifyToken, validateId, validateMovimiento, updateMovement);

// DELETE /api/movimientos/:id - Eliminar movimiento
router.delete('/:id', verifyToken, validateId, deleteMovement);

export default router;
