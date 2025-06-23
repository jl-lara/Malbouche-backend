import { db } from '../services/firebase.js';
import { logger } from '../services/logger.js';

export const getAllEvents = async (req, res) => {
  try {
<<<<<<< HEAD
    logger.info('📅 Obteniendo todos los eventos...');
    
    const eventosSnapshot = await db.collection('eventos').get();
    const eventos = [];
    
    eventosSnapshot.forEach(doc => {
      eventos.push({
=======
    logger.info('📅 Getting all events...');
    
    const eventsSnapshot = await db.collection('events').get();
    const events = [];
    
    eventsSnapshot.forEach(doc => {
      events.push({
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
        id: doc.id,
        ...doc.data()
      });
    });
    
<<<<<<< HEAD
    logger.info(`✅ ${eventos.length} eventos encontrados`);
    
    res.json({
      success: true,
      data: eventos,
      count: eventos.length
    });
  } catch (err) {
    logger.error('❌ Error obteniendo eventos:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo eventos',
=======
    logger.info(`✅ ${events.length} events found`);
    
    res.json({
      success: true,
      data: events,
      count: events.length
    });
  } catch (err) {
    logger.error('❌ Error getting events:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error getting events',
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
      details: err.message
    });
  }
};

export const createEvent = async (req, res) => {
  try {
<<<<<<< HEAD
    const { nombreEvento, horaInicio, horaFin, diasSemana, tipoMovimiento } = req.body;
    
    logger.info(`📅 Creando evento: ${nombreEvento}`);
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(horaInicio) || !timeRegex.test(horaFin)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de hora inválido. Use HH:MM'
      });
    }
    
    const eventoData = {
      nombreEvento,
      horaInicio,
      horaFin,
      diasSemana,
      tipoMovimiento,
      fechaCreacion: new Date().toISOString(),
      creadoPor: req.user?.uid || 'system',
      activo: true
    };
    
    const eventoRef = await db.collection('eventos').add(eventoData);
    
    // Log the action
    await db.collection('logs').add({
      usuarioId: req.user?.uid || 'system',
      accion: 'crear_evento',
      resultado: 'exitoso',
      timestamp: new Date().toISOString(),
      detalles: { eventoCreado: eventoRef.id }
    });
    
    logger.info(`✅ Evento creado con ID: ${eventoRef.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      data: {
        id: eventoRef.id,
        ...eventoData
      }
    });
  } catch (err) {
    logger.error('❌ Error creando evento:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error creando evento',
=======
    const { eventName, startTime, endTime, weekDays, movementType } = req.body;
    
    logger.info(`📅 Creating event: ${eventName}`);
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid time format. Use HH:MM'
      });
    }
    
    const eventData = {
      eventName,
      startTime,
      endTime,
      weekDays,
      movementType,
      createdAt: new Date().toISOString(),
      createdBy: req.user?.uid || 'system',
      active: true
    };
    
    const eventRef = await db.collection('events').add(eventData);
    
    // Log the action
    await db.collection('logs').add({
      userId: req.user?.uid || 'system',
      action: 'create_event',
      result: 'success',
      timestamp: new Date().toISOString(),
      details: { eventCreated: eventRef.id }
    });
    
    logger.info(`✅ Event created with ID: ${eventRef.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        id: eventRef.id,
        ...eventData
      }
    });
  } catch (err) {
    logger.error('❌ Error creating event:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error creating event',
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
      details: err.message
    });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
<<<<<<< HEAD
    const { nombreEvento, horaInicio, horaFin, diasSemana, tipoMovimiento, activo } = req.body;
    
    logger.info(`📅 Actualizando evento: ${id}`);
    
    // Check if event exists
    const eventoDoc = await db.collection('eventos').doc(id).get();
    
    if (!eventoDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
=======
    const { eventName, startTime, endTime, weekDays, movementType, active } = req.body;
    
    logger.info(`📅 Updating event: ${id}`);
    
    // Check if event exists
    const eventDoc = await db.collection('events').doc(id).get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
      });
    }
    
    const updateData = {};
    
