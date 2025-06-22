import express from 'express';
import { 
  getAllEventos, 
  createEvento, 
  updateEvento, 
  deleteEvento 
} from '../controllers/eventosController.js';
import { verifyToken } from '../middlewares/auth.js';
import { validateEvento, validateId } from '../middlewares/validation.js';

const router = express.Router();

// GET /api/eventos - Obtener todos los eventos
router.get('/', verifyToken, getAllEventos);

// POST /api/eventos - Crear nuevo evento
router.post('/', verifyToken, validateEvento, createEvento);

// PUT /api/eventos/:id - Actualizar evento
router.put('/:id', verifyToken, validateId, validateEvento, updateEvento);

// DELETE /api/eventos/:id - Eliminar evento
router.delete('/:id', verifyToken, validateId, deleteEvento);

export default router;