import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let db;

try {
  // Parse Firebase credentials from environment variable
  if (!process.env.FIREBASE_CREDENTIALS) {
    throw new Error('FIREBASE_CREDENTIALS no encontrada en variables de entorno');
  }

  const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
  
  // Validate required fields
  const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
  const missingFields = requiredFields.filter(field => !credentials[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Campos faltantes en credenciales: ${missingFields.join(', ')}`);
  }

  // Initialize Firebase Admin with minimal logging
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
    projectId: credentials.project_id
  });

  db = admin.firestore();
  
  // Only log critical initialization info
  console.log('🔥 Firebase Admin inicializado');
  
} catch (error) {
  console.error('❌ Error al inicializar Firebase:', error.message);
  process.exit(1);
}

export { admin, db };