import bcrypt from 'bcryptjs';
import { db } from '../services/firebase.js';
import { logger } from '../services/logger.js';

export const getAllUsers = async (req, res) => {
  try {
    // Removed activity logging
    
    const usersSnapshot = await db.collection('usuarios').get();
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
    
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (err) {
    logger.error('❌ Error obteniendo usuarios:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo usuarios',
      details: err.message
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { nombre, apellidos, correo, password, puesto = '', rol = 'usuario' } = req.body;
    
    // Removed activity logging
    
    // Check if user already exists
    const existingUser = await db.collection('usuarios')
      .where('correo', '==', correo)
      .get();
    
    if (!existingUser.empty) {
      return res.status(409).json({
        success: false,
        error: 'El usuario ya existe'
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user document
    const userData = {
      nombre,
      apellidos,
      correo,
      passwordHash,
      puesto,
      rol,
      fechaCreacion: new Date().toISOString()
    };
    
    const userRef = await db.collection('usuarios').add(userData);
    
    // Removed activity logging to logs collection
    
    // Remove sensitive data from response
    delete userData.passwordHash;
    
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        id: userRef.id,
        ...userData
      }
    });
  } catch (err) {
    logger.error('❌ Error creando usuario:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error creando usuario',
      details: err.message
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Removed activity logging
    
    const userDoc = await db.collection('usuarios').doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
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
    logger.error('❌ Error obteniendo usuario:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo usuario',
      details: err.message
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellidos, correo, password, puesto, rol } = req.body;
    
    // Removed activity logging
    
    // Check if user exists
    const userDoc = await db.collection('usuarios').doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    const updateData = {};
    
    if (nombre) updateData.nombre = nombre;
    if (apellidos) updateData.apellidos = apellidos;
    if (correo) updateData.correo = correo;
    if (puesto !== undefined) updateData.puesto = puesto;
    if (rol) updateData.rol = rol;
    
    // Hash new password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }
    
    await db.collection('usuarios').doc(id).update(updateData);
    
    // Removed activity logging to logs collection
    
    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: { id }
    });
  } catch (err) {
    logger.error('❌ Error actualizando usuario:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error actualizando usuario',
      details: err.message
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Removed activity logging
    
    // Check if user exists
    const userDoc = await db.collection('usuarios').doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    await db.collection('usuarios').doc(id).delete();
    
    // Removed activity logging to logs collection
    
    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      data: { id }
    });
  } catch (err) {
    logger.error('❌ Error eliminando usuario:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error eliminando usuario',
      details: err.message
    });
  }
};