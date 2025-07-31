# 📚 Guía de Utilización - Malbouche Backend API

## 📋 Información General

**Proyecto:** Malbouche Backend  
**Versión:** 1.0.0  
**Descripción:** Backend API para control de reloj analógico ESP32 con Firestore  
**Tecnologías:** Node.js, Express.js, Firebase/Firestore, JWT  
**Puerto por defecto:** 3000  

---

## 🚀 Configuración Base

### URL Base
```
http://localhost:3000/api
```

### Autenticación
- **Tipo:** Bearer Token (JWT)
- **Header:** `Authorization: Bearer <token>`
- **Obtención:** Endpoint POST `/api/auth/login`

### Respuestas Estándar
```json
// Respuesta exitosa
{
  "success": true,
  "data": {...},
  "message": "Mensaje opcional"
}

// Respuesta con error
{
  "success": false,
  "error": "Descripción del error",
  "details": "Detalles adicionales (opcional)"
}
```

---

## 🔐 Autenticación

### 1. Registro de Usuario
**Endpoint:** `POST /api/auth/register`  
**Autenticación:** No requerida  

**Body:**
```json
{
  "nombre": "Juan",
  "apellidos": "Pérez García",
  "correo": "juan@example.com",
  "password": "password123",
  "puesto": "Desarrollador" // opcional
}
```

**Validaciones:**
- `nombre`: 2-50 caracteres, requerido
- `apellidos`: 2-50 caracteres, requerido
- `correo`: Email válido, requerido
- `password`: Mínimo 6 caracteres, requerido
- `puesto`: Máximo 100 caracteres, opcional

### 2. Inicio de Sesión
**Endpoint:** `POST /api/auth/login`  
**Autenticación:** No requerida  

**Body:**
```json
{
  "correo": "juan@example.com",
  "password": "password123"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "uid": "user_id",
      "correo": "juan@example.com",
      "nombre": "Juan",
      "apellidos": "Pérez García",
      "rol": "usuario"
    }
  }
}
```

---

## 👥 Gestión de Usuarios

### 1. Obtener Todos los Usuarios
**Endpoint:** `GET /api/users`  
**Autenticación:** Requerida (Solo Admin)  
**Permisos:** Solo usuarios con rol `admin`

### 2. Obtener Usuario por ID
**Endpoint:** `GET /api/users/:id`  
**Autenticación:** Requerida  

**Parámetros:**
- `id`: ID del usuario (string, requerido)

### 3. Crear Usuario
**Endpoint:** `POST /api/users`  
**Autenticación:** Requerida (Solo Admin)  
**Permisos:** Solo usuarios con rol `admin`

**Body:**
```json
{
  "nombre": "María",
  "apellidos": "González López",
  "correo": "maria@example.com",
  "puesto": "Diseñadora",
  "rol": "usuario"
}
```

**Validaciones:**
- `nombre`: 2-50 caracteres, requerido
- `apellidos`: 2-50 caracteres, requerido
- `correo`: Email válido, requerido
- `puesto`: Máximo 100 caracteres, opcional
- `rol`: Debe ser `admin`, `usuario` o `vip`, requerido

### 4. Actualizar Usuario
**Endpoint:** `PUT /api/users/:id`  
**Autenticación:** Requerida  

**Body:** Mismos campos que crear usuario (todos opcionales)

### 5. Eliminar Usuario
**Endpoint:** `DELETE /api/users/:id`  
**Autenticación:** Requerida (Solo Admin)  
**Permisos:** Solo usuarios con rol `admin`

---

## ⚙️ Gestión de Movimientos

### Información Importante sobre el Campo `angulo`

El campo `angulo` permite un control preciso del recorrido de las manecillas del reloj:

**Valores y Significados:**
- **360°**: Vuelta completa de la manecilla
- **180°**: Media vuelta (semicírculo)
- **90°**: Cuarto de vuelta
- **45°**: Octavo de vuelta
- **Cualquier valor entre 0.1-360**: Movimiento personalizado

