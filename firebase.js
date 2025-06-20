import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

let credentials;

try {
  credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
} catch (error) {
  console.error("Error al parsear FIREBASE_CREDENTIALS:", error.message);
  console.error("Contenido recibido:", process.env.FIREBASE_CREDENTIALS?.slice(0, 100) + '...');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(credentials),
  databaseURL: process.env.FIREBASE_DB_URL
});

const db = admin.database();
export { admin, db };
