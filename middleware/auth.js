import jwt from 'jsonwebtoken';
import { db } from '../services/firebase.js';
import { logger } from '../services/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'malbouche_secret';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
<<<<<<< HEAD
        error: 'Token de acceso requerido'
=======
        error: 'Access token required'
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
      });
    }
    
    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user data from Firestore
<<<<<<< HEAD
    const userDoc = await db.collection('usuarios').doc(decoded.uid).get();
=======
    const userDoc = await db.collection('users').doc(decoded.uid).get();
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
    
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
<<<<<<< HEAD
        error: 'Usuario no encontrado'
=======
        error: 'User not found'
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
      });
    }
    
    const userData = userDoc.data();
    
    // Add user info to request object
    req.user = {
      uid: decoded.uid,
<<<<<<< HEAD
      correo: userData.correo,
      nombre: userData.nombre,
      rol: userData.rol
=======
      email: userData.email,
      name: userData.name,
      role: userData.role
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
    };
    
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
<<<<<<< HEAD
        error: 'Token inválido'
=======
        error: 'Invalid token'
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
<<<<<<< HEAD
        error: 'Token expirado'
      });
    }
    
    logger.error('❌ Error en middleware de autenticación:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error de autenticación'
=======
        error: 'Token expired'
      });
    }
    
    logger.error('❌ Error in authentication middleware:', err.message);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
    });
  }
};

export const checkRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
<<<<<<< HEAD
        error: 'Autenticación requerida'
=======
        error: 'Authentication required'
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
      });
    }
    
    // Admin can access everything
<<<<<<< HEAD
    if (req.user.rol === 'admin') {
=======
    if (req.user.role === 'admin') {
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
      return next();
    }
    
    // Check specific role
<<<<<<< HEAD
    if (req.user.rol !== requiredRole) {
      return res.status(403).json({
        success: false,
        error: 'Permisos insuficientes'
=======
    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
      });
    }
    
    next();
  };
};