**Casos de Uso:**
- **Movimientos pendulares**: Usar ángulos menores a 360° para que la manecilla se detenga y regrese
- **Oscilaciones**: Combinar direcciones opuestas con ángulos pequeños (ej: 30°-60°)
- **Movimientos precisos**: Controlar exactamente cuánto se mueve cada manecilla
- **Efectos visuales**: Crear patrones de movimiento únicos y personalizados

**Ejemplo de Movimiento Pendular:**
```json
{
  "horas": {
    "direccion": "derecha",
    "velocidad": 50,
    "angulo": 90    // Se mueve 90° a la derecha y regresa
  },
  "minutos": {
    "direccion": "izquierda", 
    "velocidad": 30,
    "angulo": 60    // Se mueve 60° a la izquierda y regresa
  }
}
```

### 1. Obtener Todos los Movimientos
**Endpoint:** `GET /api/movements`  
**Autenticación:** Requerida  

### 2. Obtener Movimiento por ID
**Endpoint:** `GET /api/movements/:id`  
**Autenticación:** Requerida  

**Parámetros:**
- `id`: ID del movimiento (string, requerido)

### 3. Crear Movimiento
**Endpoint:** `POST /api/movements`  
**Autenticación:** Requerida  

**Body:**
```json
{
  "nombre": "Movimiento Rápido",
  "duracion": 30,
  "movimiento": {
    "direccionGeneral": "derecha",
    "horas": {
      "direccion": "derecha",
      "velocidad": 80,
      "angulo": 180
    },
    "minutos": {
      "direccion": "izquierda",
      "velocidad": 60,
      "angulo": 90
    }
  }
}
```

**Validaciones:**
- `nombre`: 2-100 caracteres, requerido
- `duracion`: Número entero positivo, requerido
- `movimiento`: Objeto opcional con las siguientes propiedades:
  - `direccionGeneral`: "derecha" o "izquierda"
  - `horas.direccion`: "derecha" o "izquierda"
  - `horas.velocidad`: Número entre 1-100
  - `horas.angulo`: Número decimal entre 0.1-360 (grados de rotación)
  - `minutos.direccion`: "derecha" o "izquierda"
  - `minutos.velocidad`: Número entre 1-100
  - `minutos.angulo`: Número decimal entre 0.1-360 (grados de rotación)

**Nota sobre el campo `angulo`:**
- **360**: Vuelta completa de la manecilla
- **180**: Media vuelta (semicírculo)
- **90**: Cuarto de vuelta
- **Menor a 360**: Movimiento parcial que permite que la manecilla se detenga y regrese en un punto específico
- **Uso**: Permite personalizar mejor los movimientos y crear variaciones más complejas

### 4. Actualizar Movimiento
**Endpoint:** `PUT /api/movements/:id`  
**Autenticación:** Requerida  

**Body:** Mismos campos que crear movimiento (todos opcionales)

### 5. Eliminar Movimiento
**Endpoint:** `DELETE /api/movements/:id`  
**Autenticación:** Requerida  

---

## 🎯 Movimiento Actual

### 1. Establecer Movimiento Actual por Preset
**Endpoint:** `POST /api/movimiento-actual/:preset`  
**Autenticación:** Requerida  

**Parámetros:**
- `preset`: Nombre del preset de movimiento

**Body:**
```json
{
  "velocidad": 75
}
```

### 2. Actualizar Velocidad del Movimiento Actual
**Endpoint:** `PATCH /api/movimiento-actual/velocidad`  
**Autenticación:** Requerida  

**Body:**
```json
{
  "velocidad": 90
}
```

**Nota:** Esta operación solo actualiza la velocidad del movimiento actual, manteniendo los valores de `angulo` y `direccion` previamente configurados.

---

## 📅 Gestión de Eventos

### 1. Obtener Todos los Eventos
**Endpoint:** `GET /api/events`  
**Autenticación:** Requerida  

