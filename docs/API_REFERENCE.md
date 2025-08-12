# API Reference: Malbouche Backend

## Autenticación

Todas las rutas protegidas requieren autenticación mediante JWT token.

**Header requerido:**
```
Authorization: Bearer <token>
```

## Endpoints de Comunicación con ESP32

### Consulta de comandos (ESP32)
- **Endpoint**: `GET /api/scheduler/esp32/commands`
- **Descripción**: Endpoint para que el ESP32 consulte comandos pendientes
- **Autenticación**: No requerida
- **Respuesta (hay comandos):**
  ```json
  {
    "success": true,
    "command": "left",
    "timestamp": "2023-08-15T12:34:56.789Z"
  }
  ```
- **Respuesta (sin comandos):** 
  - Status 204 No Content

### Encolar comandos
- **Endpoint**: `POST /api/scheduler/esp32/queue-command`
- **Descripción**: Encola un comando para que el ESP32 lo recoja
- **Autenticación**: No requerida (para uso interno)
- **Cuerpo de la petición:**
  ```json
  {
    "command": "left"
  }
  ```
- **Respuesta:**
  ```json
  {
    "success": true,
    "message": "Comando encolado exitosamente",
    "command": "left"
  }
  ```

### Confirmar recepción de comandos
- **Endpoint**: `POST /api/scheduler/esp32/commands/ack`
- **Descripción**: ESP32 confirma recepción y ejecución del comando
- **Autenticación**: No requerida
- **Respuesta:**
  ```json
  {
    "success": true,
    "message": "Confirmación recibida"
  }
  ```

### Estado del sistema de polling
- **Endpoint**: `GET /api/scheduler/esp32/status`
- **Descripción**: Estado del sistema de polling (para diagnóstico)
- **Autenticación**: Requerida
- **Respuesta:**
  ```json
  {
    "success": true,
    "data": {
      "pendingCommand": "left",
      "pollingEnabled": true,
      "lastUpdate": "2023-08-15T12:34:56.789Z"
    }
  }
  ```

## Comandos de movimiento

Los comandos de movimiento que pueden ser enviados al ESP32 son:

| Comando | Descripción |
|---------|-------------|
| `left`  | Giro izquierda continuo |
| `right` | Giro derecha continuo |
| `crazy` | Movimiento aleatorio |
| `normal`| Sincroniza con la hora actual |
| `stop`  | Detiene todos los motores |
| `swing` | Movimiento pendular |

## Implementación de Polling en ESP32

El ESP32 implementa un sistema de polling para consultar comandos pendientes del backend:

```cpp
// --- Variables para consultar comandos del backend ---
unsigned long ultimaConsultaComandos = 0;
const unsigned long intervaloConsultaComandos = 5000; // Cada 5 segundos
bool comandoPendiente = false;
String comandoActual = "";

// En el loop principal
void loop() {
  unsigned long ahora = millis();
  
  // --- Consultar comandos pendientes del backend ---
  if (ahora - ultimaConsultaComandos >= intervaloConsultaComandos) {
    ultimaConsultaComandos = ahora;
    consultarComandosPendientes();
  }

  // --- Ejecutar comando pendiente del backend ---
  if (comandoPendiente) {
    ejecutarComandoBackend(comandoActual);
  }
  
  // Resto del código...
}

void consultarComandosPendientes() {
  // Realiza GET a /api/scheduler/esp32/commands
}

void ejecutarComandoBackend(String comando) {
  // Ejecuta el comando recibido
}
```

## Flujo de Comunicación
1. Backend encola un comando mediante `POST /api/scheduler/esp32/queue-command`
2. ESP32 consulta cada 5 segundos mediante `GET /api/scheduler/esp32/commands`
3. ESP32 recibe y ejecuta el comando
4. ESP32 confirma ejecución mediante `POST /api/scheduler/esp32/commands/ack`

## Integración con EventScheduler
El sistema de eventos utiliza este mecanismo de polling para programar y ejecutar eventos a horas específicas. Cuando un evento programado se dispara, el sistema de eventos utiliza el endpoint `/api/scheduler/esp32/queue-command` para encolar el comando correspondiente.
