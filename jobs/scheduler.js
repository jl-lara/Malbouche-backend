// backend/jobs/scheduler.js
// DEPRECATED: Este archivo ha sido reemplazado por services/eventScheduler.js
// 
// El nuevo EventScheduler proporciona:
// - Mejor manejo de errores
// - Comunicación directa con ESP32 via HTTP
// - Logging detallado
// - API REST para control desde la app
// - Auto-recarga de eventos cuando hay cambios
// - Soporte para múltiples tipos de ESP32
//
// Para usar el nuevo sistema, ver:
// - services/eventScheduler.js
// - routes/scheduler.js
//
// El nuevo scheduler se inicia automáticamente con el servidor.

import { logger } from '../services/logger.js';

logger.info('⚠️ scheduler.js (legacy) cargado - usar services/eventScheduler.js para nueva funcionalidad');

// Funciones legacy mantenidas para compatibilidad
export function programarEvento(id, event) {
  logger.warn('programarEvento() es una función legacy - usar EventScheduler service');
}

export function cargarEventos() {
  logger.warn('cargarEventos() es una función legacy - usar EventScheduler service');
}

// Re-exportar para compatibilidad si es necesario
export { default as eventScheduler } from '../services/eventScheduler.js';