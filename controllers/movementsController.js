import { db } from '../firebase.js';
import { logger } from '../utils/logger.js';
import { sendToDevice } from '../services/deviceCommunication.js';

export async function getAllMovements(req, res) {
  try {
    logger.info('🎭 Getting all movements...');
    const snapshot = await db.ref('movements').once('value');
    const movements = snapshot.val() || {};
    
    logger.info(`✅ ${Object.keys(movements).length} movements found`);
    res.json({
      success: true,
      data: movements,
      count: Object.keys(movements).length
    });
  } catch (err) {
    logger.error('❌ Error getting movements:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error getting movements', 
      details: err.message 
    });
  }
}

export async function createMovement(req, res) {
  try {
    const { name, type, speed, time, description } = req.body;
    logger.info(`🎭 Creating movement: ${name}`);
    
    const newRef = db.ref('movements').push();
    const movementData = {
      id: newRef.key,
      name,
      type,
      speed: parseInt(speed),
      time: parseInt(time),
      description: description || '',
      createdBy: req.user?.uid || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await newRef.set(movementData);
    
    logger.info(`✅ Movement created with ID: ${newRef.key}`);
    res.status(201).json({ 
      success: true,
      message: 'Movement created successfully', 
      id: newRef.key,
      data: movementData
    });
  } catch (err) {
    logger.error('❌ Error creating movement:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error creating movement', 
      details: err.message 
    });
  }
}

export async function updateMovement(req, res) {
  try {
    const { id } = req.params;
    logger.info(`🎭 Updating movement: ${id}`);
    
    const movementData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await db.ref(`movements/${id}`).update(movementData);
    
    logger.info(`✅ Movement ${id} updated`);
    res.json({ 
      success: true,
      message: 'Movement updated successfully',
      id,
      data: movementData
    });
  } catch (err) {
    logger.error('❌ Error updating movement:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error updating movement', 
      details: err.message 
    });
  }
}

export async function deleteMovement(req, res) {
  try {
    const { id } = req.params;
    logger.info(`🗑️ Deleting movement: ${id}`);
    
    await db.ref(`movements/${id}`).remove();
    
    logger.info(`✅ Movement ${id} deleted`);
    res.json({ 
      success: true,
      message: 'Movement deleted successfully',
      id
    });
  } catch (err) {
    logger.error('❌ Error deleting movement:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error deleting movement', 
      details: err.message 
    });
  }
}

export async function executeMovement(req, res) {
  try {
    const { id } = req.params;
    const { deviceId } = req.body;
    
    logger.info(`🎭 Executing movement ${id} on device ${deviceId}`);
    
    // Get movement data
    const movementSnapshot = await db.ref(`movements/${id}`).once('value');
    if (!movementSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Movement not found'
      });
    }
    
    const movement = movementSnapshot.val();
    
    // Get device data
    const deviceSnapshot = await db.ref(`devices/${deviceId}`).once('value');
    if (!deviceSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
    const device = deviceSnapshot.val();
    
    // Send movement command to device
    const command = {
      command: 'execute_movement',
      parameters: {
        type: movement.type,
        speed: movement.speed,
        time: movement.time,
        movementId: id
      }
    };
    
    const result = await sendToDevice(device, command);
    
    // Log execution
    await db.ref(`movements/${id}/executions`).push({
      deviceId,
      timestamp: new Date().toISOString(),
      status: result.success ? 'executed' : 'failed',
      response: result.response
    });
    
    logger.info(`✅ Movement ${id} executed on device ${deviceId}`);
    res.json({ 
      success: true,
      message: 'Movement executed successfully',
      result
    });
  } catch (err) {
    logger.error('❌ Error executing movement:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error executing movement', 
      details: err.message 
    });
  }
}