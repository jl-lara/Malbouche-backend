/**
 * Routes para controlar el EventScheduler desde la aplicación
 */

import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { logger } from '../services/logger.js';
import eventScheduler from '../services/eventScheduler.js';
import { pingESP32, getESP32Info } from '../services/deviceCommunication.js';
import { db } from '../services/firebase.js';

const router = express.Router();

/**
 * GET /api/scheduler/status
 * Obtiene el estado actual del programador de eventos
 */
router.get('/status', verifyToken, async (req, res) => {
  try {
    const status = eventScheduler.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('❌ Error obteniendo estado del scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estado del scheduler',
      details: error.message
    });
  }
});

/**
 * POST /api/scheduler/start
 * Inicia el programador de eventos
 */
router.post('/start', verifyToken, async (req, res) => {
  try {
    const result = await eventScheduler.start();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          eventsCount: result.eventsCount,
          espIp: result.espIp
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('❌ Error iniciando scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Error iniciando el scheduler',
      details: error.message
    });
  }
});

/**
 * POST /api/scheduler/stop
 * Detiene el programador de eventos
 */
router.post('/stop', verifyToken, async (req, res) => {
  try {
    const result = await eventScheduler.stop();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('❌ Error deteniendo scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Error deteniendo el scheduler',
      details: error.message
    });
  }
});

/**
 * POST /api/scheduler/reload
 * Recarga eventos desde Firestore
 */
router.post('/reload', verifyToken, async (req, res) => {
  try {
    const result = await eventScheduler.reloadEvents();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          eventsCount: result.eventsCount
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('❌ Error recargando eventos:', error);
    res.status(500).json({
      success: false,
      error: 'Error recargando eventos',
      details: error.message
    });
  }
});

/**
 * GET /api/scheduler/ping-esp32
 * Hace ping al ESP32 para verificar conectividad
 */
router.get('/ping-esp32', verifyToken, async (req, res) => {
  try {
    const status = eventScheduler.getStatus();
    const espIp = status.espConfig?.ip;
    
    if (!espIp) {
      return res.status(400).json({
        success: false,
        error: 'No hay IP del ESP32 configurada'
      });
    }
    
    logger.info(`🏓 Haciendo ping a ESP32: ${espIp}`);
    
    const pingResult = await pingESP32(espIp);
    const infoResult = await getESP32Info(espIp);
    
    res.json({
      success: true,
      data: {
        espIp,
        ping: pingResult,
        info: infoResult,
        lastTest: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('❌ Error haciendo ping a ESP32:', error);
    res.status(500).json({
      success: false,
      error: 'Error haciendo ping a ESP32',
      details: error.message
    });
  }
});

/**
 * POST /api/scheduler/test-movement
 * Envía un movimiento de prueba al ESP32
 */
router.post('/test-movement', verifyToken, async (req, res) => {
  try {
    const { movementName = 'left' } = req.body;
    const status = eventScheduler.getStatus();
    const espConfig = status.espConfig;
    
    if (!espConfig?.ip) {
      return res.status(400).json({
        success: false,
        error: 'No hay IP del ESP32 configurada'
      });
    }
    
    // Crear movimiento de prueba
    const testMovement = {
      nombre: movementName,
      descripcion: 'Movimiento de prueba'
    };
    
    logger.info(`🧪 Enviando movimiento de prueba "${movementName}" a ESP32 ${espConfig.ip}`);
    
    // Importar deviceCommunication dinámicamente
    const { sendCommandToESP32 } = await import('../services/deviceCommunication.js');
    const result = await sendCommandToESP32(espConfig, testMovement);
    
    res.json({
      success: result.success,
      message: result.success ? 'Movimiento enviado exitosamente' : result.message,
      data: {
        movement: testMovement,
        espConfig,
        result
      }
    });
    
  } catch (error) {
    logger.error('❌ Error enviando movimiento de prueba:', error);
    res.status(500).json({
      success: false,
      error: 'Error enviando movimiento de prueba',
      details: error.message
    });
  }
});

/**
 * POST /api/scheduler/test-event
 * Crea un evento de prueba que se ejecuta en 2 minutos
 */
router.post('/test-event', verifyToken, async (req, res) => {
  try {
    // Crear evento que se ejecute en 2 minutos
    const now = new Date();
    const executeTime = new Date(now.getTime() + 2 * 60 * 1000); // +2 minutos
    const hours = executeTime.getHours();
    const minutes = executeTime.getMinutes();
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    // Obtener día actual en formato abreviado inglés
    const dayNames = ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
    const currentDay = dayNames[executeTime.getDay()];
    
    logger.info(`🧪 Creando evento de prueba para ejecutarse a las ${timeString} (${currentDay})`);
    
    const testEventData = {
      nombreEvento: `Test Event ${Date.now()}`,
      horaInicio: timeString,
      horaFin: timeString,
      diasSemana: [currentDay],
      movementId: 'test-movement-id', // Necesitarás un movimiento válido
      fechaCreacion: new Date().toISOString(),
      creadoPor: req.user?.uid || 'test-user',
      activo: true
    };
    
    // Primero obtener un movimiento real de la base de datos
    const movementsSnapshot = await db.collection('movimientos').limit(1).get();
    if (movementsSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'No hay movimientos disponibles para el test'
      });
    }
    
    const firstMovement = movementsSnapshot.docs[0];
    testEventData.movementId = firstMovement.id;
    
    // Crear el evento en Firestore
    const eventoRef = await db.collection('eventos').add(testEventData);
    
    // Recargar eventos en el scheduler
    await eventScheduler.reloadEvents();
    
    res.json({
      success: true,
      message: `Evento de prueba creado - se ejecutará a las ${timeString}`,
      data: {
        eventId: eventoRef.id,
        executeTime: timeString,
        movementId: firstMovement.id,
        movementName: firstMovement.data().nombre
      }
    });
    
  } catch (error) {
    logger.error('❌ Error creando evento de prueba:', error);
    res.status(500).json({
      success: false,
      error: 'Error creando evento de prueba',
      details: error.message
    });
  }
});

/**
 * GET /api/scheduler/debug/jobs
 * Lista todos los jobs activos para debug
 */
router.get('/debug/jobs', verifyToken, async (req, res) => {
  try {
    // Llamar al método de debug
    eventScheduler.listActiveJobs();
    
    const status = eventScheduler.getStatus();
    
    res.json({
      success: true,
      message: 'Debug info logged to console',
      data: {
        totalJobs: status.activeJobs?.length || 0,
        isRunning: status.isRunning,
        scheduledEvents: status.scheduledEvents,
        activeJobs: status.activeJobs
      }
    });
  } catch (error) {
    logger.error('❌ Error en debug de jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Error en debug de jobs',
      details: error.message
    });
  }
});

