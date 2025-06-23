import { db } from '../services/firebase.js';
import { logger } from '../services/logger.js';

export const getAllEvents = async (req, res) => {
  try {
    logger.info('📅 Getting all events...');
    
    const eventsSnapshot = await db.collection('events').get();
    const events = [];
    
    eventsSnapshot.forEach(doc => {
      events.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
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
      details: err.message
    });
  }
};

export const createEvent = async (req, res) => {
  try {
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
      details: err.message
    });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { eventName, startTime, endTime, weekDays, movementType, active } = req.body;
    
    logger.info(`📅 Updating event: ${id}`);
    
    // Check if event exists
    const eventDoc = await db.collection('events').doc(id).get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    const updateData = {};
    
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
      details: err.message
    });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
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