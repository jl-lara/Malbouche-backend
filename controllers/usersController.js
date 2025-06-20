import { db } from '../firebase.js';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcryptjs';

export async function getAllUsers(req, res) {
  try {
    logger.info('👥 Getting all users...');
    const snapshot = await db.ref('users').once('value');
    const users = snapshot.val() || {};
    
    // Remove sensitive data
    const sanitizedUsers = Object.entries(users).reduce((acc, [id, user]) => {
      acc[id] = {
        id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      };
      return acc;
    }, {});
    
    logger.info(`✅ ${Object.keys(users).length} users found`);
    res.json({
      success: true,
      data: sanitizedUsers,
      count: Object.keys(users).length
    });
  } catch (err) {
    logger.error('❌ Error getting users:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error getting users', 
      details: err.message 
    });
  }
}

export async function getUserById(req, res) {
  try {
    const { id } = req.params;
    logger.info(`👤 Getting user: ${id}`);
    
    const snapshot = await db.ref(`users/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = snapshot.val();
    
    // Remove sensitive data
    const sanitizedUser = {
      id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };
    
    res.json({
      success: true,
      data: sanitizedUser
    });
  } catch (err) {
    logger.error('❌ Error getting user:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error getting user', 
      details: err.message 
    });
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;
    logger.info(`👤 Updating user: ${id}`);
    
    // Check if user exists
    const snapshot = await db.ref(`users/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const updateData = {
      updatedAt: new Date().toISOString()
    };
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    // Hash new password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }
    
    await db.ref(`users/${id}`).update(updateData);
    
    logger.info(`✅ User ${id} updated`);
    res.json({ 
      success: true,
      message: 'User updated successfully',
      id
    });
  } catch (err) {
    logger.error('❌ Error updating user:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error updating user', 
      details: err.message 
    });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    logger.info(`🗑️ Deleting user: ${id}`);
    
    // Check if user exists
    const snapshot = await db.ref(`users/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    await db.ref(`users/${id}`).remove();
    
    logger.info(`✅ User ${id} deleted`);
    res.json({ 
      success: true,
      message: 'User deleted successfully',
      id
    });
  } catch (err) {
    logger.error('❌ Error deleting user:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error deleting user', 
      details: err.message 
    });
  }
}

export async function getUserDevices(req, res) {
  try {
    const { id } = req.params;
    logger.info(`📱 Getting devices for user: ${id}`);
    
    const snapshot = await db.ref('devices').orderByChild('pairedUsers').once('value');
    const allDevices = snapshot.val() || {};
    
    // Filter devices paired with this user
    const userDevices = Object.entries(allDevices)
      .filter(([_, device]) => device.pairedUsers && device.pairedUsers.includes(id))
      .reduce((acc, [deviceId, device]) => {
        acc[deviceId] = device;
        return acc;
      }, {});
    
    res.json({
      success: true,
      data: userDevices,
      count: Object.keys(userDevices).length
    });
  } catch (err) {
    logger.error('❌ Error getting user devices:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error getting user devices', 
      details: err.message 
    });
  }
}

export async function getUserEvents(req, res) {
  try {
    const { id } = req.params;
    logger.info(`📅 Getting events for user: ${id}`);
    
    const snapshot = await db.ref('events').orderByChild('createdBy').equalTo(id).once('value');
    const events = snapshot.val() || {};
    
    res.json({
      success: true,
      data: events,
      count: Object.keys(events).length
    });
  } catch (err) {
    logger.error('❌ Error getting user events:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error getting user events', 
      details: err.message 
    });
  }
}