import express from 'express';
import { 
  getAllMovimientos, 
  createMovimiento, 
  updateMovimiento, 
  deleteMovimiento 
} from '../controllers/movimientosController.js';
import { verifyToken } from '../middlewares/auth.js';
import { validateMovimiento, validateId } from '../middlewares/validation.js';

const router = express.Router();

// GET /api/movimientos - Obtener todos los movimientos
router.get('/', verifyToken, getAllMovimientos);

// POST /api/movimientos - Crear nuevo movimiento
router.post('/', verifyToken, validateMovimiento, createMovimiento);

// PUT /api/movimientos/:id - Actualizar movimiento
router.put('/:id', verifyToken, validateId, validateMovimiento, updateMovimiento);

// DELETE /api/movimientos/:id - Eliminar movimiento
router.delete('/:id', verifyToken, validateId, deleteMovimiento);

export default router;