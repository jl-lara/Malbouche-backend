import axios from 'axios';
import { logger } from './logger.js';

/**
 * Envía comando al ESP32 usando HTTP directo
 * @param {Object} espConfig - Configuración del ESP32 {ip, type}
 * @param {Object} movement - Datos del movimiento a ejecutar
 * @returns {Object} Resultado de la operación
 */
export async function sendCommandToESP32(espConfig, movement) {
  try {
    const { ip, type = 'standard' } = espConfig;
    
    if (!ip) {
      throw new Error('IP del ESP32 no configurada');
    }

    logger.info(`📡 Enviando comando a ESP32 ${ip} (${type}): "${movement.nombre}"`);
    logger.info(`🔧 DEBUG - Movimiento completo:`, JSON.stringify(movement, null, 2));
    logger.info(`🔧 DEBUG - ESP Config:`, JSON.stringify(espConfig, null, 2));

    // Detectar si es un preset o movimiento personalizado
    const presets = ['left', 'right', 'crazy', 'normal', 'stop', 'swing'];
    const isPreset = presets.includes(movement.nombre?.toLowerCase());

    logger.info(`🔧 DEBUG - Es preset: ${isPreset}, presets disponibles:`, presets);

    let result;
    
    if (isPreset) {
      logger.info(`🔧 DEBUG - Usando sistema de polling para preset...`);
      result = await sendPresetViaPolling(movement.nombre.toLowerCase());
    } else {
      logger.info(`🔧 DEBUG - Llamando sendCustomMovementToESP32...`);
      result = await sendCustomMovementToESP32(ip, movement, type);
    }

    if (result.success) {
      logger.info(`✅ Comando enviado exitosamente a ESP32 ${ip}`);
    } else {
      logger.error(`❌ Error enviando comando a ESP32 ${ip}: ${result.message}`);
    }

    logger.info(`🔧 DEBUG - Resultado final:`, JSON.stringify(result, null, 2));

    return result;
    
  } catch (error) {
    logger.error('❌ Error en comunicación con ESP32:', error.message);
    logger.error('🔧 DEBUG - Error stack:', error.stack);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Envía un preset al ESP32
 */
async function sendPresetToESP32(ip, movement, deviceType) {
  try {
    // Test de conectividad previo
    logger.info(`🔍 Verificando conectividad con ESP32 ${ip}...`);
    logger.info(`🔧 DEBUG sendPresetToESP32 - Parámetros:`, {
      ip, 
      movement: JSON.stringify(movement), 
      deviceType
    });
    
    const speed = movement.movimiento?.horas?.velocidad || movement.velocidad || 50;
    const presetName = movement.nombre.toLowerCase();
    
    logger.info(`🔧 DEBUG - Speed: ${speed}, PresetName: ${presetName}`);
    
    let endpoint;
    let payload;

    if (deviceType === 'prototype') {
      // ESP32 Prototipo con 28BYJ-48
      endpoint = `http://${ip}/move`;
      
      const directionMap = {
        'left': 'CCW',
        'right': 'CW', 
        'stop': 'STOP',
        'normal': 'CW',
        'crazy': 'CCW'
      };
      
      payload = {
        direction: directionMap[presetName] || 'CW',
        speed: Math.max(1, Math.min(100, speed)),
        steps: presetName === 'stop' ? 0 : 2048 // Pasos completos para 28BYJ-48
      };
    } else {
      // ESP32 Estándar - usar GET request simple como espera el Arduino
      endpoint = `http://${ip}/${presetName}`;
      // No enviamos payload - Arduino espera GET sin datos
    }

    logger.info(`📡 Enviando preset "${presetName}" a ${endpoint}`);
    logger.info(`🔧 Configuración: deviceType=${deviceType}, speed=${speed}`);

    let response;
    
    if (deviceType === 'prototype') {
      // Prototipo usa POST con payload
      logger.info(`📤 POST request con payload:`, payload);
      response = await axios.post(endpoint, payload, {
        timeout: 15000, // Aumentamos timeout a 15 segundos
        headers: { 'Content-Type': 'application/json' },
        validateStatus: function (status) {
          return status < 500;
        }
      });
    } else {
      // ESP32 Estándar usa GET simple (como espera el Arduino)
      logger.info(`📤 GET request simple a ${endpoint}`);
      response = await axios.get(endpoint, {
        timeout: 15000, // Aumentamos timeout a 15 segundos
        validateStatus: function (status) {
          return status < 500;
        }
      });
    }

    // Verificar si el ESP32 respondió con error
    if (response.status >= 400) {
      throw new Error(`ESP32 respondió con error ${response.status}: ${response.data?.error || 'Error desconocido'}`);
    }

    return {
      success: true,
      message: `Preset "${presetName}" ejecutado exitosamente`,
      data: response.data
    };
    
  } catch (error) {
    // Log detallado del error para diagnóstico
    logger.error(`❌ Error comunicándose con ESP32 ${ip}:`, {
      code: error.code,
      message: error.message,
      response: error.response?.status,
      timeout: error.timeout,
      isAxiosError: error.isAxiosError
    });

    // Manejo específico de tipos de error
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        message: `ESP32 no accesible en ${ip}. Verificar conexión de red.`
      };
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      return {
        success: false,
        message: `Timeout conectando a ESP32 en ${ip}. Dispositivo puede estar ocupado.`
      };
    } else if (error.response) {
      return {
        success: false,
        message: `ESP32 respondió con error: ${error.response.status} - ${error.response.data?.error || error.message}`
      };
    } else if (error.code === 'ENOTFOUND') {
      return {
        success: false,
        message: `ESP32 ${ip} no encontrado - ¿IP correcta?`
      };
    } else {
      return {
        success: false,
        message: `Error ejecutando preset: ${error.message}`,
        errorCode: error.code
      };
    }
  }
}

