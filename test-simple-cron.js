/**
 * Test simple de node-cron - verificar si realmente ejecuta
 */

import cron from 'node-cron';

console.log('🧪 Test simple de node-cron (verificación de ejecución)');
console.log(`🕐 Hora actual: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`);

let executionCount = 0;

// Crear un job que se ejecute cada minuto
console.log('📅 Creando job que se ejecuta cada minuto...');

const job = cron.schedule('* * * * *', () => {
  executionCount++;
  const now = new Date();
  const timeStr = now.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
  console.log(`🔥 EJECUCIÓN #${executionCount}: ${timeStr}`);
  
  // Después de 3 ejecuciones, salir
  if (executionCount >= 3) {
    console.log('✅ Test completado - node-cron está funcionando!');
    process.exit(0);
  }
});

console.log('⏰ Esperando ejecuciones... (máximo 3 minutos)');

// Timeout de seguridad
setTimeout(() => {
  console.log('❌ TIMEOUT: No se ejecutó ningún job en 4 minutos. node-cron NO está funcionando.');
  process.exit(1);
}, 4 * 60 * 1000); // 4 minutos
