# Guía de Integración - Movimientos Directos desde la App Móvil

## Resumen de la Implementación

He implementado una solución completa que permite enviar movimientos directos desde la app móvil al ESP32 usando el backend como intermediario seguro. **NO necesitas modificar la lógica existente**, solo agregar llamadas a los nuevos endpoints.

## ¿Qué se agregó al Backend?

### 1. Nuevas Rutas (`/api/direct-movement/`)
- `POST /api/direct-movement/execute` - Ejecutar movimiento directo
- `POST /api/direct-movement/stop` - Detener movimiento
- `GET /api/direct-movement/status` - Estado de conexión

### 2. Reutilización Total
- Usa el mismo sistema de comunicación con ESP32 (`deviceCommunication.js`)
- Misma autenticación JWT existente
- Mismo manejo de errores y logging
- Misma configuración de IP del ESP32

## Integración en React Native

### 1. Reemplazar las Llamadas Directas

En lugar de conectar directamente al ESP32 desde la app, ahora harás llamadas HTTP al backend:

```javascript
// ANTES (conectión directa, problemática)
const connectToESP32 = async (ip, command) => {
  // Requería permisos de red
  // Problemas con compilación APK
  const response = await fetch(`http://${ip}/${command}`);
  return response;
};

// AHORA (a través del backend, seguro)
const sendMovementViaBackend = async (movement, speed = 50) => {
  const response = await fetch(`${API_BASE_URL}/api/direct-movement/execute`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ movement, speed })
  });
  return response.json();
};
```

### 2. Ejemplo Completo para tus Botones

```javascript
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Slider, Alert } from 'react-native';

const MovementController = ({ userToken, apiBaseUrl }) => {
  const [speed, setSpeed] = useState(50);
  const [isLoading, setIsLoading] = useState(false);

  const sendMovement = async (movementType) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/direct-movement/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movement: movementType,
          speed: speed
        })
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Éxito', result.message);
      } else {
        Alert.alert('Error', result.error || 'Error enviando comando');
      }
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo conectar al servidor');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopMovement = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/direct-movement/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
        }
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Movimiento detenido');
      }
    } catch (error) {
      console.error('Error deteniendo movimiento:', error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {/* Botones de movimiento - exactamente como los tienes ahora */}
      <TouchableOpacity 
        onPress={() => sendMovement('left')} 
        disabled={isLoading}
        style={buttonStyle}
      >
        <Text>Left</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => sendMovement('right')} 
        disabled={isLoading}
        style={buttonStyle}
      >
        <Text>Right</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => sendMovement('crazy')} 
        disabled={isLoading}
        style={buttonStyle}
      >
        <Text>Crazy</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => sendMovement('swing')} 
        disabled={isLoading}
        style={buttonStyle}
      >
        <Text>Swing</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => sendMovement('normal')} 
        disabled={isLoading}
        style={buttonStyle}
      >
        <Text>Normal</Text>
      </TouchableOpacity>

      {/* Slider de velocidad - igual que tienes ahora */}
      <View style={{ marginTop: 20 }}>
        <Text>Speed: {speed}</Text>
        <Slider
          value={speed}
          onValueChange={setSpeed}
          minimumValue={1}
          maximumValue={100}
          step={1}
        />
      </View>

      {/* Botón de parar */}
      <TouchableOpacity 
        onPress={stopMovement} 
        style={[buttonStyle, { backgroundColor: 'red' }]}
      >
        <Text style={{ color: 'white' }}>STOP</Text>
      </TouchableOpacity>
    </View>
  );
};

const buttonStyle = {
  backgroundColor: '#f0f0f0',
  padding: 15,
  margin: 5,
  borderRadius: 8,
  alignItems: 'center'
};
```

### 3. Para Movimientos Personalizados

Si tienes un botón "Custom" que permite configurar movimientos específicos:

```javascript
const sendCustomMovement = async (customConfig) => {
  try {
    const response = await fetch(`${apiBaseUrl}/api/direct-movement/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        movement: 'custom',
        speed: speed,
        customMovement: {
          nombre: 'Movimiento personalizado',
          movimiento: {
            horas: {
              direccion: customConfig.hoursDirection, // 'horario' o 'antihorario'
              velocidad: customConfig.hoursSpeed
            },
            minutos: {
              direccion: customConfig.minutesDirection, // 'horario' o 'antihorario'  
              velocidad: customConfig.minutesSpeed
            }
          }
        }
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
};
```

## Configuración Inicial Requerida

Antes de usar los movimientos directos, la app debe configurar la IP del ESP32 una vez:

```javascript
const configureESP32 = async (espIp) => {
  try {
    const response = await fetch(`${apiBaseUrl}/api/scheduler/esp32/configure`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ip: espIp,
        type: 'standard' // o 'prototype' según tu ESP32
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error configurando ESP32:', error);
    return { success: false, error: error.message };
  }
};

// Usar en un componente de configuración
const handleConfigureESP32 = async () => {
  const espIp = '192.168.1.100'; // IP de tu ESP32
  const result = await configureESP32(espIp);
  
  if (result.success) {
    Alert.alert('ESP32 configurado correctamente');
  } else {
    Alert.alert('Error', result.error);
  }
};
```

## Ventajas de esta Implementación

### ✅ Problemas Resueltos
1. **Sin permisos de red problemáticos**: La app solo hace HTTP requests normales
2. **Sin problemas de compilación APK**: No conectas directamente al ESP32
3. **Seguridad mejorada**: Todo pasa por autenticación JWT
4. **Logs centralizados**: Todos los comandos quedan registrados

### ✅ Funcionalidades Mantenidas
1. **Misma lógica de movimientos**: Reutiliza todo el código existente
2. **Mismos comandos**: left, right, crazy, swing, normal, stop, custom
3. **Control de velocidad**: Funciona igual que antes
4. **Configuración ESP32**: Usa el mismo sistema del scheduler

### ✅ Nuevas Capacidades
1. **Offline handling**: El backend puede manejar colas si el ESP32 no está disponible
2. **Retry automático**: El backend puede reintentar comandos fallidos
3. **Monitoreo**: Puedes ver el estado de conexión del ESP32
4. **Multi-usuario**: Varios usuarios pueden usar la misma configuración

## Migración Paso a Paso

1. **Mantén tu UI actual**: No cambies botones ni sliders
2. **Reemplaza solo las llamadas de red**: Cambia las conexiones directas por llamadas al backend
3. **Agrega configuración ESP32**: Un screen o modal para configurar la IP una vez
4. **Prueba gradualmente**: Prueba cada botón uno por uno
5. **Mantén fallback**: Puedes mantener ambos sistemas hasta estar seguro

## ¿Necesitas Ayuda con la Integración?

Si necesitas ayuda específica con:
- Configurar la autenticación JWT
- Manejar estados de loading
- Configurar la IP del ESP32 desde la app
- Manejar errores específicos

¡Solo pregúntame y te ayudo con los detalles específicos de tu implementación!
