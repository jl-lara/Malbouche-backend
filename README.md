# Malbouche Backend API

Backend para la aplicación Malbouche usando Express.js y Firebase Firestore.

## 🚀 Características

- **Autenticación JWT**: Registro y login seguro con bcrypt
- **Base de datos Firestore**: Almacenamiento escalable en la nube
- **Validación robusta**: Validación de entrada con express-validator
- **Validación de conflictos**: Prevención automática de eventos con horarios superpuestos
- **Seguridad**: Helmet, CORS, rate limiting
- **Logging**: Sistema de logs con Winston
- **Documentación**: Swagger/OpenAPI 3.0

## 📁 Estructura del Proyecto

```
backend/
├── controllers/          # Lógica de negocio
│   ├── authController.js
│   ├── usersController.js
│   ├── movimientosController.js
│   └── eventosController.js
├── routes/               # Definición de rutas
│   ├── auth.js
│   ├── users.js
│   ├── movimientos.js
│   └── eventos.js
├── middlewares/          # Middlewares personalizados
│   ├── auth.js
│   ├── validation.js
│   └── errorHandler.js
├── services/             # Servicios externos
│   ├── firebase.js
│   └── logger.js
├── swagger.json          # Documentación API
├── index.js             # Punto de entrada
└── package.json         # Dependencias
```

## 🔧 Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Puerto del servidor
PORT=3000

# JWT Secret para firmar tokens
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui

# Credenciales de Firebase como JSON string
FIREBASE_CREDENTIALS={"type":"service_account","project_id":"tu-proyecto-id",...}

# Configuración CORS
CORS_ORIGIN=*

# Configuración de logs
LOG_LEVEL=info

