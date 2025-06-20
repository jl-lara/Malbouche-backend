import { db } from '../firebase.js';

export async function getAllEvents(req, res) {
  try {
    console.log('📋 Obteniendo todos los eventos...');
    const snapshot = await db.ref('events').once('value');
    const events = snapshot.val() || {};
    
    console.log(`✅ ${Object.keys(events).length} eventos encontrados`);
    res.json({
      success: true,
      data: events,
      count: Object.keys(events).length
    });
  } catch (err) {
    console.error('❌ Error al obtener eventos:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener eventos', 
      details: err.message 
    });
  }
}

export async function createEvent(req, res) {
  try {
    console.log('📝 Creando nuevo evento:', req.body.eventName || 'Sin nombre');
    
    // Validar datos requeridos
    const { eventName, startTime, endTime } = req.body;
    if (!eventName || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: eventName, startTime, endTime'
      });
    }

    const newRef = db.ref('events').push();
    const eventData = {
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await newRef.set(eventData);
    
    console.log(`✅ Evento creado con ID: ${newRef.key}`);
    res.status(201).json({ 
      success: true,
      message: 'Evento creado exitosamente', 
      id: newRef.key,
      data: eventData
    });
  } catch (err) {
    console.error('❌ Error al crear evento:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error al crear evento', 
      details: err.message 
    });
  }
}

export async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    console.log(`📝 Actualizando evento: ${id}`);
    
    const eventData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await db.ref(`events/${id}`).update(eventData);
    
    console.log(`✅ Evento ${id} actualizado`);
    res.json({ 
      success: true,
      message: 'Evento actualizado exitosamente',
      id,
      data: eventData
    });
  } catch (err) {
    console.error('❌ Error al actualizar evento:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error al actualizar evento', 
      details: err.message 
    });
  }
}

export async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    console.log(`🗑️ Eliminando evento: ${id}`);
    
    await db.ref(`events/${id}`).remove();
    
    console.log(`✅ Evento ${id} eliminado`);
    res.json({ 
      success: true,
      message: 'Evento eliminado exitosamente',
      id
    });
  } catch (err) {
    console.error('❌ Error al eliminar evento:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error al eliminar evento', 
      details: err.message 
    });
  }
}