import { db } from '../services/firebase.js';
import { logger } from '../services/logger.js';

export const getAllMovements = async (req, res) => {
  try {
    logger.info('🎭 Getting all movements...');
    
    const movementsSnapshot = await db.collection('movements').get();
    const movements = [];
    
    movementsSnapshot.forEach(doc => {
      movements.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    logger.info(`✅ ${movements.length} movements found`);
    
    res.json({
      success: true,
      data: movements,
      count: movements.length
    });
  } catch (err) {
    logger.error('❌ Error getting movements:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error getting movements',
      details: err.message
    });
  }
};

export const createMovement = async (req, res) => {
  try {
    const { name, movementType, speed, duration } = req.body;
    
    logger.info(`🎭 Creating movement: ${name}`);
    
    const movementData = {
      name,
      movementType,
      speed: parseInt(speed),
      duration: parseInt(duration),
      createdAt: new Date().toISOString(),
      createdBy: req.user?.uid || 'system'
    };
    
    const movementRef = await db.collection('movements').add(movementData);
    
    // Log the action
    await db.collection('logs').add({
      userId: req.user?.uid || 'system',
      action: 'create_movement',
      result: 'success',
      timestamp: new Date().toISOString(),
      details: { movementCreated: movementRef.id }
    });
    
    logger.info(`✅ Movement created with ID: ${movementRef.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Movement created successfully',
      data: {
        id: movementRef.id,
        ...movementData
      }
    });
  } catch (err) {
    logger.error('❌ Error creating movement:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error creating movement',
      details: err.message
    });
  }
};

export const updateMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, movementType, speed, duration } = req.body;
    
    logger.info(`🎭 Updating movement: ${id}`);
    
    // Check if movement exists
    const movementDoc = await db.collection('movements').doc(id).get();
    
    if (!movementDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Movement not found'
      });
    }
    
    const updateData = {};
    
    if (name) updateData.name = name;
    if (movementType) updateData.movementType = movementType;
    if (speed !== undefined) updateData.speed = parseInt(speed);
    if (duration !== undefined) updateData.duration = parseInt(duration);
    
    updateData.updatedAt = new Date().toISOString();
    
    await db.collection('movements').doc(id).update(updateData);
    
    // Log the action
    await db.collection('logs').add({
      userId: req.user?.uid || 'system',
      action: 'update_movement',
      result: 'success',
      timestamp: new Date().toISOString(),
      details: { movementUpdated: id }
    });
    
    logger.info(`✅ Movement ${id} updated`);
    
    res.json({
      success: true,
      message: 'Movement updated successfully',
      data: { id, ...updateData }
    });
  } catch (err) {
    logger.error('❌ Error updating movement:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error updating movement',
      details: err.message
    });
  }
};

export const deleteMovement = async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info(`🗑️ Deleting movement: ${id}`);
    
    // Check if movement exists
    const movementDoc = await db.collection('movements').doc(id).get();
    
    if (!movementDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Movement not found'
      });
    }
    
    await db.collection('movements').doc(id).delete();
    
    // Log the action
    await db.collection('logs').add({
      userId: req.user?.uid || 'system',
      action: 'delete_movement',
      result: 'success',
      timestamp: new Date().toISOString(),
      details: { movementDeleted: id }
    });
    
    logger.info(`✅ Movement ${id} deleted`);
    
    res.json({
      success: true,
      message: 'Movement deleted successfully',
      data: { id }
    });
  } catch (err) {
    logger.error('❌ Error deleting movement:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error deleting movement',
      details: err.message
    });
  }
};