import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import { errorHandler } from './middleware/errorHandler.js';
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
import movimientosRoutes from './routes/movements.js';

app.use('/api/movements', movimientosRoutes);
import eventsRoutes from './routes/events.js';

app.use('/api/events', eventsRoutes);
/*
// app.use('/api/eventos', eventosRoutes);
*/

/*
// Duplicate imports removed
// import movimientosRoutes from './routes/movements.js';
// import eventsRoutes from './routes/events.js';
*/

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
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login'
      },
      'Users': {
        'GET /api/users': 'Get all users',
        'POST /api/users': 'Create new user',
        'GET /api/users/:id': 'Get user by ID',
        'PUT /api/users/:id': 'Update user',
        'DELETE /api/users/:id': 'Delete user'
      },
      'Movements': {
        'GET /api/movements': 'Get all movements',
        'POST /api/movements': 'Create new movement',
        'PUT /api/movements/:id': 'Update movement',
        'DELETE /api/movements/:id': 'Delete movement'
      },
      'Events': {
        'GET /api/events': 'Get all events',
        'POST /api/events': 'Create new event',
        'PUT /api/events/:id': 'Update event',
        'DELETE /api/events/:id': 'Delete event'
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