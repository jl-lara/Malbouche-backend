import express from 'express';
import { 
  getAllMovements, 
  getMovementById,
  createMovement, 
  updateMovement, 
  deleteMovement,
  patchMovement
} from '../controllers/movementsController.js';
import { verifyToken } from '../middleware/auth.js';
import { validateMovimiento, validateMovimientoUpdate, validateId } from '../middleware/validation.js';

const router = express.Router();

// GET /api/movements - Get all movements
router.get('/', verifyToken, getAllMovements);

// GET /api/movements/:id - Get movement by ID
router.get('/:id', verifyToken, validateId, getMovementById);

// POST /api/movements - Create new movement
router.post('/', verifyToken, validateMovimiento, createMovement);

// PUT /api/movements/:id - Update movement (full update)
router.put('/:id', verifyToken, validateId, validateMovimientoUpdate, updateMovement);

// PATCH /api/movements/:id - Update movement (partial update)
router.patch('/:id', verifyToken, validateId, validateMovimientoUpdate, patchMovement);

// DELETE /api/movements/:id - Delete movement
router.delete('/:id', verifyToken, validateId, deleteMovement);

export default router;
