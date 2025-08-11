# Direct Movement API Guide

Esta guía explica cómo usar la nueva API de movimientos directos para controlar el ESP32 desde la aplicación móvil.

## Endpoints Disponibles

### 1. Ejecutar Movimiento Directo
**POST** `/api/direct-movement/execute`

Envía un movimiento directamente al ESP32 sin necesidad de crear eventos programados.

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Body Examples

**Presets (movimientos predefinidos):**
```json
{
  "movement": "left",
  "speed": 50
}
```

```json
{
  "movement": "right", 
  "speed": 75
}
```

```json
{
  "movement": "crazy",
  "speed": 100
}
```

**Movimientos disponibles:** `left`, `right`, `crazy`, `swing`, `normal`, `stop`

**Movimiento personalizado:**
```json
{
  "movement": "custom",
  "speed": 60,
  "customMovement": {
    "nombre": "Mi movimiento personalizado",
    "movimiento": {
      "horas": {
        "direccion": "horario",
        "velocidad": 60
      },
      "minutos": {
        "direccion": "antihorario", 
        "velocidad": 40
      }
    }
  }
}
```

#### Response
```json
{
  "success": true,
  "message": "Movimiento 'left' ejecutado exitosamente",
  "data": {
    "movement": "left",
    "speed": 50,
    "espConfig": {
      "ip": "192.168.1.100",
      "type": "standard"
    },
    "executedAt": "2025-01-15T10:30:00.000Z",
    "executedBy": "user123",
    "result": {...}
  }
}
```

### 2. Detener Movimiento
**POST** `/api/direct-movement/stop`

Detiene cualquier movimiento en curso en el ESP32.

#### Headers
```
Authorization: Bearer <token>
```

#### Response
```json
{
  "success": true,
  "message": "Movimiento detenido exitosamente",
  "data": {
    "command": "stop",
    "espConfig": {
      "ip": "192.168.1.100",
      "type": "standard"
    },
    "executedAt": "2025-01-15T10:30:00.000Z",
    "executedBy": "user123"
  }
}
```

### 3. Estado de Conexión
**GET** `/api/direct-movement/status`

Obtiene el estado actual de la conexión con el ESP32.

#### Headers
```
Authorization: Bearer <token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "espConfigured": true,
    "espConfig": {
      "ip": "192.168.1.100",
      "type": "standard"
    },
    "schedulerRunning": true,
    "lastExecution": "2025-01-15T10:25:00.000Z"
  }
}
```

## Configuración Previa Requerida

Antes de usar estos endpoints, asegúrate de que:

1. **El ESP32 esté configurado**: Usa `POST /api/scheduler/esp32/configure` para establecer la IP del ESP32
2. **El scheduler esté activo**: Usa `POST /api/scheduler/start` para iniciar el scheduler

### Configurar ESP32
```json
POST /api/scheduler/esp32/configure
{
  "ip": "192.168.1.100",
  "type": "standard"
}
```

## Errores Comunes

### ESP32 No Configurado
```json
{
  "success": false,
  "error": "No hay IP del ESP32 configurada. Configure la IP desde la configuración del scheduler."
}
```
**Solución:** Configurar la IP del ESP32 usando `/api/scheduler/esp32/configure`

### Movimiento Inválido
```json
{
  "success": false,
  "error": "Movimiento 'invalid' no válido. Movimientos válidos: left, right, crazy, swing, normal, stop"
}
```
**Solución:** Usar uno de los movimientos predefinidos o usar `"movement": "custom"`

### ESP32 No Conectado
```json
{
  "success": false,
  "message": "ESP32 no accesible en 192.168.1.100. Verificar conexión de red."
}
```
**Solución:** Verificar que el ESP32 esté encendido y conectado a la red

## Integración en la App Móvil

### Ejemplo React Native
```javascript
// Configuración base
const API_BASE_URL = 'https://tu-backend-url.com/api';
const token = 'tu-jwt-token';

// Función para enviar movimiento
const sendMovement = async (movement, speed = 50) => {
  try {
    const response = await fetch(`${API_BASE_URL}/direct-movement/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        movement,
        speed
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Movimiento enviado:', result.message);
    } else {
      console.error('Error:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error de red:', error);
    return { success: false, error: error.message };
  }
};

// Uso en componente
const handleMovementPress = (movement) => {
  const speed = speedSliderValue; // Valor del slider de velocidad
  sendMovement(movement, speed);
};

// Para movimiento personalizado
const sendCustomMovement = async (customMovement, speed) => {
  return await fetch(`${API_BASE_URL}/direct-movement/execute`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      movement: 'custom',
      speed,
      customMovement
    })
  });
};
```

## Ventajas de esta Implementación

1. **Seguridad**: Todos los comandos pasan por el backend autenticado
2. **Sin permisos de red**: La app no necesita permisos especiales de red
3. **Reutilización**: Usa toda la infraestructura existente de comunicación con ESP32
4. **Logging**: Todas las operaciones quedan registradas en los logs del backend
5. **Consistencia**: Misma lógica para eventos programados y movimientos directos
6. **Error Handling**: Manejo robusto de errores y timeouts

## Notas Importantes

- La IP del ESP32 se configura una sola vez y se reutiliza para todos los comandos
- El backend valida que el ESP32 esté disponible antes de enviar comandos
- Todos los movimientos quedan registrados con timestamp y usuario
- El sistema funciona tanto con ESP32 estándar como con prototipos
