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

    // Detectar si es un preset o movimiento personalizado
    const presets = ['left', 'right', 'crazy', 'normal', 'stop', 'swing'];
    const isPreset = presets.includes(movement.nombre?.toLowerCase());

    let result;
    
    if (isPreset) {
      result = await sendPresetToESP32(ip, movement, type);
    } else {
      result = await sendCustomMovementToESP32(ip, movement, type);
    }

    if (result.success) {
      logger.info(`✅ Comando enviado exitosamente a ESP32 ${ip}`);
    } else {
      logger.error(`❌ Error enviando comando a ESP32 ${ip}: ${result.message}`);
    }

    return result;
    
  } catch (error) {
    logger.error('❌ Error en comunicación con ESP32:', error.message);
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
    const speed = movement.movimiento?.horas?.velocidad || movement.velocidad || 50;
    const presetName = movement.nombre.toLowerCase();
    
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
      // ESP32 Estándar
      endpoint = `http://${ip}/${presetName}`;
      payload = { speed };
    }

    logger.info(`📡 Enviando preset "${presetName}" a ${endpoint} con payload:`, payload);

    const response = await axios.post(endpoint, payload, {
      timeout: 8000, // Reducido timeout para fallar más rápido
      headers: { 'Content-Type': 'application/json' },
      // Manejar errores de red específicos
      validateStatus: function (status) {
        return status < 500; // Resolve para códigos < 500
      }
    });

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
      // Log más detallado del error
      if (error.code === 'ECONNREFUSED') {
        logger.error(`❌ ESP32 ${ip} rechazó la conexión - ¿está encendido y conectado?`);
      } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        logger.error(`❌ ESP32 ${ip} no responde - timeout después de 8 segundos`);
      } else if (error.code === 'ENOTFOUND') {
        logger.error(`❌ ESP32 ${ip} no encontrado - ¿IP correcta?`);
      } else {
        logger.error(`❌ Error comunicando con ESP32 ${ip}:`, error.message);
      }
      
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
      // ESP32 Estándar
      endpoint = `http://${ip}/movement`;
      payload = {
        dirHoras: horas.direccion || 'horario',
        dirMinutos: minutos.direccion || 'horario',
        velHoras: horas.velocidad !== undefined ? horas.velocidad : 50,
        velMinutos: minutos.velocidad !== undefined ? minutos.velocidad : 50,
        duracion: movement.duracion || 60
      };
    }

    logger.info(`📡 Enviando movimiento personalizado a ${endpoint}:`, payload);

    const response = await axios.post(endpoint, payload, {
      timeout: 8000, // Reducido timeout
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
    const response = await axios.get(`http://${ip}/status`, {
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
    const response = await axios.get(`http://${ip}/info`, {
      timeout: 5000
    });

    return {
      success: true,
      data: response.data
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