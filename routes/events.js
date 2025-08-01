import express from 'express';
import { 
  getAllEvents, 
  getEventById,
  createEvent, 
  updateEvent, 
  deleteEvent 
} from '../controllers/eventsController.js';
import { verifyToken } from '../middleware/auth.js';
import { validateEventoWithConflicts, validateEventoUpdateWithConflicts } from '../middleware/validation.js';
import { validateId } from '../middleware/validation.js';

const router = express.Router();

// GET /api/events - Get all events
router.get('/', verifyToken, getAllEvents);

// GET /api/events/:id - Get event by ID
router.get('/:id', verifyToken, validateId, getEventById);

// POST /api/events - Create new event
router.post('/', verifyToken, validateEventoWithConflicts, createEvent);

// PUT /api/events/:id - Update event
router.put('/:id', verifyToken, validateId, validateEventoUpdateWithConflicts, updateEvent);

// DELETE /api/events/:id - Delete event
router.delete('/:id', verifyToken, validateId, deleteEvent);

export default router;
