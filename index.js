import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router as eventsRouter } from './routes/events.js';

// Cargar variables de entorno
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas
app.get('/', (req, res) => {
  res.json({
    message: 'Backend Malbouche API',
    version: '1.0.0',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/events', eventsRouter);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('🚀 ================================');
  console.log(`🚀 Servidor Malbouche Backend`);
  console.log(`🚀 Puerto: ${PORT}`);
  console.log(`🚀 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 URL: http://localhost:${PORT}`);
  console.log('🚀 ================================');
});

// Importar scheduler después de que el servidor esté configurado
import('./jobs/scheduler.js').catch(err => {
  console.error('❌ Error al cargar scheduler:', err.message);
});