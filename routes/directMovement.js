/**
 * Routes para ejecutar movimientos directos desde la app móvil
 * Reutiliza la infraestructura existente de comunicación con ESP32
 */

import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { logger } from '../services/logger.js';
import eventScheduler from '../services/eventScheduler.js';
import { sendCommandToESP32 } from '../services/deviceCommunication.js';

const router = express.Router();

/**
 * POST /api/direct-movement/execute
 * Ejecuta un movimiento directamente en el ESP32 desde la app móvil
 * 
 * Body examples:
 * - Preset: { "movement": "left", "speed": 50 }
 * - Preset: { "movement": "right", "speed": 75 }
 * - Preset: { "movement": "crazy", "speed": 100 }
 * - Custom: { 
 *     "movement": "custom", 
 *     "customMovement": {
 *       "nombre": "Mi movimiento",
 *       "movimiento": {
 *         "horas": { "direccion": "horario", "velocidad": 60 },
 *         "minutos": { "direccion": "antihorario", "velocidad": 40 }
 *       }
 *     }
 *   }
 */
router.post('/execute', verifyToken, async (req, res) => {
  try {
    const { movement, speed, customMovement } = req.body;
    const userId = req.user?.uid || 'app-user';

    // Validar que se proporcione al menos el movimiento
    if (!movement) {
      return res.status(400).json({
        success: false,
        error: 'El campo "movement" es requerido'
      });
    }

    // Obtener configuración del ESP32 del scheduler
    const status = eventScheduler.getStatus();
    const espConfig = status.espConfig;
    
    if (!espConfig?.ip) {
      return res.status(400).json({
        success: false,
        error: 'No hay IP del ESP32 configurada. Configure la IP desde la configuración del scheduler.'
      });
    }

    let movementData;

    // Determinar el tipo de movimiento
    if (movement === 'custom' && customMovement) {
      // Movimiento personalizado
      movementData = {
        ...customMovement,
        // Asegurar que tenga velocidad si se proporciona speed
        movimiento: {
          ...customMovement.movimiento,
          horas: {
            ...customMovement.movimiento?.horas,
            velocidad: speed || customMovement.movimiento?.horas?.velocidad || 50
          },
          minutos: {
            ...customMovement.movimiento?.minutos,
            velocidad: speed || customMovement.movimiento?.minutos?.velocidad || 50
          }
        }
      };
    } else {
      // Preset (left, right, crazy, swing, normal, stop)
      const validPresets = ['left', 'right', 'crazy', 'swing', 'normal', 'stop'];
      
      if (!validPresets.includes(movement.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: `Movimiento "${movement}" no válido. Movimientos válidos: ${validPresets.join(', ')}`
        });
      }

      movementData = {
        nombre: movement.toLowerCase(),
        descripcion: `Movimiento directo desde app: ${movement}`,
        movimiento: {
          horas: { velocidad: speed || 50 },
          minutos: { velocidad: speed || 50 }
        }
      };
    }

    logger.info(`📱 Ejecutando movimiento directo desde app:`, {
      userId,
      movement: movementData.nombre,
      espIp: espConfig.ip,
      speed: speed || 'default'
    });

    // Enviar comando al ESP32 usando la infraestructura existente
    const result = await sendCommandToESP32(espConfig, movementData);

    // Log del resultado
    if (result.success) {
      logger.info(`✅ Movimiento directo ejecutado exitosamente: ${movementData.nombre}`);
    } else {
      logger.error(`❌ Error ejecutando movimiento directo: ${result.message}`);
    }

    res.json({
      success: result.success,
      message: result.success 
        ? `Movimiento "${movementData.nombre}" ejecutado exitosamente`
        : result.message,
      data: {
        movement: movementData.nombre,
        speed: speed || 'default',
        espConfig: {
          ip: espConfig.ip,
          type: espConfig.type
        },
        executedAt: new Date().toISOString(),
        executedBy: userId,
        result: result.success ? result.data : null
      }
    });

  } catch (error) {
    logger.error('❌ Error ejecutando movimiento directo:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno ejecutando movimiento',
      details: error.message
    });
  }
});

/**
 * POST /api/direct-movement/stop
 * Detiene cualquier movimiento en curso en el ESP32
 */
router.post('/stop', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.uid || 'app-user';

    // Obtener configuración del ESP32
    const status = eventScheduler.getStatus();
    const espConfig = status.espConfig;
    
    if (!espConfig?.ip) {
      return res.status(400).json({
        success: false,
        error: 'No hay IP del ESP32 configurada'
      });
    }

    // Crear comando de stop
    const stopMovement = {
      nombre: 'stop',
      descripcion: 'Detener movimiento desde app'
    };

    logger.info(`🛑 Deteniendo movimiento desde app - Usuario: ${userId}, ESP32: ${espConfig.ip}`);

    // Enviar comando de stop
    const result = await sendCommandToESP32(espConfig, stopMovement);

    res.json({
      success: result.success,
      message: result.success 
        ? 'Movimiento detenido exitosamente'
        : result.message,
      data: {
        command: 'stop',
        espConfig: {
          ip: espConfig.ip,
          type: espConfig.type
        },
        executedAt: new Date().toISOString(),
        executedBy: userId
      }
    });

  } catch (error) {
    logger.error('❌ Error deteniendo movimiento:', error);
    res.status(500).json({
      success: false,
      error: 'Error deteniendo movimiento',
      details: error.message
    });
  }
});

/**
 * GET /api/direct-movement/status
 * Obtiene el estado actual de la conexión con el ESP32
 */
router.get('/status', verifyToken, async (req, res) => {
  try {
    const status = eventScheduler.getStatus();
    const espConfig = status.espConfig;

    res.json({
      success: true,
      data: {
        espConfigured: !!espConfig?.ip,
        espConfig: espConfig || null,
        schedulerRunning: status.isRunning,
        lastExecution: status.statistics?.lastExecution || null
      }
    });

  } catch (error) {
    logger.error('❌ Error obteniendo estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estado',
      details: error.message
    });
  }
});

export default router;
