import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Import routes
import { router as eventsRouter } from './routes/events.js';
import { router as devicesRouter } from './routes/devices.js';
import { router as usersRouter } from './routes/users.js';
import { router as movementsRouter } from './routes/movements.js';
import { router as authRouter } from './routes/auth.js';

// Import middleware
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

// Import services
import { initializeWebSocket } from './services/websocket.js';
import { initializeMQTT } from './services/mqtt.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
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
    description: 'Backend API para control de reloj analógico ESP32',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      events: '/api/events',
      devices: '/api/devices',
      users: '/api/users',
      movements: '/api/movements',
      health: '/health',
      docs: '/docs'
    },
    websocket: {
      url: `ws://localhost:${process.env.ESP32_WEBSOCKET_PORT || 8080}`,
      description: 'Real-time communication with ESP32 devices'
    }
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/events', authMiddleware, eventsRouter);
app.use('/api/devices', authMiddleware, devicesRouter);
app.use('/api/users', authMiddleware, usersRouter);
app.use('/api/movements', authMiddleware, movementsRouter);

// API documentation
app.get('/docs', (req, res) => {
  res.json({
    title: 'Malbouche API Documentation',
    version: '1.0.0',
    baseUrl: `http://localhost:${process.env.PORT || 3000}`,
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>',
      login: 'POST /api/auth/login'
    },
    endpoints: {
      'Authentication': {
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/refresh': 'Refresh access token'
      },
      'Events': {
        'GET /api/events': 'Get all events',
        'POST /api/events': 'Create new event',
        'PUT /api/events/:id': 'Update event',
        'DELETE /api/events/:id': 'Delete event',
        'POST /api/events/:id/execute': 'Execute event immediately'
      },
      'Devices': {
        'GET /api/devices': 'Get all devices',
        'POST /api/devices': 'Register new device',
        'PUT /api/devices/:id': 'Update device',
        'DELETE /api/devices/:id': 'Remove device',
        'POST /api/devices/:id/command': 'Send command to device',
        'GET /api/devices/:id/status': 'Get device status'
      },
      'Movements': {
        'GET /api/movements': 'Get all movements',
        'POST /api/movements': 'Create movement',
        'PUT /api/movements/:id': 'Update movement',
        'DELETE /api/movements/:id': 'Delete movement'
      },
      'Users': {
        'GET /api/users': 'Get all users',
        'GET /api/users/:id': 'Get user by ID',
        'PUT /api/users/:id': 'Update user',
        'DELETE /api/users/:id': 'Delete user'
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
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.ESP32_WEBSOCKET_PORT || 8080;

// Start server
server.listen(PORT, () => {
  logger.info('🚀 ================================');
  logger.info(`🚀 Malbouche Backend Server`);
  logger.info(`🚀 Port: ${PORT}`);
  logger.info(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🚀 API URL: http://localhost:${PORT}`);
  logger.info(`🚀 Health Check: http://localhost:${PORT}/health`);
  logger.info(`🚀 Documentation: http://localhost:${PORT}/docs`);
  logger.info('🚀 ================================');
});

// Initialize WebSocket server for ESP32 communication
const wss = new WebSocketServer({ port: WS_PORT });
initializeWebSocket(wss);

// Initialize MQTT client for ESP32 communication
initializeMQTT();

// Import and start scheduler
import('./jobs/scheduler.js').catch(err => {
  logger.error('❌ Error loading scheduler:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;