/**
 * POST /api/scheduler/execute/:eventId
 * Ejecuta un evento específico inmediatamente (para testing)
 */
router.post('/execute/:eventId', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await eventScheduler.executeEventNow(eventId);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('❌ Error ejecutando evento inmediatamente:', error);
    res.status(500).json({
      success: false,
      error: 'Error ejecutando evento',
      details: error.message
    });
  }
});

/**
 * GET /api/scheduler/logs
 * Obtiene logs de ejecución recientes
 */
router.get('/logs', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const result = await eventScheduler.getExecutionLogs(limit);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        count: result.data.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('❌ Error obteniendo logs:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo logs de ejecución',
      details: error.message
    });
  }
});

/**
 * POST /api/scheduler/esp32/configure
 * Configura la IP y tipo del ESP32
 */
router.post('/esp32/configure', verifyToken, async (req, res) => {
  try {
    const { ip, type = 'standard' } = req.body;
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        error: 'IP del ESP32 es requerida'
      });
    }

    // Validar formato de IP básico
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de IP inválido'
      });
    }

    const result = await eventScheduler.updateESPConfig({ ip, type });
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: { ip, type }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('❌ Error configurando ESP32:', error);
    res.status(500).json({
      success: false,
      error: 'Error configurando ESP32',
      details: error.message
    });
  }
});

/**
 * GET /api/scheduler/esp32/ping
 * Verifica conectividad con el ESP32
 */
router.get('/esp32/ping', verifyToken, async (req, res) => {
  try {
    const { ip } = req.query;
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        error: 'IP del ESP32 es requerida como query parameter'
      });
    }

    const result = await pingESP32(ip);
    
    res.json({
      success: result.success,
      message: result.message,
      data: result.data || null
    });
  } catch (error) {
    logger.error('❌ Error haciendo ping al ESP32:', error);
    res.status(500).json({
      success: false,
      error: 'Error verificando conectividad con ESP32',
      details: error.message
    });
  }
});

/**
 * GET /api/scheduler/esp32/info
 * Obtiene información del ESP32
 */
router.get('/esp32/info', verifyToken, async (req, res) => {
  try {
    const { ip } = req.query;
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        error: 'IP del ESP32 es requerida como query parameter'
      });
    }

    const result = await getESP32Info(ip);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('❌ Error obteniendo info del ESP32:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo información del ESP32',
      details: error.message
    });
  }
});

/**
 * GET /api/scheduler/health
 * Health check completo del sistema EventScheduler
 */
router.get('/health', verifyToken, async (req, res) => {
  try {
    // Import health checker
    const { SystemHealthChecker } = await import('../utils/systemHealthChecker.js');
    
    // Run all health checks
    const dependencyChecks = await SystemHealthChecker.checkDependencies();
    const firestoreChecks = await SystemHealthChecker.checkFirestoreCollections();
    
    // Get scheduler status
    const schedulerStatus = eventScheduler.getStatus();
    
    // Check ESP32 if configured
    let esp32Check = null;
    if (schedulerStatus.espConfig?.ip) {
      esp32Check = await SystemHealthChecker.checkESP32Connectivity(schedulerStatus.espConfig.ip);
    }

    const healthData = {
      scheduler: {
        isRunning: schedulerStatus.isRunning,
        eventsCount: schedulerStatus.eventsCount,
        statistics: schedulerStatus.statistics
      },
      dependencies: dependencyChecks,
      firestore: firestoreChecks,
      esp32: esp32Check,
      timestamp: new Date().toISOString()
    };

    // Determine overall health
    const hasErrors = dependencyChecks.some(c => c.status === 'ERROR') || 
                     firestoreChecks.some(c => c.status === 'ERROR') ||
                     (esp32Check && esp32Check.status === 'ERROR');

    res.json({
      success: true,
      health: hasErrors ? 'UNHEALTHY' : 'HEALTHY',
      data: healthData
    });

  } catch (error) {
    logger.error('❌ Error en health check:', error);
    res.status(500).json({
      success: false,
      health: 'UNHEALTHY',
      error: 'Health check failed',
      details: error.message
    });
  }
});

