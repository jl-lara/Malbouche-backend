# Solución: Backend en Render + ESP32 Local

## Problema Identificado
- **Backend**: Ejecutándose en Render (nube) - `https://malbouche-backend.onrender.com`
- **ESP32**: En red local privada - `192.168.0.175`
- **Causa del timeout**: Render no puede acceder directamente a dispositivos en redes locales

## Solución Implementada: Sistema de Polling

### Arquitectura anterior (NO funcionaba)
```
Backend (Render) --HTTP--> ESP32 (Red Local) ❌ TIMEOUT
```

### Nueva arquitectura (Polling)
```
ESP32 (Red Local) --HTTP GET--> Backend (Render) ✅ FUNCIONA
```

## Cambios Implementados

### 1. Arduino ESP32 (`arduino.txt`)

#### Variables agregadas:
```cpp
// Variables para consultar comandos del backend
unsigned long ultimaConsultaComandos = 0;
const unsigned long intervaloConsultaComandos = 5000; // Cada 5 segundos
bool comandoPendiente = false;
String comandoActual = "";
```

#### Funciones nuevas:
- `consultarComandosPendientes()`: Consulta comandos del backend
- `ejecutarComandoBackend()`: Ejecuta comandos recibidos

#### En el loop():
```cpp
// Consultar comandos cada 5 segundos
if (ahora - ultimaConsultaComandos >= intervaloConsultaComandos) {
  ultimaConsultaComandos = ahora;
  consultarComandosPendientes();
}

// Ejecutar comando si hay uno pendiente
if (comandoPendiente) {
  ejecutarComandoBackend(comandoActual);
}
```

### 2. Backend (`routes/scheduler.js`)

#### Endpoints nuevos:
- `GET /api/esp32/commands` - ESP32 consulta comandos pendientes
- `POST /api/esp32/queue-command` - Encola comandos para ESP32
- `GET /api/esp32/status` - Estado del sistema de polling

### 3. Device Communication (`services/deviceCommunication.js`)

#### Función nueva:
- `sendPresetViaPolling()`: Encola comandos en lugar de envío directo

## Flujo de Funcionamiento

### Cuando se ejecuta un evento:

1. **EventScheduler** ejecuta evento
2. **sendCommandToESP32** detecta que es un preset
3. **sendPresetViaPolling** encola el comando
4. **ESP32** consulta comandos cada 5 segundos
5. **Backend** responde con comando encolado
6. **ESP32** ejecuta el comando

### Timeline típico:
```
00:00 - Evento programado se dispara
00:00 - Comando "left" se encola en backend
00:03 - ESP32 consulta comandos (encuentra "left")
00:03 - ESP32 ejecuta modo LEFT
```

## Ventajas de esta solución

✅ **No requiere túneles**: ESP32 inicia la comunicación  
✅ **Compatible con Render**: Backend en nube funciona perfectamente  
✅ **Bajo acoplamiento**: ESP32 y backend independientes  
✅ **Resistente a fallos**: Si se pierde conexión, se reintenta  
✅ **Fácil debugging**: Logs claros en ambos lados  

## Configuración requerida

### ESP32:
1. Configurar WiFi con acceso a internet
2. Cargar código actualizado
3. Verificar que puede acceder a `https://malbouche-backend.onrender.com`

### Backend (Render):
1. Desplegar código actualizado
2. Verificar que endpoints están activos
3. Monitorear logs para confirmación

## Testing

### Test desde terminal:
```bash
# Verificar endpoint de comandos
curl https://malbouche-backend.onrender.com/api/esp32/commands

# Encolar comando manualmente
curl -X POST https://malbouche-backend.onrender.com/api/scheduler/esp32/queue-command \
  -H "Content-Type: application/json" \
  -d '{"command":"left"}'
```

### Test desde ESP32:
Verificar en Serial Monitor que aparezcan mensajes como:
```
📡 Comando recibido del backend: {"command":"left"}
✅ Comando a ejecutar: left
🎯 Ejecutando comando del backend: left
```

## Latencia esperada

- **Antes**: Timeout (15 segundos) ❌
- **Ahora**: 0-5 segundos ✅ (según intervalo de polling)

## Próximos pasos

1. ✅ Configurar WiFi en ESP32 con acceso a internet
2. ✅ Cargar código actualizado al ESP32
3. ✅ Desplegar backend actualizado a Render
4. ✅ Probar eventos programados
5. 🔄 Optimizar intervalo de polling si es necesario
