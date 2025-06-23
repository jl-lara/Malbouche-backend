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

// GET /api/events - Get all events
router.get('/', verifyToken, getAllEvents);

// POST /api/events - Create new event
router.post('/', verifyToken, validateEvento, createEvent);

// PUT /api/events/:id - Update event
router.put('/:id', verifyToken, validateId, validateEvento, updateEvent);

// DELETE /api/events/:id - Delete event
router.delete('/:id', verifyToken, validateId, deleteEvent);

export default router;
