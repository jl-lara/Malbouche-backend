import express from 'express';
import { getAllEvents, createEvent } from '../controllers/eventsController.js';

const router = express.Router();

router.get('/', getAllEvents);
router.post('/', createEvent);

export { router };