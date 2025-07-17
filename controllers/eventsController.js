import { db } from '../services/firebase.js';
import { logger } from '../services/logger.js';

export const getAllEvents = async (req, res) => {
  try {
    // Removed activity logging
    
    const eventosSnapshot = await db.collection('eventos').get();
    const eventos = [];
    
    eventosSnapshot.forEach(doc => {
      eventos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      data: eventos,
      count: eventos.length
    });
  } catch (err) {
    logger.error('❌ Error fetching events:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error fetching events',
      details: err.message
    });
  }
};

export const createEvent = async (req, res) => {
  try {
    const { nombreEvento, horaInicio, horaFin, diasSemana, movementId, enabled } = req.body;
    
    // Removed activity logging
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(horaInicio) || !timeRegex.test(horaFin)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid time format. Use HH:MM'
      });
    }
    
    const eventoData = {
      nombreEvento,
      horaInicio,
      horaFin,
      diasSemana,
      movementId,
      fechaCreacion: new Date().toISOString(),
      creadoPor: req.user?.uid || 'system',
      activo: enabled !== undefined ? enabled : true
    };
    
    const eventoRef = await db.collection('eventos').add(eventoData);
    
    // Removed activity logging to logs collection
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        id: eventoRef.id,
        ...eventoData
      }
    });
  } catch (err) {
    logger.error('❌ Error creating event:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error creating event',
      details: err.message
    });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreEvento, horaInicio, horaFin, diasSemana, tipoMovimiento, activo } = req.body;
    
    // Removed activity logging
    
    // Check if event exists
    const eventoDoc = await db.collection('eventos').doc(id).get();
    
    if (!eventoDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    const updateData = {};
    
    if (nombreEvento) updateData.nombreEvento = nombreEvento;
    if (horaInicio) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(horaInicio)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid start time format. Use HH:MM'
        });
      }
      updateData.horaInicio = horaInicio;
    }
    if (horaFin) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(horaFin)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid end time format. Use HH:MM'
        });
      }
      updateData.horaFin = horaFin;
    }
    if (diasSemana) updateData.diasSemana = diasSemana;
    if (tipoMovimiento) updateData.tipoMovimiento = tipoMovimiento;
    if (activo !== undefined) updateData.activo = activo;
    
    updateData.fechaActualizacion = new Date().toISOString();
    
    await db.collection('eventos').doc(id).update(updateData);
    
    // Removed activity logging to logs collection
    
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
      details: err.message
    });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Removed activity logging
    
    // Check if event exists
    const eventoDoc = await db.collection('eventos').doc(id).get();
    
    if (!eventoDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    await db.collection('eventos').doc(id).delete();
    
    // Removed activity logging to logs collection
    
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