# Entorno
NODE_ENV=production
```

### 2. Configuración de Firebase

#### Opción A: Variable de Entorno (Recomendado para producción)

1. Ve a la consola de Firebase → Configuración del proyecto → Cuentas de servicio
2. Genera una nueva clave privada y descarga el archivo JSON
3. Convierte el JSON completo a una sola línea y colócalo en `FIREBASE_CREDENTIALS`

Ejemplo:
```env
FIREBASE_CREDENTIALS={"type":"service_account","project_id":"malbouche-ad977","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"...","universe_domain":"googleapis.com"}
```

### 3. Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Ejecutar en producción
npm start
```

## 📊 Estructura de Firestore

### Colecciones

#### `usuarios`
```javascript
{
  nombre: "Juan",
  apellidos: "Pérez García",
  correo: "juan@example.com",
  passwordHash: "hash_bcrypt",
  puesto: "Desarrollador",
  rol: "usuario", // admin, usuario, visitante
  fechaCreacion: "2024-01-01T00:00:00.000Z"
}
```

#### `movimientos`
```javascript
{
  nombre: "Movimiento Izquierda",
  tipoMovimiento: "izquierda", // derecha, izquierda, columpiarse, loco, normal, personalizado
  velocidad: 75, // 1-100
  duracion: 30, // segundos
  fechaCreacion: "2024-01-01T00:00:00.000Z",
  creadoPor: "usuario_id"
}
```

#### `eventos`
```javascript
{
  nombreEvento: "Evento Matutino",
  horaInicio: "09:00",
  horaFin: "10:00",
  diasSemana: ["lunes", "martes", "miercoles"],
  tipoMovimiento: "columpiarse",
  activo: true,
  fechaCreacion: "2024-01-01T00:00:00.000Z",
  creadoPor: "usuario_id"
}
```

#### `logs`
```javascript
{
  usuarioId: "usuario_id",
  accion: "crear_evento",
  resultado: "exitoso",
  timestamp: "2024-01-01T00:00:00.000Z",
  detalles: { eventoCreado: "evento_id" }
}
```

## 🔐 Autenticación

### Registro
```bash
POST /api/auth/register
Content-Type: application/json

{
  "nombre": "Juan",
  "apellidos": "Pérez",
  "correo": "juan@example.com",
  "password": "password123",
  "puesto": "Desarrollador"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "correo": "juan@example.com",
  "password": "password123"
}
```

### Uso del Token
```bash
GET /api/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🛡️ Roles y Permisos

- **admin**: Acceso completo a todas las funciones
- **usuario**: Puede crear/editar sus propios recursos
- **visitante**: Solo lectura

## 📚 Endpoints API

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión

### Usuarios
- `GET /api/users` - Listar usuarios (admin)
- `POST /api/users` - Crear usuario (admin)
- `GET /api/users/:id` - Obtener usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario (admin)

### Movimientos
- `GET /api/movimientos` - Listar movimientos
- `POST /api/movimientos` - Crear movimiento
- `PUT /api/movimientos/:id` - Actualizar movimiento
- `DELETE /api/movimientos/:id` - Eliminar movimiento

### Eventos
- `GET /api/eventos` - Listar eventos
- `POST /api/eventos` - Crear evento
- `PUT /api/eventos/:id` - Actualizar evento
- `DELETE /api/eventos/:id` - Eliminar evento

## 🚀 Despliegue en Render

### 1. Preparación

1. Sube tu código a GitHub
2. Conecta tu repositorio a Render
3. Configura las variables de entorno en Render

### 2. Variables de Entorno en Render

En el dashboard de Render, configura:

```
PORT=3000
NODE_ENV=production
JWT_SECRET=tu_jwt_secret_muy_seguro
FIREBASE_CREDENTIALS={"type":"service_account",...}
LOG_LEVEL=info
```

### 3. Configuración de Build

Render detectará automáticamente que es un proyecto Node.js y usará:

- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 4. Health Check

El endpoint `/health` está disponible para monitoreo:

```bash
GET /health
```

Respuesta:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "memory": {...},
  "environment": "production"
}
```

## 📖 Documentación

- **Swagger UI**: Disponible en `/docs`
- **Postman Collection**: Importa `swagger.json` en Postman
- **Health Check**: `/health`

## 🔍 Solución de Problemas

### Error: "FIREBASE_CREDENTIALS no encontrada"
- Verifica que la variable esté definida en `.env` o en Render
- Asegúrate de que el JSON esté en una sola línea

### Error: "Campos faltantes en credenciales"
- Verifica que el JSON de Firebase contenga todos los campos requeridos
- Descarga nuevamente las credenciales desde Firebase

### Error: "Token inválido"
- Verifica que el token JWT no haya expirado
- Asegúrate de incluir `Bearer ` antes del token

## 🔍 Validación de Eventos Avanzada

### Prevención de Conflictos de Horarios

El sistema incluye validación automática para prevenir eventos con horarios superpuestos:

#### ✅ **Características:**
- **Detección automática**: Verifica conflictos al crear/actualizar eventos
- **Solapamiento inteligente**: Analiza horarios y días de la semana
- **Eventos activos**: Solo considera eventos con `activo: true`
- **Mensajes descriptivos**: Errores detallados con información del conflicto

#### 📝 **Ejemplos de Uso:**

**Crear evento sin conflictos:**
```bash
POST /api/events
{
  "nombreEvento": "Reunión Matutina",
  "horaInicio": "09:00",
  "horaFin": "10:00",
  "diasSemana": ["M", "T", "W"],
  "movementId": "movement123"
}
```

**Error por conflicto detectado:**
```json
{
  "success": false,
  "error": "Validation errors",
  "details": [{
    "msg": "Conflicto de horarios detectado con el evento \"Reunión Vespertina\" (14:00-15:00, días: M, T)"
  }]
}
```

#### 📋 **Validaciones Incluidas:**
- ✅ Eventos consecutivos permitidos (ej: 10:00-11:00 y 11:00-12:00)
- ❌ Solapamientos bloqueados (ej: 09:00-10:00 vs 09:30-10:30)
- ✅ Mismos horarios en días diferentes permitidos
- ❌ Eventos contenidos bloqueados (ej: 09:00-11:00 vs 09:30-10:00)

Para más detalles, consulta: [`EVENT_CONFLICT_VALIDATION.md`](EVENT_CONFLICT_VALIDATION.md)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.