# EventScheduler Backend - Sistema de Programación de Eventos

## 🎯 **Migración Completada**

El sistema de programación de eventos ha sido **migrado completamente del frontend al backend** para mayor robustez y eficiencia.

## 🏗️ **Nueva Arquitectura**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ 📱 App Mobile   │    │  🖥️ Backend     │    │  🕐 ESP32      │
│                 │    │   Scheduler     │    │                 │
│ • Gestionar     │───→│ • node-cron     │───→│ • Ejecutar      │
│   eventos       │    │ • Auto-start    │    │   movimientos   │
│ • Ver estado    │    │ • HTTP API      │    │                 │
│ • Configurar    │    │ • Firestore     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 **Beneficios de la Migración**

### ✅ **Funcionamiento 24/7**
- Los eventos se ejecutan **independientemente** de si la app está abierta
- **Auto-inicio** del scheduler cuando se inicia el servidor
- **Resistente a cierres** de la aplicación móvil

### ⚡ **Mayor Eficiencia**
- **Zero impacto** en batería de dispositivos móviles
- **Precisión mejorada** con node-cron
- **Menor consumo de red** en la app

### 👥 **Multi-usuario**
- **Múltiples usuarios** pueden gestionar eventos simultáneamente
- **Sincronización automática** entre dispositivos
- **Control centralizado** desde el backend

### 🛡️ **Mayor Robustez**
- **Logs detallados** de todas las ejecuciones
- **Manejo avanzado** de errores
- **Reconexión automática** con ESP32
- **Fallback** y recuperación de errores

## 📡 **API Endpoints del Scheduler**

### **Control del Scheduler**
```http
GET    /api/scheduler/status          # Estado actual
POST   /api/scheduler/start           # Iniciar scheduler  
POST   /api/scheduler/stop            # Detener scheduler
POST   /api/scheduler/toggle          # Alternar on/off
POST   /api/scheduler/reload          # Recargar eventos
```

### **Gestión de ESP32**
```http
POST   /api/scheduler/esp32/configure # Configurar IP y tipo
GET    /api/scheduler/esp32/ping      # Verificar conectividad
GET    /api/scheduler/esp32/info      # Información del dispositivo
```

### **Monitoreo y Debug**
```http
GET    /api/scheduler/logs            # Logs de ejecución
POST   /api/scheduler/execute/:id     # Ejecutar evento inmediatamente
```

## 🔧 **Funcionamiento Interno**

### **Auto-Inicio**
```javascript
// El servidor inicia automáticamente el scheduler
🚀 Malbouche Backend Server running on port 3000
🕒 Auto-starting EventScheduler...
📡 Esperando configuración ESP32 desde la app móvil...
📅 5 eventos programados exitosamente
✅ EventScheduler started: 5 events scheduled
```

### **Configuración ESP32 desde App**
```javascript
// La app móvil configura la IP del ESP32
📱 App configura IP: 192.168.1.100 (standard)
📡 Configuración ESP32 actualizada desde app: 192.168.1.100 (standard)
```

### **Programación con node-cron**
```javascript
// Evento: "Evento Matutino" - 08:30 - Días: ["M", "T", "W", "Th", "F"] (solo inglés)
// Se convierte a cron: "30 8 * * 1,2,3,4,5"
⏰ Evento programado: "Evento Matutino" - 08:30 - Días: [M, T, W, Th, F]
```

### **Ejecución Automática**
```javascript
🎯 EJECUTANDO EVENTO: "Evento Matutino" (ID: evt_123)
📋 Movimiento obtenido: "movimiento_personalizado" (ID: mov_456)
📡 Enviando comando a ESP32 192.168.1.100 (standard): "movimiento_personalizado"
✅ Comando enviado exitosamente a ESP32 192.168.1.100
✅ Evento "Evento Matutino" ejecutado exitosamente
```

## 📱 **Cambios en la App Mobile**

### **Archivos Eliminados/Simplificados**
- ❌ `utils/EventSchedulerService.js` (migrado al backend)
- ⚡ `hooks/useEventScheduler.js` (simplificado para usar API)
- 🔄 `context/eventContext.js` (opcional, solo para UI)

