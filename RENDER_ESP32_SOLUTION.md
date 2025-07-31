# Solución para Backend en Render - ESP32 Local

## Problema Identificado
- Backend en Render (nube): https://malbouche-backend.onrender.com  
- ESP32 en red local: 192.168.0.175
- **No hay conectividad directa entre nube y red local**

## Opciones de Solución

### 1. Túnel con ngrok (Más fácil)
```bash
# Instalar ngrok
npm install -g ngrok

# Crear túnel hacia ESP32
ngrok http 192.168.0.175:80

# Esto te dará una URL como:
# https://abc123.ngrok.io -> 192.168.0.175:80
```

Luego configurar el backend para usar la URL de ngrok en lugar de la IP local.

### 2. Webhook desde ESP32 (Alternativo)
En lugar de que el backend llame al ESP32, hacer que el ESP32 consulte al backend periódicamente:

```cpp
// En Arduino - consultar comandos pendientes
void checkForCommands() {
  HTTPClient http;
  http.begin("https://malbouche-backend.onrender.com/api/esp32/commands");
  
  int responseCode = http.GET();
  if (responseCode == 200) {
    String response = http.getString();
    // Procesar comando
  }
  http.end();
}
```

### 3. WebSocket persistente
Mantener una conexión WebSocket entre ESP32 y backend:

```cpp
// ESP32 se conecta al backend via WebSocket
// Backend envía comandos a través de WebSocket
```

### 4. Backend local + Render para datos
- Mantener backend local para comunicación con ESP32
- Usar Render solo para la API de datos/web

## Implementación Recomendada: ngrok

### Paso 1: Instalar ngrok
```bash
# Descargar desde https://ngrok.com/
# O via npm
npm install -g ngrok
```

### Paso 2: Crear túnel
```bash
ngrok http 192.168.0.175:80
```

### Paso 3: Actualizar backend para usar URL de ngrok
En lugar de usar IP local, usar la URL pública de ngrok.

### Paso 4: Actualizar configuración ESP32
El ESP32 seguirá funcionando normalmente en la red local.

## Ventajas de cada opción

### ngrok:
- ✅ Fácil de implementar
- ✅ No requiere cambios en ESP32
- ❌ Requiere ngrok ejecutándose siempre

### Webhook/Polling:
- ✅ No necesita túnel
- ✅ ESP32 inicia comunicación
- ❌ Latencia más alta
- ❌ Requiere cambios en ESP32

### WebSocket:
- ✅ Comunicación bidireccional
- ✅ Tiempo real
- ❌ Más complejo de implementar

### Backend local:
- ✅ Comunicación directa
- ✅ Sin latencia
- ❌ Requiere servidor local siempre activo
