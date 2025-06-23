import bcrypt from 'bcryptjs';
import { db } from '../services/firebase.js';
import { logger } from '../services/logger.js';

export const getAllUsers = async (req, res) => {
  try {
    logger.info('👥 Getting all users...');
    
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      // Remove sensitive data
      delete userData.passwordHash;
      users.push({
        id: doc.id,
        ...userData
      });
    });
    
    logger.info(`✅ ${users.length} users found`);
    
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (err) {
    logger.error('❌ Error getting users:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error getting users',
      details: err.message
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, lastName, email, password, position = '', role = 'user' } = req.body;
    
    logger.info(`👤 Creating user: ${email}`);
    
    // Check if user already exists
    const existingUser = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (!existingUser.empty) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user document
    const userData = {
      name,
      lastName,
      email,
      passwordHash,
      position,
      role,
      createdAt: new Date().toISOString()
    };
    
    const userRef = await db.collection('users').add(userData);
    
    // Log the action
    await db.collection('logs').add({
      userId: req.user?.uid || 'system',
      action: 'create_user',
      result: 'success',
      timestamp: new Date().toISOString(),
      details: { userCreated: userRef.id }
    });
    
    logger.info(`✅ User created with ID: ${userRef.id}`);
    
    // Remove sensitive data from response
    delete userData.passwordHash;
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: userRef.id,
        ...userData
      }
    });
  } catch (err) {
    logger.error('❌ Error creating user:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error creating user',
      details: err.message
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info(`👤 Getting user: ${id}`);
    
    const userDoc = await db.collection('users').doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const userData = userDoc.data();
    // Remove sensitive data
    delete userData.passwordHash;
    
    res.json({
      success: true,
      data: {
        id: userDoc.id,
        ...userData
      }
    });
  } catch (err) {
    logger.error('❌ Error getting user:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error getting user',
      details: err.message
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, lastName, email, password, position, role } = req.body;
    
    logger.info(`👤 Updating user: ${id}`);
    
    // Check if user exists
    const userDoc = await db.collection('users').doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const updateData = {};
    
    if (name) updateData.name = name;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (position !== undefined) updateData.position = position;
    if (role) updateData.role = role;
    
    // Hash new password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }
    
    await db.collection('users').doc(id).update(updateData);
    
    // Log the action
    await db.collection('logs').add({
      userId: req.user?.uid || 'system',
      action: 'update_user',
      result: 'success',
      timestamp: new Date().toISOString(),
      details: { userUpdated: id }
    });
    
    logger.info(`✅ User ${id} updated`);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: { id }
    });
  } catch (err) {
    logger.error('❌ Error updating user:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error updating user',
      details: err.message
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info(`🗑️ Deleting user: ${id}`);
    
    // Check if user exists
    const userDoc = await db.collection('users').doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    await db.collection('users').doc(id).delete();
    
    // Log the action
    await db.collection('logs').add({
      userId: req.user?.uid || 'system',
      action: 'delete_user',
      result: 'success',
      timestamp: new Date().toISOString(),
      details: { userDeleted: id }
    });
    
    logger.info(`✅ User ${id} deleted`);
    
    res.json({
      success: true,
      message: 'User deleted successfully',
      data: { id }
    });
  } catch (err) {
    logger.error('❌ Error deleting user:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error deleting user',
      details: err.message
    });
  }
};