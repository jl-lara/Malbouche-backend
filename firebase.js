import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let credentials;

// Método 1: Intentar cargar desde variable de entorno
if (process.env.FIREBASE_CREDENTIALS) {
  try {
    // Limpiar posibles caracteres problemáticos
    const cleanCredentials = process.env.FIREBASE_CREDENTIALS.trim();
    credentials = JSON.parse(cleanCredentials);
    console.log('✅ Credenciales cargadas desde variable de entorno');
  } catch (error) {
    console.error("❌ Error al parsear FIREBASE_CREDENTIALS desde .env:", error.message);
    console.error("Contenido recibido (primeros 100 caracteres):", process.env.FIREBASE_CREDENTIALS?.slice(0, 100) + '...');
    
    // Método 2: Intentar cargar desde archivo JSON
    try {
      const credentialsPath = join(__dirname, 'firebase-credentials.json');
      const credentialsFile = readFileSync(credentialsPath, 'utf8');
      credentials = JSON.parse(credentialsFile);
      console.log('✅ Credenciales cargadas desde archivo firebase-credentials.json');
    } catch (fileError) {
      console.error("❌ Error al cargar credenciales desde archivo:", fileError.message);
      console.error("\n🔧 SOLUCIONES POSIBLES:");
      console.error("1. Verificar que FIREBASE_CREDENTIALS en .env sea un JSON válido en una sola línea");
      console.error("2. Crear archivo firebase-credentials.json en la carpeta backend/");
      console.error("3. Verificar que no haya caracteres especiales o saltos de línea");
      process.exit(1);
    }
  }
} else {
  console.error("❌ Variable FIREBASE_CREDENTIALS no encontrada en .env");
  process.exit(1);
}

// Validar que las credenciales tengan los campos requeridos
const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
const missingFields = requiredFields.filter(field => !credentials[field]);

if (missingFields.length > 0) {
  console.error("❌ Campos faltantes en las credenciales:", missingFields);
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
    databaseURL: process.env.FIREBASE_DB_URL
  });
  
  console.log('🔥 Firebase Admin inicializado correctamente');
  console.log('📊 Proyecto:', credentials.project_id);
} catch (error) {
  console.error("❌ Error al inicializar Firebase Admin:", error.message);
  process.exit(1);
}

const db = admin.database();
export { admin, db };