### **Nueva Implementación en la App**
```javascript
// Hook actualizado para usar API del backend
const useEventScheduler = () => {
  const updateESPIP = async (newIp, deviceType = 'standard') => {
    // Configura ESP32 en el backend via API
    const result = await fetch('/api/scheduler/esp32/configure', {
      method: 'POST',
      body: JSON.stringify({ ip: newIp, type: deviceType })
    });
    return result;
  };
  
  const getStatus = () => 
    fetch('/api/scheduler/status');
  
  const startScheduler = () => 
    fetch('/api/scheduler/start', { method: 'POST' });
    
  const stopScheduler = () => 
    fetch('/api/scheduler/stop', { method: 'POST' });
    
  // etc...
};
```

## 🔧 **Cambios Importantes**

### **1. Mapeo de Días - Solo Inglés**
```javascript
// ✅ FORMATO SOPORTADO (único)
const diasSemana = ["Su", "M", "T", "W", "Th", "F", "Sa"];

// ❌ FORMATOS ELIMINADOS (ya no soportados)
const diasEspanol = ["domingo", "lunes", "martes", ...];
const diasAbrevEsp = ["Do", "Lu", "Ma", ...];
```

### **2. Configuración ESP32 desde App**
```javascript
// La IP del ESP32 YA NO se carga automáticamente desde Firestore
// Debe ser configurada desde la app móvil como antes:

// 1. App carga IP desde AsyncStorage
const savedIp = await AsyncStorage.getItem(ESP_IP_KEY);

// 2. App configura backend via API
await updateESPIP(savedIp, deviceType);

// 3. Backend mantiene la configuración solo en memoria
```

## 🔄 **Auto-Sincronización**

### **Detección de Cambios**
- **Crear evento** → Scheduler se recarga automáticamente
- **Editar evento** → Reprogramación inmediata
- **Eliminar evento** → Cancelación del job correspondiente

### **Logs de Sincronización**
```javascript
📅 EventScheduler notificado de nuevo evento
🔄 Recargando eventos desde Firestore...
⏹️ Job detenido: evt_123
⏰ Evento programado: "Nuevo Evento" - 15:30 - Días: [Sa, Su]
✅ Eventos recargados - 6 eventos activos
```

## 🏃‍♂️ **Cómo Usar el Nuevo Sistema**

### **1. El Backend Ya Está Listo**
- ✅ EventScheduler se inicia automáticamente
- ✅ API REST disponible
- ✅ Auto-recarga cuando hay cambios

### **2. Configurar ESP32 desde la App (Como Antes)**
```javascript
// En main.js - La app configura la IP como siempre lo hacía
await AsyncStorage.setItem(ESP_IP_KEY, ipInput);
setEspIp(ipInput);

// Actualizar el backend con la nueva IP
await updateESPIP(ipInput);

// POST /api/scheduler/esp32/configure se llama automáticamente
{
  "ip": "192.168.1.100",
  "type": "standard"  // o "prototype"
}
```

### **3. Verificar Estado**
```http
GET /api/scheduler/status
```

### **4. Crear Eventos Normalmente**
- Los eventos se crean/editan desde la app como siempre
- El scheduler backend los detecta automáticamente
- Se programan usando node-cron

## 🔍 **Monitoreo y Troubleshooting**

### **Ver Estado en Tiempo Real**
```http
GET /api/scheduler/status
```

### **Revisar Logs de Ejecución**
```http
GET /api/scheduler/logs?limit=20
```

### **Ejecutar Evento Manualmente (Testing)**
```http
POST /api/scheduler/execute/[eventId]
```

### **Verificar Conectividad ESP32**
```http
GET /api/scheduler/esp32/ping?ip=192.168.1.100
```

## ⚙️ **Configuración de Servidor**

### **Variables de Entorno**
```env
# .env
NODE_ENV=production
TZ=America/Mexico_City  # Zona horaria para cron jobs
```

### **Dependencias Agregadas**
```json
{
  "dependencies": {
    "node-cron": "^3.0.3"  // Para programación de eventos
  }
}
```

## 🎉 **¡Migración Exitosa!**

El sistema ahora funciona completamente en el backend, proporcionando:

- ⚡ **Mejor rendimiento**
- 🛡️ **Mayor confiabilidad** 
- 🔄 **Funcionamiento continuo**
- 👥 **Soporte multi-usuario**
- 📊 **Mejor monitoreo**
- 🔧 **Fácil mantenimiento**

La app móvil se simplifica y se enfoca en la **gestión de eventos** y **monitoreo de estado**, mientras que toda la **lógica de programación y ejecución** reside en el backend.
