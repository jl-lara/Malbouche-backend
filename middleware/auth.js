import jwt from 'jsonwebtoken';
import { db } from '../firebase.js';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'malbouche_secret';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user data from Firebase
    const userSnapshot = await db.ref(`users/${decoded.uid}`).once('value');
    if (!userSnapshot.exists()) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = userSnapshot.val();
    
    // Add user info to request object
    req.user = {
      uid: decoded.uid,
      email: user.email,
      name: user.name,
      role: user.role
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
    
    logger.error('❌ Auth middleware error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    next();
  };
}