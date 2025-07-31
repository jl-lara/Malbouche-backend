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
  max: 1000, // limit each IP to 100 requests per windowMs
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
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Minimal request logging middleware - only log errors
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    // Only log if there's an error (status >= 400)
    if (res.statusCode >= 400) {
      const duration = Date.now() - start;
      logger.error(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`, {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
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
    description: 'Backend API for ESP32 analog clock control with Firestore',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      movements: '/api/movements',
      events: '/api/events',
      health: '/health',
      docs: '/docs'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
import movimientosRoutes from './routes/movements.js';
import movimientoActualRoutes from './routes/movimientoActual.js';
import schedulerRoutes from './routes/scheduler.js';

app.use('/api/movements', movimientosRoutes);
app.use('/api/movimiento-actual', movimientoActualRoutes);
app.use('/api/scheduler', schedulerRoutes);
import eventsRoutes from './routes/events.js';

app.use('/api/events', eventsRoutes);

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
      },
      'Scheduler': {
        'GET /api/scheduler/status': 'Get scheduler status',
        'GET /api/scheduler/health': 'Complete health check',
        'GET /api/scheduler/diagnostics': 'System diagnostics for debugging',
        'POST /api/scheduler/start': 'Start event scheduler',
        'POST /api/scheduler/stop': 'Stop event scheduler',
        'POST /api/scheduler/reload': 'Reload events from database',
        'POST /api/scheduler/toggle': 'Toggle scheduler on/off',
        'POST /api/scheduler/esp32/configure': 'Configure ESP32 settings',
        'GET /api/scheduler/esp32/ping': 'Ping ESP32 device',
        'GET /api/scheduler/esp32/info': 'Get ESP32 device info',
        'GET /api/scheduler/logs': 'Get execution logs',
        'POST /api/scheduler/execute/:id': 'Execute event immediately'
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

// Start server
app.listen(PORT, async () => {
  // Only log critical startup information
  console.log(`🚀 Malbouche Backend Server running on port ${PORT}`);
  
  // Auto-start EventScheduler with health checks
  try {
    console.log('🔍 Running system health checks...');
    
    // Import health checker
    const { SystemHealthChecker } = await import('./utils/systemHealthChecker.js');
    
    // Run dependency checks
    const checks = await SystemHealthChecker.checkDependencies();
    const healthStatus = SystemHealthChecker.logSystemStatus(checks);
    
    if (healthStatus === 'ERROR') {
      console.error('❌ Critical system errors detected - EventScheduler startup aborted');
      return;
    }
    
    // Wait a bit for Firebase to be ready
    setTimeout(async () => {
      console.log('🕒 Auto-starting EventScheduler...');
      
      const { default: eventScheduler } = await import('./services/eventScheduler.js');
      const result = await eventScheduler.start();
      
      if (result.success) {
        console.log(`✅ EventScheduler started: ${result.eventsCount} events scheduled`);
        
        // Log ESP32 configuration if available
        if (result.espIp) {
          console.log(`📡 ESP32 configured at: ${result.espIp}`);
        } else {
          console.log('⚠️ ESP32 not configured - events will not execute until IP is set');
        }
      } else {
        console.log(`⚠️ EventScheduler start failed: ${result.message}`);
      }
    }, 3000); // Increased wait time
    
  } catch (error) {
    console.error('❌ Error auto-starting EventScheduler:', error.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down server...');
  process.exit(0);
});

export default app;
