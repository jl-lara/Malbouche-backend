/**
 * Script de diagnóstico para ESP32 - Backend Communication
 * Ejecutar con: node esp32-debug.js
 */

import axios from 'axios';

const ESP32_IP = '192.168.0.175';

async function testESP32Connectivity() {
  console.log('🔍 Diagnóstico de conectividad ESP32 Backend');
  console.log('=' * 50);
  
  // Test 1: Ping básico
  console.log('\n1. Test de conectividad básica...');
  try {
    const response = await axios.get(`http://${ESP32_IP}/`, {
      timeout: 5000
    });
    console.log('✅ ESP32 responde correctamente');
    console.log('📄 Respuesta:', response.data);
  } catch (error) {
    console.log('❌ ESP32 no responde:', error.message);
    console.log('🔧 Código de error:', error.code);
    return;
  }

  // Test 2: Ping endpoint específico
  console.log('\n2. Test de endpoint /ping...');
  try {
    const response = await axios.get(`http://${ESP32_IP}/ping`, {
      timeout: 5000
    });
    console.log('✅ Endpoint /ping funciona');
    console.log('📄 Respuesta:', response.data);
  } catch (error) {
    console.log('❌ Endpoint /ping falló:', error.message);
  }

  // Test 3: Comando left
  console.log('\n3. Test de comando left...');
  try {
    const response = await axios.get(`http://${ESP32_IP}/left`, {
      timeout: 15000
    });
    console.log('✅ Comando left ejecutado');
    console.log('📄 Respuesta:', response.data);
  } catch (error) {
    console.log('❌ Comando left falló:', error.message);
    console.log('🔧 Código de error:', error.code);
    console.log('🔧 Timeout:', error.timeout);
  }

  // Test 4: Verificar red local
  console.log('\n4. Información de red...');
  try {
    const os = await import('os');
    const networkInterfaces = os.networkInterfaces();
    
    console.log('🌐 Interfaces de red del servidor:');
    Object.keys(networkInterfaces).forEach(name => {
      const addresses = networkInterfaces[name];
      addresses.forEach(addr => {
        if (!addr.internal && addr.family === 'IPv4') {
          console.log(`   ${name}: ${addr.address}`);
        }
      });
    });
  } catch (error) {
    console.log('❌ Error obteniendo info de red:', error.message);
  }
}

// Ejecutar diagnóstico
testESP32Connectivity()
  .then(() => {
    console.log('\n🏁 Diagnóstico completado');
  })
  .catch(error => {
    console.error('❌ Error en diagnóstico:', error);
  });
