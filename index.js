import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import movimientosRoutes from './routes/movimientos.js';
import eventosRoutes from './routes/eventos.js';

// Import middleware
import { errorHandler } from './middlewares/errorHandler.js';
import { logger } from './services/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Malbouche Backend API',
    version: '1.0.0',
    description: 'Backend API para control de reloj analógico ESP32 con Firestore',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      movimientos: '/api/movimientos',
      eventos: '/api/eventos',
      health: '/health',
      docs: '/docs'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/eventos', eventosRoutes);

// API documentation
app.get('/docs', (req, res) => {
  res.json({
    title: 'Malbouche API Documentation',
    version: '1.0.0',
    baseUrl: `http://localhost:${PORT}`,
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>',
      login: 'POST /api/auth/login'
    },
    endpoints: {
      'Authentication': {
        'POST /api/auth/register': 'Registrar nuevo usuario',
        'POST /api/auth/login': 'Iniciar sesión'
      },
      'Users': {
        'GET /api/users': 'Obtener todos los usuarios',
        'POST /api/users': 'Crear nuevo usuario',
        'GET /api/users/:id': 'Obtener usuario por ID',
        'PUT /api/users/:id': 'Actualizar usuario',
        'DELETE /api/users/:id': 'Eliminar usuario'
      },
      'Movimientos': {
        'GET /api/movimientos': 'Obtener todos los movimientos',
        'POST /api/movimientos': 'Crear nuevo movimiento',
        'PUT /api/movimientos/:id': 'Actualizar movimiento',
        'DELETE /api/movimientos/:id': 'Eliminar movimiento'
      },
      'Eventos': {
        'GET /api/eventos': 'Obtener todos los eventos',
        'POST /api/eventos': 'Crear nuevo evento',
        'PUT /api/eventos/:id': 'Actualizar evento',
        'DELETE /api/eventos/:id': 'Eliminar evento'
      }
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  logger.info('🚀 ================================');
  logger.info(`🚀 Malbouche Backend Server`);
  logger.info(`🚀 Puerto: ${PORT}`);
  logger.info(`🚀 Entorno: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🚀 API URL: http://localhost:${PORT}`);
  logger.info(`🚀 Health Check: http://localhost:${PORT}/health`);
  logger.info(`🚀 Documentación: http://localhost:${PORT}/docs`);
  logger.info('🚀 ================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

export default app;