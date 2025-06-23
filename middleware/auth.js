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
        error: 'Token de acceso requerido'
      });
    }
    
    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user data from Firestore
    const userDoc = await db.collection('usuarios').doc(decoded.uid).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    const userData = userDoc.data();
    
    // Add user info to request object
    req.user = {
      uid: decoded.uid,
      correo: userData.correo,
      nombre: userData.nombre,
      rol: userData.rol
    };
    
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }
    
    logger.error('❌ Error en middleware de autenticación:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error de autenticación'
    });
  }
};

export const checkRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticación requerida'
      });
    }
    
    // Admin can access everything
    if (req.user.rol === 'admin') {
      return next();
    }
    
    // Check specific role
    if (req.user.rol !== requiredRole) {
      return res.status(403).json({
        success: false,
        error: 'Permisos insuficientes'
      });
    }
    
    next();
  };
};