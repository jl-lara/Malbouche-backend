/**
 * Test simple de node-cron para diagnosticar problemas
 */

import cron from 'node-cron';

console.log('🧪 Iniciando test de node-cron...');

// Test 1: Job que se ejecuta cada minuto
const testJob1 = cron.schedule('* * * * *', () => {
  const now = new Date();
  console.log(`🔥 TEST JOB 1 EJECUTADO: ${now.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`);
}, {
  scheduled: false, // Crear pausado
  timezone: 'America/Mexico_City'
});

// INICIAR EL JOB EXPLÍCITAMENTE
testJob1.start();

console.log(`📅 Test Job 1 creado - Estado: ${testJob1.running ? 'ACTIVO' : 'INACTIVO'}`);

// Test 2: Job que se ejecuta en 2 minutos desde ahora
const now = new Date();
const targetTime = new Date(now.getTime() + 2 * 60 * 1000); // +2 minutos
const minutes = targetTime.getMinutes();
const hours = targetTime.getHours();

const cronExpression = `${minutes} ${hours} * * *`;
console.log(`🎯 Test Job 2 programado para: ${targetTime.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })} - Cron: ${cronExpression}`);

const testJob2 = cron.schedule(cronExpression, () => {
  console.log(`🔥 TEST JOB 2 EJECUTADO: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`);
}, {
  scheduled: false, // Crear pausado
  timezone: 'America/Mexico_City'
});

// INICIAR EL JOB EXPLÍCITAMENTE
testJob2.start();

console.log(`📅 Test Job 2 creado - Estado: ${testJob2.running ? 'ACTIVO' : 'INACTIVO'}`);

// Mantener el script corriendo
console.log('⏰ Esperando ejecuciones... (presiona Ctrl+C para salir)');

// Log cada 30 segundos para confirmar que el script sigue vivo
setInterval(() => {
  const current = new Date();
  console.log(`💓 Script activo: ${current.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`);
}, 30000);
