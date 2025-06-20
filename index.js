import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router as eventsRouter } from './routes/events.js';
import './jobs/scheduler.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/events', eventsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend Malbouche activo en puerto ${PORT}`);
});
