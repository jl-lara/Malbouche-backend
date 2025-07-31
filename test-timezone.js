/**
 * Test de timezone para diagnosticar problema de zona horaria
 */

import cron from 'node-cron';

console.log('🧪 Test de timezone para node-cron');

// Test 1: Job sin timezone (usar timezone del sistema)
console.log('\n📅 Test 1: Job sin timezone (sistema)');
const job1 = cron.schedule('*/30 * * * * *', () => { // Cada 30 segundos
  const now = new Date();
  console.log(`🔥 Job SIN timezone ejecutado: ${now.toLocaleString()}`);
});

// Test 2: Job con timezone Mexico
console.log('\n📅 Test 2: Job con timezone America/Mexico_City');
const job2 = cron.schedule('*/30 * * * * *', () => { // Cada 30 segundos 
  const now = new Date();
  console.log(`🔥 Job CON timezone ejecutado: ${now.toLocaleString()}`);
}, {
  timezone: 'America/Mexico_City'
});

console.log('\n⏰ Esperando ejecuciones por 2 minutos...');

// Timeout de 2 minutos
setTimeout(() => {
  console.log('\n✅ Test completado');
  process.exit(0);
}, 2 * 60 * 1000);

// Log cada 15 segundos para confirmar que el script sigue activo
setInterval(() => {
  const current = new Date();
  console.log(`💓 ${current.toLocaleString()}`);
}, 15000);
