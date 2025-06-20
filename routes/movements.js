import express from 'express';
import { 
  getAllMovements, 
  createMovement, 
  updateMovement, 
  deleteMovement,
  executeMovement
} from '../controllers/movementsController.js';
import { validateMovement } from '../middleware/validation.js';

const router = express.Router();

// GET /api/movements - Get all movements
router.get('/', getAllMovements);

// POST /api/movements - Create new movement
router.post('/', validateMovement, createMovement);

// PUT /api/movements/:id - Update movement
router.put('/:id', validateMovement, updateMovement);

// DELETE /api/movements/:id - Delete movement
router.delete('/:id', deleteMovement);

// POST /api/movements/:id/execute - Execute movement immediately
router.post('/:id/execute', executeMovement);

export { router };