/**
 * Envía un movimiento personalizado al ESP32
 */
async function sendCustomMovementToESP32(ip, movement, deviceType) {
  try {
    // Detectar estructura del movimiento - puede venir en diferentes formatos
    let movimiento, horas, minutos;
    
    if (movement.movimiento) {
      // Formato app: { movimiento: { horas: {...}, minutos: {...} } }
      movimiento = movement.movimiento;
      horas = movimiento.horas || {};
      minutos = movimiento.minutos || {};
    } else if (movement.horas || movement.minutos) {
      // Formato directo: { horas: {...}, minutos: {...} }
      horas = movement.horas || {};
      minutos = movement.minutos || {};
    } else {
      // Formato básico: usar propiedades del movimiento base
      horas = {
        direccion: movement.direccionGeneral || movement.direccion || 'horario',
        velocidad: movement.velocidad || 50
      };
      minutos = {
        direccion: movement.direccionGeneral || movement.direccion || 'horario',
        velocidad: movement.velocidad || 50
      };
    }
    
    let endpoint;
    let payload;

    if (deviceType === 'prototype') {
      // ESP32 Prototipo con 28BYJ-48
      endpoint = `http://${ip}/custom`;
      payload = {
        hoursDirection: horas.direccion === 'horario' ? 'CW' : 'CCW',
        minutesDirection: minutos.direccion === 'horario' ? 'CW' : 'CCW',
        hoursSpeed: Math.max(1, Math.min(100, horas.velocidad || 50)),
        minutesSpeed: Math.max(1, Math.min(100, minutos.velocidad || 50)),
        duration: (movement.duracion || 60) * 1000 // Convertir a ms
      };
    } else {
      // ESP32 Estándar (Arduino) - enviar datos completos del movimiento
      endpoint = `http://${ip}/custom`;
      payload = {
        nombre: movement.nombre || 'Movimiento personalizado',
        duracion: movement.duracion || 60,
        movimiento: {
          direccionGeneral: movement.movimiento?.direccionGeneral || null,
          horas: {
            direccion: horas.direccion || 'derecha',
            velocidad: horas.velocidad !== undefined ? horas.velocidad : 50,
            angulo: horas.angulo || null
          },
          minutos: {
            direccion: minutos.direccion || 'derecha', 
            velocidad: minutos.velocidad !== undefined ? minutos.velocidad : 50,
            angulo: minutos.angulo || null
          }
        }
      };
    }

    logger.info(`📡 Enviando movimiento personalizado a ${endpoint}:`, payload);

    const response = await axios.post(endpoint, payload, {
      timeout: 15000, // Aumentamos timeout a 15 segundos
      headers: { 'Content-Type': 'application/json' },
      validateStatus: function (status) {
        return status < 500;
      }
    });

    if (response.status >= 400) {
      throw new Error(`ESP32 respondió con error ${response.status}: ${response.data?.error || 'Error desconocido'}`);
    }

    return {
      success: true,
      message: `Movimiento personalizado "${movement.nombre}" ejecutado exitosamente`,
      data: response.data
    };
    
  } catch (error) {
    // Manejo específico de tipos de error
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        message: `ESP32 no accesible en ${ip}. Verificar conexión de red.`
      };
    } else if (error.code === 'ETIMEDOUT') {
      return {
        success: false,
        message: `Timeout conectando a ESP32 en ${ip}. Dispositivo puede estar ocupado.`
      };
    } else if (error.response) {
      return {
        success: false,
        message: `ESP32 respondió con error: ${error.response.status} - ${error.response.data?.error || error.message}`
      };
    } else {
      return {
        success: false,
        message: `Error ejecutando movimiento personalizado: ${error.message}`
      };
    }
  }
}

