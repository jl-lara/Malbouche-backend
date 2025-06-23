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
        error: 'Access token required'
      });
    }
    
    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const userData = userDoc.data();
    
    // Add user info to request object
    req.user = {
      uid: decoded.uid,
      email: userData.email,
      name: userData.name,
      role: userData.role
    };
    
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    
    logger.error('❌ Error in authentication middleware:', err.message);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

export const checkRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check specific role
    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    next();
  };
};