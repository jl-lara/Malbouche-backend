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

// GET /api/movements - Get all movements
router.get('/', verifyToken, getAllMovements);

// POST /api/movements - Create new movement
router.post('/', verifyToken, validateMovimiento, createMovement);

// PUT /api/movements/:id - Update movement
router.put('/:id', verifyToken, validateId, validateMovimiento, updateMovement);

// DELETE /api/movements/:id - Delete movement
router.delete('/:id', verifyToken, validateId, deleteMovement);

export default router;
