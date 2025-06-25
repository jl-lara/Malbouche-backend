import bcrypt from 'bcryptjs';
import { db } from '../services/firebase.js';
import { logger } from '../services/logger.js';

export const getAllUsers = async (req, res) => {
  try {
    logger.info('👥 Obteniendo todos los usuarios...');
    
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
    
    logger.info(`✅ ${users.length} usuarios encontrados`);
    
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
    
    logger.info(`👤 Creando usuario: ${correo}`);
    
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
    
    // Log the action
    await db.collection('logs').add({
      usuarioId: req.user?.uid || 'system',
      accion: 'crear_usuario',
      resultado: 'exitoso',
      timestamp: new Date().toISOString(),
      detalles: { usuarioCreado: userRef.id }
    });
    
    logger.info(`✅ Usuario creado con ID: ${userRef.id}`);
    
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
    
    logger.info(`👤 Obteniendo usuario: ${id}`);
    
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
    
    logger.info(`👤 Actualizando usuario: ${id}`);
    
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
    
    // Log the action
    await db.collection('logs').add({
      usuarioId: req.user?.uid || 'system',
      accion: 'actualizar_usuario',
      resultado: 'exitoso',
      timestamp: new Date().toISOString(),
      detalles: { usuarioActualizado: id }
    });
    
    logger.info(`✅ Usuario ${id} actualizado`);
    
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
    
    logger.info(`🗑️ Eliminando usuario: ${id}`);
    
    // Check if user exists
    const userDoc = await db.collection('usuarios').doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    await db.collection('usuarios').doc(id).delete();
    
    // Log the action
    await db.collection('logs').add({
      usuarioId: req.user?.uid || 'system',
      accion: 'eliminar_usuario',
      resultado: 'exitoso',
      timestamp: new Date().toISOString(),
      detalles: { usuarioEliminado: id }
    });
    
    logger.info(`✅ Usuario ${id} eliminado`);
    
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