### 2. Obtener Evento por ID
**Endpoint:** `GET /api/events/:id`  
**Autenticación:** Requerida  

**Parámetros:**
- `id`: ID del evento (string, requerido)

### 3. Crear Evento
**Endpoint:** `POST /api/events`  
**Autenticación:** Requerida  

**Body:**
```json
{
  "nombreEvento": "Evento Matutino",
  "horaInicio": "08:00",
  "horaFin": "12:00",
  "diasSemana": ["M", "T", "W", "Th", "F"],
  "movementId": "movement_id_here",
  "enabled": true
}
```

**Validaciones:**
- `nombreEvento`: 2-100 caracteres, requerido
- `horaInicio`: Formato HH:MM, requerido
- `horaFin`: Formato HH:MM, requerido
- `diasSemana`: Array con al menos un día, requerido
  - Valores válidos: `Su`, `M`, `T`, `W`, `Th`, `F`, `Sa`
- `movementId`: ID del movimiento, requerido
- `enabled`: Booleano, opcional (default: true)

### 4. Actualizar Evento
**Endpoint:** `PUT /api/events/:id`  
**Autenticación:** Requerida  

**Body:** Mismos campos que crear evento (todos opcionales)

### 5. Eliminar Evento
**Endpoint:** `DELETE /api/events/:id`  
**Autenticación:** Requerida  

---

## 🔒 Middleware y Seguridad

### Middleware de Autenticación
- **verifyToken**: Verifica JWT token válido
- **checkRole(role)**: Verifica que el usuario tenga el rol especificado

### Middleware de Validación
- **validateUser**: Validaciones para datos de usuario
- **validateLogin**: Validaciones para login
- **validateRegister**: Validaciones para registro
- **validateMovimiento**: Validaciones para movimientos
- **validateEvento**: Validaciones para eventos
- **validateId**: Validación para parámetros de ID

### Seguridad Implementada
- **Helmet**: Headers de seguridad
- **CORS**: Configuración de dominios permitidos
- **Rate Limiting**: 1000 requests por 15 minutos por IP
- **Input Validation**: Validación de todos los inputs
- **Error Handling**: Manejo centralizado de errores

---

## 📊 Códigos de Estado HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado exitosamente |
| 400 | Bad Request | Error de validación o datos incorrectos |
| 401 | Unauthorized | Token inválido o ausente |
| 403 | Forbidden | Sin permisos para la operación |
| 404 | Not Found | Recurso no encontrado |
| 500 | Internal Server Error | Error interno del servidor |

---

## 🛠️ Ejemplos de Uso

### Flujo Completo de Autenticación
```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    correo: 'user@example.com',
    password: 'password123'
  })
});

const { data } = await loginResponse.json();
const token = data.token;

// 2. Usar token en requests posteriores
const usersResponse = await fetch('/api/users', {
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Crear un Movimiento
```javascript
const movementData = {
  nombre: "Movimiento Custom",
  duracion: 45,
  movimiento: {
    direccionGeneral: "derecha",
    horas: {
      direccion: "derecha",
      velocidad: 70,
      angulo: 270  // 3/4 de vuelta
    },
    minutos: {
      direccion: "izquierda",
      velocidad: 85,
      angulo: 120  // 1/3 de vuelta
    }
  }
};

const response = await fetch('/api/movements', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(movementData)
});
```

### Crear un Evento Programado
```javascript
const eventData = {
  nombreEvento: "Evento Personalizado",
  horaInicio: "14:30",
  horaFin: "18:00",
  diasSemana: ["M", "W", "F"],
  movementId: "movement_id_here",
  enabled: true
};