<<<<<<< HEAD
    if (nombreEvento) updateData.nombreEvento = nombreEvento;
    if (horaInicio) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(horaInicio)) {
        return res.status(400).json({
          success: false,
          error: 'Formato de hora de inicio inválido. Use HH:MM'
        });
      }
      updateData.horaInicio = horaInicio;
    }
    if (horaFin) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(horaFin)) {
        return res.status(400).json({
          success: false,
          error: 'Formato de hora de fin inválido. Use HH:MM'
        });
      }
      updateData.horaFin = horaFin;
    }
    if (diasSemana) updateData.diasSemana = diasSemana;
    if (tipoMovimiento) updateData.tipoMovimiento = tipoMovimiento;
    if (activo !== undefined) updateData.activo = activo;
    
    updateData.fechaActualizacion = new Date().toISOString();
    
    await db.collection('eventos').doc(id).update(updateData);
    
    // Log the action
    await db.collection('logs').add({
      usuarioId: req.user?.uid || 'system',
      accion: 'actualizar_evento',
      resultado: 'exitoso',
      timestamp: new Date().toISOString(),
      detalles: { eventoActualizado: id }
    });
    
    logger.info(`✅ Evento ${id} actualizado`);
    
    res.json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: { id, ...updateData }
    });
  } catch (err) {
    logger.error('❌ Error actualizando evento:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error actualizando evento',
=======
    if (eventName) updateData.eventName = eventName;
    if (startTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid start time format. Use HH:MM'
        });
      }
      updateData.startTime = startTime;
    }
    if (endTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(endTime)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid end time format. Use HH:MM'
        });
      }
      updateData.endTime = endTime;
    }
    if (weekDays) updateData.weekDays = weekDays;
    if (movementType) updateData.movementType = movementType;
    if (active !== undefined) updateData.active = active;
    
    updateData.updatedAt = new Date().toISOString();
    
    await db.collection('events').doc(id).update(updateData);
    
    // Log the action
    await db.collection('logs').add({
      userId: req.user?.uid || 'system',
      action: 'update_event',
      result: 'success',
      timestamp: new Date().toISOString(),
      details: { eventUpdated: id }
    });
    
    logger.info(`✅ Event ${id} updated`);
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { id, ...updateData }
    });
  } catch (err) {
    logger.error('❌ Error updating event:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error updating event',
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
      details: err.message
    });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
<<<<<<< HEAD
    logger.info(`🗑️ Eliminando evento: ${id}`);
    
    // Check if event exists
    const eventoDoc = await db.collection('eventos').doc(id).get();
    
    if (!eventoDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }
    
    await db.collection('eventos').doc(id).delete();
    
    // Log the action
    await db.collection('logs').add({
      usuarioId: req.user?.uid || 'system',
      accion: 'eliminar_evento',
      resultado: 'exitoso',
      timestamp: new Date().toISOString(),
      detalles: { eventoEliminado: id }
    });
    
    logger.info(`✅ Evento ${id} eliminado`);
    
    res.json({
      success: true,
      message: 'Evento eliminado exitosamente',
      data: { id }
    });
  } catch (err) {
    logger.error('❌ Error eliminando evento:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error eliminando evento',
      details: err.message
    });
  }
};
=======
    logger.info(`🗑️ Deleting event: ${id}`);
    
    // Check if event exists
    const eventDoc = await db.collection('events').doc(id).get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    await db.collection('events').doc(id).delete();
    
    // Log the action
    await db.collection('logs').add({
      userId: req.user?.uid || 'system',
      action: 'delete_event',
      result: 'success',
      timestamp: new Date().toISOString(),
      details: { eventDeleted: id }
    });
    
    logger.info(`✅ Event ${id} deleted`);
    
    res.json({
      success: true,
      message: 'Event deleted successfully',
      data: { id }
    });
  } catch (err) {
    logger.error('❌ Error deleting event:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error deleting event',
      details: err.message
    });
  }
};
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
