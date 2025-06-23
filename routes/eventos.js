import express from 'express';
import { 
  getAllEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent 
} from '../controllers/eventsController.js';
import { verifyToken } from '../middleware/auth.js';
import { validateEvento, validateId } from '../middleware/validation.js';

const router = express.Router();

// GET /api/eventos - Obtener todos los eventos
router.get('/', verifyToken, getAllEvents);

// POST /api/eventos - Crear nuevo evento
router.post('/', verifyToken, validateEvento, createEvent);

// PUT /api/eventos/:id - Actualizar evento
router.put('/:id', verifyToken, validateId, validateEvento, updateEvent);

// DELETE /api/eventos/:id - Eliminar evento
router.delete('/:id', verifyToken, validateId, deleteEvent);

export default router;