const response = await fetch('/api/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(eventData)
});
```

---

## 🏗️ Estructura del Proyecto

```
Malbouche-backend/
├── controllers/          # Lógica de negocio
│   ├── authController.js      # Autenticación
│   ├── usersController.js     # Gestión de usuarios
│   ├── movementsController.js # Gestión de movimientos
│   └── eventsController.js    # Gestión de eventos
├── middleware/           # Middleware personalizado
│   ├── auth.js               # Autenticación y autorización
│   ├── validation.js         # Validaciones
│   └── errorHandler.js       # Manejo de errores
├── routes/              # Definición de rutas
│   ├── auth.js               # Rutas de autenticación
│   ├── users.js              # Rutas de usuarios
│   ├── movements.js          # Rutas de movimientos
│   ├── events.js             # Rutas de eventos
│   └── movimientoActual.js   # Rutas del movimiento actual
├── services/            # Servicios externos
│   ├── firebase.js           # Configuración de Firebase
│   └── logger.js             # Sistema de logs
└── utils/               # Utilidades
    └── logger.js             # Utilidades de logging
```

---

## 🎯 Notas Importantes para Frontend

### Headers Requeridos
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}` // Para endpoints autenticados
};
```

### Manejo de Errores
```javascript
const response = await fetch('/api/users', { headers });
const data = await response.json();

if (!data.success) {
  // Manejar error
  console.error('Error:', data.error);
  if (data.details) console.error('Detalles:', data.details);
}
```

### Validación de Roles
- **admin**: Acceso completo a todos los recursos
- **usuario**: Acceso estándar (limitado en usuarios)
- **vip**: Acceso especial (definir según necesidades)

### Consideraciones de Desarrollo
1. **Siempre validar** el token antes de hacer requests
2. **Manejar errores** 401 para renovar autenticación
3. **Usar try/catch** para requests async/await
4. **Validar datos** antes de enviar al backend
5. **Mostrar mensajes** user-friendly para errores de validación

### Mejores Prácticas para el Campo `angulo`
1. **Validación en Frontend:**
   ```javascript
   const validateAngulo = (angulo) => {
     return angulo >= 0.1 && angulo <= 360;
   };
   ```

2. **Valores Comunes Recomendados:**
   ```javascript
   const angulosComunes = {
     vuellaCompleta: 360,
     mediaVuelta: 180,
     cuartoVuelta: 90,
     oscilacionPequena: 30,
     oscilacionMediana: 60,
     oscilacionGrande: 120
   };
   ```

3. **Crear Movimientos Dinámicos:**
   ```javascript
   // Movimiento pendular
   const movimientoPendular = {
     horas: { direccion: "derecha", velocidad: 40, angulo: 45 },
     minutos: { direccion: "izquierda", velocidad: 40, angulo: 45 }
   };
   
   // Movimiento de barrido
   const movimientoBarrido = {
     horas: { direccion: "derecha", velocidad: 80, angulo: 180 },
     minutos: { direccion: "derecha", velocidad: 60, angulo: 360 }
   };
   ```

---

## 📞 Endpoints de Información

### Health Check
**Endpoint:** `GET /health`  
**Descripción:** Verifica el estado del servidor

### Documentación
**Endpoint:** `GET /docs`  
**Descripción:** Documentación básica de la API

---

## 🔄 Actualizaciones Recientes

### ✅ Funcionalidades Agregadas
- **Rutas por ID**: Agregadas rutas `GET /:id` para movimientos y eventos
- **Campo `angulo`**: Nuevo campo en movimientos para controlar el recorrido de las manecillas (0.1-360 grados)
- **Movimientos personalizados**: Posibilidad de crear movimientos pendulares y de recorrido parcial
- **Validaciones completas**: Todas las validaciones implementadas con express-validator, incluyendo validación del campo `angulo`
- **Autenticación JWT**: Sistema completo de autenticación
- **Control de roles**: Middleware para verificar permisos de usuario

### 📝 Próximas Mejoras
- Paginación para listados grandes
- Filtros y búsqueda avanzada
- Logs de auditoría
- Caching para mejor performance
- Presets de movimientos comunes (pendular, oscilación, barrido)

---

*Esta guía está diseñada para facilitar la integración con el frontend. Para dudas específicas, revisar los controladores y middleware correspondientes.*
