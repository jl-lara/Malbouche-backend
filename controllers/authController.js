import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../services/firebase.js';
import { logger } from '../services/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'malbouche_secret';
const JWT_EXPIRES_IN = '24h';

export const register = async (req, res) => {
  try {
    const { nombre, apellidos, correo, password, puesto = '' } = req.body;
    
    // Removed activity logging
    
    // Check if user already exists
    const existingUser = await db.collection('usuarios')
      .where('correo', '==', correo)
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
      nombre,
      apellidos,
      correo,
      passwordHash,
      puesto,
      rol: 'usuario', // Default role
      fechaCreacion: new Date().toISOString()
    };
    
    const userRef = await db.collection('usuarios').add(userData);
    
    // Removed activity logging to logs collection
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
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
    let { correo, password } = req.body;
    
    correo = correo.trim().toLowerCase();
    
    // Removed activity logging
    
    // Get user from Firestore
    const userQuery = await db.collection('usuarios')
      .where('correo', '==', correo)
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
        correo: userData.correo, 
        rol: userData.rol 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Removed activity logging to logs collection
    
    res.json({
      success: true,
      message: 'Login successful',
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
    logger.error('❌ Error during login:', err.message);
    res.status(500).json({
      success: false,
      error: 'Login error',
      details: err.message
    });
  }
};