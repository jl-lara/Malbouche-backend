# Configuración de Variables de Entorno para Render

## 🚀 **Variables Necesarias en Render**

Para habilitar logs completos y debugging del EventScheduler, configura estas variables de entorno en Render:

### **1. Configuración de Logs**
```bash
# Para desarrollo/debugging (logs completos)
LOG_LEVEL=info
DISABLE_ACTIVITY_LOGS=false

# Para producción (logs mínimos)
LOG_LEVEL=warn
DISABLE_ACTIVITY_LOGS=true
```

### **2. Configuración del Servidor**
```bash
PORT=3000
NODE_ENV=production
```

### **3. Configuración JWT**
```bash
JWT_SECRET=your_super_secure_jwt_secret_here_minimum_32_characters
```

### **4. Configuración Firebase**
```bash
FIREBASE_CREDENTIALS={"type":"service_account","project_id":"tu-proyecto-id",...}
```

### **5. Configuración CORS**
```bash
CORS_ORIGIN=*
```

## 🔧 **Cómo Configurar en Render**

### **Método 1: Dashboard Web**
1. Ve a tu servicio en Render Dashboard
2. Click en "Environment"
3. Agregar cada variable:
   - **Key:** `LOG_LEVEL`
   - **Value:** `info`
   - Click "Add"

### **Método 2: render.yaml (Recomendado)**
```yaml
services:
  - type: web
    name: malbouche-backend
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: LOG_LEVEL
        value: info
      - key: DISABLE_ACTIVITY_LOGS
        value: false
      - key: JWT_SECRET
        generateValue: true
      - key: CORS_ORIGIN
        value: "*"
```

## 📊 **Niveles de Log Disponibles**

```bash
# Logs muy detallados (debugging)
LOG_LEVEL=debug

# Logs informativos (recomendado para EventScheduler)
LOG_LEVEL=info

# Solo advertencias y errores
LOG_LEVEL=warn

# Solo errores críticos
LOG_LEVEL=error
```

## 🕒 **EventScheduler Logging**

Con `LOG_LEVEL=info` verás estos logs:

```bash
🚀 Iniciando EventScheduler...
📡 Esperando configuración ESP32 desde la app móvil...
📅 5 eventos programados exitosamente
✅ EventScheduler iniciado exitosamente
⏰ Evento programado: "Evento Matutino" - 08:30 - Días: [M, T, W, Th, F]
🎯 EJECUTANDO EVENTO: "Evento Matutino" (ID: evt_123)
📡 Enviando comando a ESP32 192.168.1.100 (standard)
✅ Comando enviado exitosamente a ESP32
```

## 🔄 **Cambio Rápido para Debugging**

Si necesitas activar/desactivar logs rápidamente en Render:

```bash
# Activar logs completos (debugging)
LOG_LEVEL=info

# Desactivar logs (producción)
LOG_LEVEL=warn
```

**Nota:** Después de cambiar variables de entorno en Render, el servicio se redeploy automáticamente.

## 📝 **Variables Críticas para EventScheduler**

```bash
LOG_LEVEL=info              # Logs del scheduler visibles
DISABLE_ACTIVITY_LOGS=false # Logs de actividad habilitados
NODE_ENV=production         # Modo producción
TZ=America/Mexico_City      # Zona horaria para cron
```
