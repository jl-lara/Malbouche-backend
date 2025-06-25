import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../services/firebase.js';
import { logger } from '../services/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'malbouche_secret';
const JWT_EXPIRES_IN = '24h';

export const register = async (req, res) => {
  try {
    const { nombre, apellidos, correo, password, puesto = '' } = req.body;
    
    logger.info(`📝 Intento de registro para: ${correo}`);
    
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
      rol: 'usuario', // Default role
      fechaCreacion: new Date().toISOString()
    };
    
    const userRef = await db.collection('usuarios').add(userData);
    
    // Log the action
    await db.collection('logs').add({
      usuarioId: userRef.id,
      accion: 'registro',
      resultado: 'exitoso',
      timestamp: new Date().toISOString()
    });
    
    logger.info(`✅ Usuario ${correo} registrado exitosamente`);
    
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        id: userRef.id,
        nombre,
        apellidos,
        correo,
        puesto,
        rol: 'usuario'
      }
    });
  } catch (err) {
    logger.error('❌ Error durante el registro:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error en el registro',
      details: err.message
    });
  }
};

export const login = async (req, res) => {
  try {
    let { correo, password } = req.body;
    
    correo = correo.trim().toLowerCase();
    
    logger.info(`🔐 Intento de login para: ${correo}`);
    
    // Get user from Firestore
    const userQuery = await db.collection('usuarios')
      .where('correo', '==', correo)
      .get();
    
    if (userQuery.empty) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }
    
    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        uid: userDoc.id, 
        correo: userData.correo, 
        rol: userData.rol 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Log the action
    await db.collection('logs').add({
      usuarioId: userDoc.id,
      accion: 'login',
      resultado: 'exitoso',
      timestamp: new Date().toISOString()
    });
    
    logger.info(`✅ Usuario ${correo} inició sesión exitosamente`);
    
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: userDoc.id,
          nombre: userData.nombre,
          apellidos: userData.apellidos,
          correo: userData.correo,
          puesto: userData.puesto,
          rol: userData.rol
        },
        token
      }
    });
  } catch (err) {
    logger.error('❌ Error durante el login:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error en el login',
      details: err.message
    });
  }
};
