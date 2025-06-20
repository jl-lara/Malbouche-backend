import express from 'express';
import { getAllEvents, createEvent, updateEvent, deleteEvent } from '../controllers/eventsController.js';

const router = express.Router();

// GET /events - Obtener todos los eventos
router.get('/', getAllEvents);

// POST /events - Crear un nuevo evento
router.post('/', createEvent);

// PUT /events/:id - Actualizar un evento
router.put('/:id', updateEvent);

// DELETE /events/:id - Eliminar un evento
router.delete('/:id', deleteEvent);

export { router };