/**
 * Verifica la conectividad con el ESP32
 */
export async function pingESP32(ip) {
  try {
    // Usar la ruta raíz que existe en el Arduino
    const response = await axios.get(`http://${ip}/`, {
      timeout: 5000
    });

    return {
      success: true,
      message: 'ESP32 conectado',
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      message: `ESP32 no accesible: ${error.message}`
    };
  }
}

/**
 * Obtiene información del ESP32
 */
export async function getESP32Info(ip) {
  try {
    // Usar la ruta raíz para obtener info básica del Arduino
    const response = await axios.get(`http://${ip}/`, {
      timeout: 5000
    });

    return {
      success: true,
      data: {
        status: 'connected',
        response: response.data,
        arduino: true
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

// Funciones heredadas para compatibilidad
export async function sendToDevice(device, command) {
  logger.info(`📡 Sending command to device ${device.deviceId}: ${command.command}`);
  
  // Implementar según necesidades específicas
  return {
    success: false,
    message: 'Función heredada - usar sendCommandToESP32'
  };
}

/**
 * Envía un preset usando el sistema de polling (para backend en Render)
 */
async function sendPresetViaPolling(presetName) {
  try {
    logger.info(`📋 Encolando comando via polling: ${presetName}`);
    
    // Determinar la URL base según el entorno
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://malbouche-backend.onrender.com'
      : 'http://localhost:3000';
    
    // Hacer llamada interna al endpoint de cola
    const response = await axios.post(`${baseUrl}/api/scheduler/esp32/queue-command`, {
      command: presetName
    });
    
    if (response.status === 200) {
      return {
        success: true,
        message: `Comando "${presetName}" encolado exitosamente via polling`,
        data: response.data
      };
    } else {
      throw new Error(`Error encolando comando: ${response.status}`);
    }
    
  } catch (error) {
    logger.error(`❌ Error encolando comando via polling:`, error.message);
    return {
      success: false,
      message: `Error encolando comando: ${error.message}`
    };
  }
}

export function broadcastToAllDevices(command) {
  return new Promise(async (resolve) => {
    // Implementar según necesidades específicas
    resolve({
      success: false,
      message: 'Función heredada - implementar según necesidades'
    });
  });
}

export function getDeviceConnectionStatus(deviceId) {
  return {
    websocket: false,
    mqtt: false,
    lastSeen: null
  };
}