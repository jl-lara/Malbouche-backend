import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../services/firebase.js';
import { logger } from '../services/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'malbouche_secret';
const JWT_EXPIRES_IN = '24h';

export const register = async (req, res) => {
  try {
    const { name, lastName, email, password, position = '' } = req.body;
    
    logger.info(`📝 Registration attempt for: ${email}`);
    
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
      role: 'user', // Default role
      createdAt: new Date().toISOString()
    };
    
    const userRef = await db.collection('users').add(userData);
    
    // Log the action
    await db.collection('logs').add({
      userId: userRef.id,
      action: 'register',
      result: 'success',
      timestamp: new Date().toISOString()
    });
    
    logger.info(`✅ User ${email} registered successfully`);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: userRef.id,
        name,
        lastName,
        email,
        position,
        role: 'user'
      }
    });
  } catch (err) {
    logger.error('❌ Error during registration:', err.message);
    res.status(500).json({
      success: false,
      error: 'Registration error',
      details: err.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    logger.info(`🔐 Login attempt for: ${email}`);
    
    // Get user from Firestore
    const userQuery = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (userQuery.empty) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        uid: userDoc.id, 
        email: userData.email, 
        role: userData.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Log the action
    await db.collection('logs').add({
      userId: userDoc.id,
      action: 'login',
      result: 'success',
      timestamp: new Date().toISOString()
    });
    
    logger.info(`✅ User ${email} logged in successfully`);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: userDoc.id,
          name: userData.name,
          lastName: userData.lastName,
          email: userData.email,
          position: userData.position,
          role: userData.role
        },
        token
      }
    });
  } catch (err) {
    logger.error('❌ Error during login:', err.message);
    res.status(500).json({
      success: false,
      error: 'Login error',
      details: err.message
    });
  }
};