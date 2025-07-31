/**
 * Script de diagnóstico específico para EventScheduler
 * Simula exactamente lo que hace el eventScheduler cuando ejecuta un evento
 */

import axios from 'axios';

const ESP32_IP = '192.168.0.175';

// Simular la configuración exacta del EventScheduler
const espConfig = {
  ip: ESP32_IP,
  type: 'standard'
};

// Simular el movimiento "left" como lo hace el EventScheduler
const movement = {
  nombre: 'left',
  descripcion: 'Movimiento izquierda'
};

async function testEventSchedulerFlow() {
  console.log('🧪 Simulando flujo exacto del EventScheduler...');
  console.log('=' * 60);
  
  try {
    console.log('\n1. Configuración EventScheduler:');
    console.log('   ESP Config:', espConfig);
    console.log('   Movement:', movement);
    
    // Simular exactamente lo que hace sendCommandToESP32
    const { ip, type = 'standard' } = espConfig;
    
    if (!ip) {
      throw new Error('IP del ESP32 no configurada');
    }

    console.log(`\n2. Enviando comando a ESP32 ${ip} (${type}): "${movement.nombre}"`);

    // Detectar si es un preset
    const presets = ['left', 'right', 'crazy', 'normal', 'stop', 'swing'];
    const isPreset = presets.includes(movement.nombre?.toLowerCase());
    
    console.log('   Es preset:', isPreset);
    
    if (isPreset) {
      await testSendPresetToESP32(ip, movement, type);
    } else {
      console.log('   ❌ No es preset - esto no debería pasar');
    }
    
  } catch (error) {
    console.error('❌ Error en simulación EventScheduler:', error.message);
  }
}

async function testSendPresetToESP32(ip, movement, deviceType) {
  try {
    console.log(`\n3. 🔍 Verificando conectividad con ESP32 ${ip}...`);
    
    const speed = movement.movimiento?.horas?.velocidad || movement.velocidad || 50;
    const presetName = movement.nombre.toLowerCase();
    
    console.log('   Speed:', speed);
    console.log('   PresetName:', presetName);
    
    let endpoint;
    
    if (deviceType === 'prototype') {
      endpoint = `http://${ip}/move`;
    } else {
      // ESP32 Estándar - usar GET request simple como espera el Arduino
      endpoint = `http://${ip}/${presetName}`;
    }

    console.log(`\n4. 📡 Enviando preset "${presetName}" a ${endpoint}`);
    console.log(`   🔧 Configuración: deviceType=${deviceType}, speed=${speed}`);

    let response;
    
    if (deviceType === 'prototype') {
      console.log('   ❌ Usando POST (prototipo) - esto es incorrecto para nuestro ESP32');
    } else {
      // ESP32 Estándar usa GET simple (como espera el Arduino)
      console.log(`   📤 GET request simple a ${endpoint}`);
      
      const startTime = Date.now();
      response = await axios.get(endpoint, {
        timeout: 15000,
        validateStatus: function (status) {
          return status < 500;
        }
      });
      const endTime = Date.now();
      
      console.log(`   ⏱️ Tiempo de respuesta: ${endTime - startTime}ms`);
      console.log(`   📨 Status: ${response.status}`);
      console.log(`   📄 Respuesta: ${response.data}`);
    }

    // Verificar si el ESP32 respondió con error
    if (response.status >= 400) {
      throw new Error(`ESP32 respondió con error ${response.status}: ${response.data?.error || 'Error desconocido'}`);
    }

    console.log(`   ✅ Preset "${presetName}" ejecutado exitosamente`);
    
    return {
      success: true,
      message: `Preset "${presetName}" ejecutado exitosamente`,
      data: response.data
    };
    
  } catch (error) {
    // Log detallado del error para diagnóstico
    console.error(`   ❌ Error comunicándose con ESP32 ${ip}:`, {
      code: error.code,
      message: error.message,
      response: error.response?.status,
      timeout: error.timeout,
      isAxiosError: error.isAxiosError
    });

    // Manejo específico de tipos de error
    if (error.code === 'ECONNREFUSED') {
      console.log('   🔧 Diagnóstico: ESP32 no accesible - conexión rechazada');
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      console.log('   🔧 Diagnóstico: Timeout - ESP32 no responde en 15 segundos');
    } else if (error.response) {
      console.log(`   🔧 Diagnóstico: ESP32 respondió con error ${error.response.status}`);
    } else if (error.code === 'ENOTFOUND') {
      console.log('   🔧 Diagnóstico: ESP32 no encontrado - IP incorrecta');
    } else {
      console.log(`   🔧 Diagnóstico: Error general: ${error.message}`);
    }
    
    throw error;
  }
}

// Ejecutar test
testEventSchedulerFlow()
  .then(() => {
    console.log('\n🏁 Test del EventScheduler completado exitosamente');
  })
  .catch(error => {
    console.error('\n❌ Test del EventScheduler falló:', error.message);
  });
