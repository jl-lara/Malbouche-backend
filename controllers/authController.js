import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../firebase.js';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'malbouche_secret';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    logger.info(`🔐 Login attempt for: ${email}`);
    
    // Get user from Firebase
    const usersSnapshot = await db.ref('users').orderByChild('email').equalTo(email).once('value');
    const users = usersSnapshot.val();
    
    if (!users) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    const userId = Object.keys(users)[0];
    const user = users[userId];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Generate tokens
    const accessToken = jwt.sign(
      { uid: userId, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    const refreshToken = jwt.sign(
      { uid: userId },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );
    
    // Update last login
    await db.ref(`users/${userId}`).update({
      lastLogin: new Date().toISOString()
    });
    
    logger.info(`✅ User ${email} logged in successfully`);
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: userId,
          email: user.email,
          name: user.name,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    logger.error('❌ Error during login:', err.message);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: err.message
    });
  }
}

export async function register(req, res) {
  try {
    const { email, password, name } = req.body;
    logger.info(`📝 Registration attempt for: ${email}`);
    
    // Check if user already exists
    const existingUser = await db.ref('users').orderByChild('email').equalTo(email).once('value');
    if (existingUser.exists()) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const newUserRef = db.ref('users').push();
    const userData = {
      id: newUserRef.key,
      email,
      name,
      passwordHash,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null
    };
    
    await newUserRef.set(userData);
    
    logger.info(`✅ User ${email} registered successfully`);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: newUserRef.key,
        email,
        name,
        role: 'user'
      }
    });
  } catch (err) {
    logger.error('❌ Error during registration:', err.message);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: err.message
    });
  }
}

export async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required'
      });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    // Get user data
    const userSnapshot = await db.ref(`users/${decoded.uid}`).once('value');
    if (!userSnapshot.exists()) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = userSnapshot.val();
    
    // Generate new access token
    const accessToken = jwt.sign(
      { uid: decoded.uid, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      success: true,
      data: { accessToken }
    });
  } catch (err) {
    logger.error('❌ Error refreshing token:', err.message);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
}

export async function logout(req, res) {
  try {
    // In a production app, you might want to blacklist the token
    logger.info(`🔐 User ${req.user.email} logged out`);
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (err) {
    logger.error('❌ Error during logout:', err.message);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
}