/**
 * GET /api/scheduler/diagnostics
 * Diagnóstico completo del sistema para debugging
 */
router.get('/diagnostics', verifyToken, async (req, res) => {
  try {
    const status = eventScheduler.getStatus();
    
    // Obtener muestra de eventos para verificar estructura
    const eventsSnapshot = await eventScheduler.getAllEvents();
    
    // Verificar conexión a Firestore
    const { db } = await import('../services/firebase.js');
    const testQuery = await db.collection('eventos').limit(1).get();
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      scheduler: {
        isRunning: status.isRunning,
        eventsCount: status.eventsCount,
        activeJobs: status.scheduledEvents?.length || 0,
        statistics: status.statistics
      },
      firestore: {
        connected: true,
        eventsCollection: testQuery.size >= 0,
        sampleEventIds: eventsSnapshot.slice(0, 3).map(e => e.id)
      },
      esp32: {
        configured: !!status.espConfig?.ip,
        ip: status.espConfig?.ip,
        type: status.espConfig?.type
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    };

    // Verificar estructura de un evento de muestra
    if (eventsSnapshot.length > 0) {
      const sampleEvent = eventsSnapshot[0];
      diagnostics.sampleEvent = {
        id: sampleEvent.id,
        hasName: !!sampleEvent.nombreEvento,
        hasStartTime: !!sampleEvent.horaInicio,
        hasDays: Array.isArray(sampleEvent.diasSemana),
        daysFormat: sampleEvent.diasSemana,
        hasMovementId: !!sampleEvent.movementId,
        isActive: sampleEvent.activo
      };
    }

    res.json({
      success: true,
      diagnostics
    });

  } catch (error) {
    logger.error('❌ Error en diagnósticos:', error);
    res.status(500).json({
      success: false,
      error: 'Error ejecutando diagnósticos',
      details: error.message
    });
  }
});

/**
 * POST /api/scheduler/toggle
 * Alterna el estado del programador (start/stop)
 */
router.post('/toggle', verifyToken, async (req, res) => {
  try {
    const status = eventScheduler.getStatus();
    
    let result;
    if (status.isRunning) {
      result = await eventScheduler.stop();
    } else {
      result = await eventScheduler.start();
    }
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          isRunning: !status.isRunning,
          eventsCount: result.eventsCount || status.eventsCount
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('❌ Error alternando scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Error alternando el scheduler',
      details: error.message
    });
  }
});

// --- Rutas para ESP32 Polling System ---

// Variable global para almacenar comandos pendientes
let pendingCommand = null;

/**
 * GET /api/esp32/commands
 * ESP32 consulta si hay comandos pendientes (sin autenticación)
 */
router.get('/esp32/commands', async (req, res) => {
  try {
    if (pendingCommand) {
      logger.info(`📡 Enviando comando pendiente a ESP32: ${pendingCommand}`);
      const command = pendingCommand;
      pendingCommand = null; // Limpiar comando después de enviarlo
      
      res.json({
        success: true,
        command: command,
        timestamp: new Date().toISOString()
      });
    } else {
      // No hay comandos pendientes
      res.status(204).send(); // No Content
    }
  } catch (error) {
    logger.error('❌ Error obteniendo comandos para ESP32:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo comandos',
      details: error.message
    });
  }
});

/**
 * POST /api/esp32/queue-command
 * Encola un comando para que el ESP32 lo recoja (para uso interno del EventScheduler)
 */
router.post('/esp32/queue-command', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({
        success: false,
        error: 'Comando es requerido'
      });
    }
    
    pendingCommand = command;
    logger.info(`📋 Comando encolado para ESP32: ${command}`);
    
    res.json({
      success: true,
      message: 'Comando encolado exitosamente',
      command: command
    });
    
  } catch (error) {
    logger.error('❌ Error encolando comando:', error);
    res.status(500).json({
      success: false,
      error: 'Error encolando comando',
      details: error.message
    });
  }
});

/**
 * GET /api/esp32/status
 * Estado del sistema de polling (para diagnóstico)
 */
router.get('/esp32/status', verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        pendingCommand: pendingCommand,
        pollingEnabled: true,
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('❌ Error obteniendo estado ESP32 polling:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estado',
      details: error.message
    });
  }
});

export default router;
