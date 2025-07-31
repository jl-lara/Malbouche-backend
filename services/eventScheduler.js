/**
 * EventScheduler Service - Backend
 * Servicio principal para programar y ejecutar eventos automáticamente
 */

import cron from 'node-cron';
import { db } from './firebase.js';
import { logger } from './logger.js';
import { sendCommandToESP32 } from './deviceCommunication.js';

class EventSchedulerService {
  constructor() {
    this.isRunning = false;
    this.cronJobs = new Map(); // Map de eventId -> cronJob
    this.espConfig = {
      ip: null,
      type: 'standard' // 'standard' | 'prototype'
    };
    this.statistics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      lastExecution: null,
      eventsCount: 0
    };
    this.isReloading = false; // Prevenir recargas concurrentes
    this.reloadPromise = null; // Promesa de recarga actual
  }

  /**
   * Inicia el programador de eventos
   */
  async start() {
    if (this.isRunning) {
      logger.warn('EventScheduler ya está ejecutándose');
      return { success: false, message: 'Scheduler ya está activo' };
    }

    try {
      logger.info('🚀 Iniciando EventScheduler...');
      
      // NO cargar configuración del ESP32 automáticamente
      // La IP debe ser configurada desde la app móvil
      logger.info('📡 Esperando configuración ESP32 desde la app móvil...');
      
      // Cargar y programar todos los eventos activos
      await this.loadAndScheduleEvents();
      
      this.isRunning = true;
      
      logger.info(`✅ EventScheduler iniciado exitosamente - ${this.statistics.eventsCount} eventos programados`);
      
      return { 
        success: true, 
        message: 'EventScheduler iniciado exitosamente',
        eventsCount: this.statistics.eventsCount,
        espIp: this.espConfig.ip
      };
    } catch (error) {
      logger.error('❌ Error iniciando EventScheduler:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Detiene el programador de eventos
   */
  async stop() {
    if (!this.isRunning) {
      return { success: false, message: 'Scheduler no está ejecutándose' };
    }

    try {
      logger.info('🛑 Deteniendo EventScheduler...');
      
      // Detener todos los cron jobs
      for (const [eventId, job] of this.cronJobs.entries()) {
        job.destroy();
        logger.info(`  ⏹️ Job detenido: ${eventId}`);
      }
      
      this.cronJobs.clear();
      this.isRunning = false;
      
      logger.info('✅ EventScheduler detenido exitosamente');
      
      return { success: true, message: 'EventScheduler detenido exitosamente' };
    } catch (error) {
      logger.error('❌ Error deteniendo EventScheduler:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Recarga eventos desde Firestore y actualiza la programación
   */
  async reloadEvents() {
    // Prevenir recargas concurrentes
    if (this.isReloading) {
      logger.info('🔄 Recarga ya en progreso, esperando...');
      return await this.reloadPromise;
    }

    this.isReloading = true;
    this.reloadPromise = this._performReload();
    
    try {
      const result = await this.reloadPromise;
      return result;
    } finally {
      this.isReloading = false;
      this.reloadPromise = null;
    }
  }

  /**
   * Realiza la recarga real de eventos
   */
  async _performReload() {
    try {
      logger.info('🔄 Recargando eventos desde Firestore...');
      
      // Detener jobs actuales sin cambiar el estado del scheduler
      let stoppedJobs = 0;
      for (const [eventId, job] of this.cronJobs.entries()) {
        if (job && typeof job.destroy === 'function') {
          try {
            job.destroy();
            stoppedJobs++;
          } catch (error) {
            logger.warn(`⚠️ Error deteniendo job ${eventId}:`, error.message);
          }
        }
      }
      this.cronJobs.clear();
      
      logger.info(`⏹️ ${stoppedJobs} jobs anteriores detenidos`);
      
      // Cargar eventos actualizados
      await this.loadAndScheduleEvents();
      
      logger.info(`✅ Eventos recargados - ${this.statistics.eventsCount} eventos activos`);
      
      return { 
        success: true, 
        message: 'Eventos recargados exitosamente',
        eventsCount: this.statistics.eventsCount,
        stoppedJobs,
        activeJobs: this.cronJobs.size
      };
    } catch (error) {
      logger.error('❌ Error recargando eventos:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Valida formato de IP básico
   */
  isValidIP(ip) {
    if (!ip || typeof ip !== 'string') return false;
    
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) return false;
    
    // Validar rangos de octetos
    const octets = ip.split('.');
    return octets.every(octet => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }

  /**
   * Carga eventos activos desde Firestore y los programa
   */
  async loadAndScheduleEvents() {
    try {
      const eventsSnapshot = await db.collection('eventos')
        .where('activo', '==', true)
        .get();

      let scheduledCount = 0;
      
      for (const doc of eventsSnapshot.docs) {
        const event = { id: doc.id, ...doc.data() };
        
        if (this.scheduleEvent(event)) {
          scheduledCount++;
        }
      }
      
      this.statistics.eventsCount = scheduledCount;
      
      logger.info(`📅 ${scheduledCount} eventos programados exitosamente`);
    } catch (error) {
      logger.error('❌ Error cargando eventos desde Firestore:', error);
      throw error;
    }
  }

  /**
   * Programa un evento individual usando node-cron
   */
  scheduleEvent(event) {
    try {
      // Validación completa de datos del evento
      if (!this.validateEventData(event)) {
        return false;
      }

      // Convertir días de la semana al formato de cron
      const cronDays = this.convertDaysToCron(event.diasSemana);
      if (cronDays.length === 0) {
        logger.warn(`⚠️ Evento ${event.id} no tiene días válidos programados`);
        return false;
      }

      // Parsear hora de inicio
      const [hours, minutes] = event.horaInicio.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        logger.warn(`⚠️ Evento ${event.id} tiene hora inválida: ${event.horaInicio}`);
        return false;
      }

      // Crear expresión cron: minuto hora * * día_semana
      const cronExpression = `${minutes} ${hours} * * ${cronDays.join(',')}`;
      
      // Log de información de tiempo
      const now = new Date();
      const tijuanaTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Tijuana',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      }).format(now);
      logger.info(`🕐 Hora actual (Tijuana): ${tijuanaTime} - Programando para: ${hours}:${String(minutes).padStart(2, '0')}`);
      
      // Validar expresión cron
      if (!cron.validate(cronExpression)) {
        logger.error(`❌ Expresión cron inválida para evento ${event.id}: ${cronExpression}`);
        return false;
      }
      
      // Crear y programar el cron job
      const job = cron.schedule(cronExpression, async () => {
        logger.info(`🔥 TRIGGER EJECUTADO: Evento "${event.nombreEvento}" (${event.id}) - ${new Date().toISOString()}`);
        await this.executeEvent(event);
      }, {
        scheduled: true,
        timezone: 'America/Tijuana' // Zona horaria de Tijuana, B.C., México
      });

      // Verificar que el job se creó correctamente
      logger.info(`📅 Job creado para evento ${event.id}`);
      
      // Log de configuración del job
      logger.info(`⚙️ Job config - Expression: ${cronExpression}, Timezone: America/Tijuana`);
      
      // Obtener próxima ejecución (si node-cron lo soporta)
      try {
        const nextExecution = job.nextDates ? job.nextDates(1)[0] : 'No disponible';
        logger.info(`⏭️ Próxima ejecución: ${nextExecution}`);
      } catch (e) {
        logger.info(`⏭️ Próxima ejecución: No se pudo calcular`);
      }

      // Guardar referencia al job
      this.cronJobs.set(event.id, job);
      
      logger.info(`⏰ Evento programado: "${event.nombreEvento}" - ${event.horaInicio} - Días: [${event.diasSemana.join(', ')}] - Cron: ${cronExpression}`);
      
      return true;
    } catch (error) {
      logger.error(`❌ Error programando evento ${event.id}:`, error);
      return false;
    }
  }

  /**
   * Valida que un evento tenga todos los datos necesarios
   */
  validateEventData(event) {
    if (!event.id) {
      logger.warn(`⚠️ Evento sin ID, omitiendo`);
      return false;
    }

    if (!event.nombreEvento) {
      logger.warn(`⚠️ Evento ${event.id} sin nombre, omitiendo`);
      return false;
    }

    if (!event.horaInicio) {
      logger.warn(`⚠️ Evento ${event.id} sin hora de inicio, omitiendo`);
      return false;
    }

    if (!event.diasSemana || !Array.isArray(event.diasSemana)) {
      logger.warn(`⚠️ Evento ${event.id} sin días de semana válidos, omitiendo`);
      return false;
    }

    if (!event.movementId) {
      logger.warn(`⚠️ Evento ${event.id} sin movimiento asociado, omitiendo`);
      return false;
    }

    // Validar que movementId no esté vacío o sea solo espacios
    if (typeof event.movementId !== 'string' || !event.movementId.trim()) {
      logger.warn(`⚠️ Evento ${event.id} tiene movementId inválido: "${event.movementId}"`);
      return false;
    }

    // Validar formato de hora
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(event.horaInicio)) {
      logger.warn(`⚠️ Evento ${event.id} tiene formato de hora inválido: ${event.horaInicio}`);
      return false;
    }

    return true;
  }

  /**
   * Convierte días de la semana del formato de la app al formato cron
   * App: ["Su", "M", "T", "W", "Th", "F", "Sa"] (formato inglés abreviado únicamente)
   * Cron: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
   */
  convertDaysToCron(diasSemana) {
    const dayMap = {
      // Formato inglés abreviado (ÚNICO formato soportado)
      'Su': 0,  // Sunday - Domingo
      'M': 1,   // Monday - Lunes
      'T': 2,   // Tuesday - Martes
      'W': 3,   // Wednesday - Miércoles
      'Th': 4,  // Thursday - Jueves
      'F': 5,   // Friday - Viernes
      'Sa': 6   // Saturday - Sábado
    };

    const cronDays = diasSemana
      .filter(day => {
        const hasMapping = dayMap.hasOwnProperty(day);
        if (!hasMapping) {
          logger.warn(`⚠️ Día no reconocido: "${day}" - será ignorado`);
        }
        return hasMapping;
      })
      .map(day => dayMap[day])
      .filter((value, index, self) => self.indexOf(value) === index); // Eliminar duplicados

    if (cronDays.length === 0) {
      logger.error(`❌ No se encontraron días válidos en: [${diasSemana.join(', ')}]`);
    } else {
      logger.info(`📅 Días convertidos: [${diasSemana.join(', ')}] → [${cronDays.join(', ')}]`);
    }

    return cronDays;
  }

  /**
   * Ejecuta un evento específico
   */
  async executeEvent(event) {
    const executionId = `${event.id}_${Date.now()}`;
    
    try {
      logger.info(`🎯 EJECUTANDO EVENTO: "${event.nombreEvento}" (ID: ${event.id})`);
      
      this.statistics.totalExecutions++;
      
      // 1. Verificar que tenemos IP del ESP32
      if (!this.espConfig.ip) {
        throw new Error('No hay IP del ESP32 configurada');
      }

      // 2. Obtener el movimiento asociado al evento
      const movement = await this.getMovementById(event.movementId);
      if (!movement) {
        throw new Error(`Movimiento ${event.movementId} no encontrado`);
      }

      // 3. Ejecutar movimiento en ESP32
      const result = await sendCommandToESP32(this.espConfig, movement);
      
      if (result.success) {
        this.statistics.successfulExecutions++;
        this.statistics.lastExecution = new Date();
        
        logger.info(`✅ Evento "${event.nombreEvento}" ejecutado exitosamente`);
        
        // Log de ejecución exitosa
        await this.logExecution(event, movement, true, null);
      } else {
        throw new Error(result.message);
      }
      
    } catch (error) {
      this.statistics.failedExecutions++;
      
      logger.error(`❌ Error ejecutando evento "${event.nombreEvento}":`, error.message);
      
      // Log de ejecución fallida
      await this.logExecution(event, null, false, error.message);
    }
  }

  /**
   * Obtiene un movimiento por su ID desde Firestore
   */
  async getMovementById(movementId) {
    try {
      const movementDoc = await db.collection('movimientos').doc(movementId).get();
      
      if (!movementDoc.exists) {
        logger.error(`❌ Movimiento ${movementId} no encontrado en Firestore`);
        return null;
      }

      const movement = { id: movementDoc.id, ...movementDoc.data() };
      logger.info(`📋 Movimiento obtenido: "${movement.nombre}" (ID: ${movementId})`);
      
      return movement;
    } catch (error) {
      logger.error(`❌ Error obteniendo movimiento ${movementId}:`, error);
      return null;
    }
  }

  /**
   * Registra la ejecución de un evento en Firestore
   */
  async logExecution(event, movement, success, errorMessage = null) {
    try {
      const logData = {
        eventId: event.id,
        eventName: event.nombreEvento,
        movementId: event.movementId,
        movementName: movement?.nombre || 'N/A',
        executedAt: new Date(),
        success,
        errorMessage,
        espIp: this.espConfig.ip,
        createdAt: new Date()
      };

      await db.collection('event_executions').add(logData);
      
    } catch (error) {
      logger.error('❌ Error registrando ejecución de evento:', error);
    }
  }

  /**
   * Actualiza la configuración del ESP32 (desde la app móvil)
   * No persiste en Firestore - solo mantiene la configuración en memoria
   */
  async updateESPConfig(newConfig) {
    try {
      // Validar IP si se proporciona
      if (newConfig.ip && !this.isValidIP(newConfig.ip)) {
        return { success: false, message: 'Dirección IP inválida' };
      }

      this.espConfig = { ...this.espConfig, ...newConfig };
      
      logger.info(`📡 Configuración ESP32 actualizada desde app: ${this.espConfig.ip} (${this.espConfig.type})`);
      
      return { success: true, message: 'Configuración ESP32 actualizada exitosamente' };
    } catch (error) {
      logger.error('❌ Error actualizando configuración ESP32:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Ejecuta un evento inmediatamente (para testing)
   */
  async executeEventNow(eventId) {
    try {
      const eventDoc = await db.collection('eventos').doc(eventId).get();
      
      if (!eventDoc.exists) {
        return { success: false, message: 'Evento no encontrado' };
      }

      const event = { id: eventDoc.id, ...eventDoc.data() };
      
      logger.info(`🧪 Ejecutando evento inmediatamente: ${event.nombreEvento}`);
      await this.executeEvent(event);
      
      return { success: true, message: `Evento "${event.nombreEvento}" ejecutado inmediatamente` };
    } catch (error) {
      logger.error('❌ Error ejecutando evento inmediatamente:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Obtiene el estado actual del programador
   */
  getStatus() {
    const activeJobs = [];
    for (const [eventId, job] of this.cronJobs.entries()) {
      activeJobs.push({
        eventId,
        running: job.running || false,
        scheduled: job.scheduled || false
      });
    }

    return {
      isRunning: this.isRunning,
      eventsCount: this.statistics.eventsCount,
      espConfig: this.espConfig,
      statistics: this.statistics,
      scheduledEvents: Array.from(this.cronJobs.keys()),
      activeJobs,
      uptime: this.isRunning ? Date.now() : null
    };
  }

  /**
   * Debug: Lista todos los jobs activos con detalles
   */
  listActiveJobs() {
    logger.info(`📋 LISTADO DE JOBS ACTIVOS (${this.cronJobs.size} total):`);
    
    if (this.cronJobs.size === 0) {
      logger.info('  📭 No hay jobs programados');
      return;
    }

    for (const [eventId, job] of this.cronJobs.entries()) {
      const status = job.running ? '🟢 ACTIVO' : '🔴 INACTIVO';
      logger.info(`  ${status} - Evento ID: ${eventId}`);
    }
  }

  /**
   * Obtiene todos los eventos cargados (para diagnostics)
   */
  async getAllEvents() {
    try {
      const eventsSnapshot = await db.collection('eventos')
        .where('activo', '==', true)
        .get();

      const events = [];
      eventsSnapshot.forEach(doc => {
        events.push({ id: doc.id, ...doc.data() });
      });

      return events;
    } catch (error) {
      logger.error('❌ Error obteniendo todos los eventos:', error);
      return [];
    }
  }

  /**
   * Obtiene logs de ejecución recientes
   */
  async getExecutionLogs(limit = 50) {
    try {
      const logsSnapshot = await db.collection('event_executions')
        .orderBy('executedAt', 'desc')
        .limit(limit)
        .get();

      const logs = [];
      logsSnapshot.forEach(doc => {
        logs.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: logs };
    } catch (error) {
      logger.error('❌ Error obteniendo logs de ejecución:', error);
      return { success: false, message: error.message };
    }
  }
}

// Crear instancia única del servicio
const eventScheduler = new EventSchedulerService();

export default eventScheduler;
