# 📱 Guía Completa del Backend API Malbouche para React Native

## Índice
1. [Introducción](#introducción)
2. [Configuración Inicial](#configuración-inicial)
3. [Autenticación](#autenticación)
4. [Gestión de Usuarios](#gestión-de-usuarios)
5. [Gestión de Movimientos](#gestión-de-movimientos)
6. [Gestión de Eventos](#gestión-de-eventos)
7. [Control del Movimiento Actual](#control-del-movimiento-actual)
8. [Control del Programador (Scheduler)](#control-del-programador-scheduler)
9. [Endpoints de Información y Utilidades](#endpoints-de-información-y-utilidades)
10. [Manejo de Errores](#manejo-de-errores)
11. [Mejores Prácticas](#mejores-prácticas)
12. [Ejemplos de Implementación](#ejemplos-de-implementación)

---

## Introducción

Esta es la guía definitiva para integrar y utilizar el backend API de Malbouche en aplicaciones React Native. El backend controla un reloj analógico ESP32 con almacenamiento en Firestore, proporcionando funcionalidades completas de autenticación, gestión de usuarios, movimientos programados, eventos automatizados y validación avanzada de conflictos de horarios.

### URL Base de la API
```
https://malbouche-backend.onrender.com/api
```

### Características Principales
- **Autenticación JWT** con roles y permisos
- **Control de reloj ESP32** con comunicación en tiempo real
- **Programación de eventos** con validación de conflictos automática
- **Gestión completa de movimientos** con control de ángulo preciso
- **Validación de conflictos de horarios** para prevenir eventos superpuestos
- **Rate limiting** (1000 requests/15min) y seguridad robusta
- **CORS habilitado** para desarrollo y producción
- **Logs de actividad** y monitoreo del sistema
- **Scheduler inteligente** para ejecución automática de eventos

---

## Configuración Inicial

### 1. Instalación de Dependencias React Native

```bash
npm install axios react-native-async-storage @react-native-async-storage/async-storage
```

### 2. Configuración del Cliente API

Crea un archivo `api/client.js`:

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://your-backend-url.com/api';

// Crear instancia de Axios
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejo de respuestas
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado, redirigir a login
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      // Navegar a pantalla de login
    }
    return Promise.reject(error);
  }
);
```

---

## Autenticación

### Registro de Usuario

```javascript
export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', {
      nombre: userData.nombre,
      apellidos: userData.apellidos,
      correo: userData.correo.toLowerCase().trim(),
      password: userData.password,
      puesto: userData.puesto || ''
    });
    
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error en el registro'
    };
  }
};
```

### Inicio de Sesión

```javascript
export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', {
      correo: credentials.correo.toLowerCase().trim(),
      password: credentials.password
    });
    
    if (response.data.success) {
      // Guardar token y datos del usuario
      await AsyncStorage.setItem('userToken', response.data.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
      
      return {
        success: true,
        user: response.data.data.user,
        token: response.data.data.token
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error en el inicio de sesión'
    };
  }
};
```

### Verificación de Autenticación

```javascript
export const checkAuthStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const userData = await AsyncStorage.getItem('userData');
    
    if (token && userData) {
      return {
        isAuthenticated: true,
        user: JSON.parse(userData),
        token
      };
    }
    
    return { isAuthenticated: false };
  } catch (error) {
    return { isAuthenticated: false };
  }
};
```

---

## Gestión de Usuarios

### Obtener Todos los Usuarios

```javascript
export const getAllUsers = async () => {
  try {
    const response = await apiClient.get('/users');
    return {
      success: true,
      users: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al obtener usuarios'
    };
  }
};
```

### Obtener Usuario por ID

```javascript
export const getUserById = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}`);
    return {
      success: true,
      user: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Usuario no encontrado'
    };
  }
};
```

### Actualizar Usuario

```javascript
export const updateUser = async (userId, userData) => {
  try {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return {
      success: true,
      user: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al actualizar usuario'
    };
  }
};
```

### Crear Usuario (Solo Admin)

```javascript
export const createUser = async (userData) => {
  try {
    const response = await apiClient.post('/users', {
      nombre: userData.nombre,
      apellidos: userData.apellidos,
      correo: userData.correo.toLowerCase().trim(),
      puesto: userData.puesto || '',
      rol: userData.rol || 'usuario'
    });
    return {
      success: true,
      user: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al crear usuario',
      details: error.response?.data?.details
    };
  }
};
```

### Eliminar Usuario (Solo Admin)

```javascript
export const deleteUser = async (userId) => {
  try {
    await apiClient.delete(`/users/${userId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al eliminar usuario'
    };
  }
};
```

---

## Gestión de Movimientos

### Estructura de un Movimiento

```javascript
const movementStructure = {
  nombre: "Movimiento Ejemplo",
  duracion: 30, // segundos
  movimiento: {
    direccionGeneral: "derecha", // "derecha" | "izquierda"
    horas: {
      direccion: "derecha", // "derecha" | "izquierda"
      velocidad: 50, // 1-100
      angulo: 90.0 // 0.1-360 grados
    },
    minutos: {
      direccion: "izquierda", // "derecha" | "izquierda"
      velocidad: 75, // 1-100
      angulo: 180.0 // 0.1-360 grados
    }
  }
};
```

### Obtener Todos los Movimientos

```javascript
export const getAllMovements = async () => {
  try {
    const response = await apiClient.get('/movements');
    return {
      success: true,
      movements: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al obtener movimientos'
    };
  }
};
```

### Obtener Movimiento por ID

```javascript
export const getMovementById = async (movementId) => {
  try {
    const response = await apiClient.get(`/movements/${movementId}`);
    return {
      success: true,
      movement: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Movimiento no encontrado'
    };
  }
};
```

### Crear Nuevo Movimiento

```javascript
export const createMovement = async (movementData) => {
  try {
    const response = await apiClient.post('/movements', movementData);
    return {
      success: true,
      movement: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al crear movimiento',
      details: error.response?.data?.details
    };
  }
};
```

### Actualizar Movimiento

```javascript
export const updateMovement = async (movementId, movementData) => {
  try {
    const response = await apiClient.put(`/movements/${movementId}`, movementData);
    return {
      success: true,
      movement: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al actualizar movimiento'
    };
  }
};
```

### Eliminar Movimiento

```javascript
export const deleteMovement = async (movementId) => {
  try {
    await apiClient.delete(`/movements/${movementId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al eliminar movimiento'
    };
  }
};
```

---

## Gestión de Eventos

### Estructura de un Evento

```javascript
const eventStructure = {
  nombreEvento: "Evento Matutino",
  horaInicio: "08:00", // Formato HH:MM
  horaFin: "09:00",    // Formato HH:MM
  diasSemana: ["M", "T", "W", "Th", "F"], // Su, M, T, W, Th, F, Sa
  movementId: "movement_id_here",
  enabled: true
};
```

### Obtener Todos los Eventos

```javascript
export const getAllEvents = async () => {
  try {
    const response = await apiClient.get('/events');
    return {
      success: true,
      events: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al obtener eventos'
    };
  }
};
```

### Obtener Evento por ID

```javascript
export const getEventById = async (eventId) => {
  try {
    const response = await apiClient.get(`/events/${eventId}`);
    return {
      success: true,
      event: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Evento no encontrado'
    };
  }
};
```

### Crear Nuevo Evento

```javascript
export const createEvent = async (eventData) => {
  try {
    const response = await apiClient.post('/events', eventData);
    return {
      success: true,
      event: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al crear evento',
      details: error.response?.data?.details
    };
  }
};
```

**⚠️ Validación de Conflictos de Horarios:**

El sistema incluye validación automática que previene eventos con horarios superpuestos:

**Criterios de Conflicto:**
- **Solapamiento de días**: Eventos que comparten al menos un día de la semana
- **Solapamiento de horarios**: Rangos de tiempo que se superponen
- **Solo eventos activos**: Solo considera eventos con `activo: true`

**Ejemplos de Conflictos:**
```javascript
// ❌ Conflicto: Solapamiento total
Evento existente: 09:00-10:00, días ["M", "T"]
Nuevo evento:     09:00-10:00, días ["M", "W"] → Error

// ❌ Conflicto: Solapamiento parcial  
Evento existente: 09:00-11:00, días ["M"]
Nuevo evento:     10:00-12:00, días ["M"] → Error

// ✅ Permitido: Eventos consecutivos
Evento existente: 09:00-10:00, días ["M"]
Nuevo evento:     10:00-11:00, días ["M"] → OK

// ✅ Permitido: Días diferentes
Evento existente: 09:00-10:00, días ["M"]
Nuevo evento:     09:00-10:00, días ["T"] → OK
```

**Respuesta de Error (Conflicto):**
```json
{
  "success": false,
  "error": "Validation errors",
  "details": [
    {
      "msg": "Conflicto de horarios detectado con el evento \"Reunión Matutina\" (09:00-10:00, días: M, T, W)",
      "param": "horaInicio",
      "location": "body"
    }
  ]
}
```

**Manejo en React Native:**
```javascript
// Función para manejar errores de conflicto específicamente
export const handleEventConflictError = (error) => {
  if (error.details && Array.isArray(error.details)) {
    const conflictError = error.details.find(detail => 
      detail.msg.includes('Conflicto de horarios detectado')
    );
    
    if (conflictError) {
      return {
        isConflict: true,
        message: conflictError.msg,
        suggestion: 'Intenta cambiar el horario o los días del evento'
      };
    }
  }
  
  return {
    isConflict: false,
    message: error.error || 'Error desconocido'
  };
};

// Ejemplo de uso en componente
const createEventWithConflictHandling = async (eventData) => {
  const result = await createEvent(eventData);
  
  if (!result.success) {
    const conflictInfo = handleEventConflictError(result);
    
    if (conflictInfo.isConflict) {
      Alert.alert(
        'Conflicto de Horarios',
        conflictInfo.message,
        [
          { text: 'OK', style: 'default' },
          { 
            text: 'Ver Eventos Existentes', 
            onPress: () => navigation.navigate('EventsList')
          }
        ]
      );
    } else {
      Alert.alert('Error', conflictInfo.message);
    }
  }
};
```

### Actualizar Evento

```javascript
export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await apiClient.put(`/events/${eventId}`, eventData);
    return {
      success: true,
      event: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al actualizar evento',
      details: error.response?.data?.details
    };
  }
};
```

**⚠️ Validación de Conflictos en Actualizaciones:**
- Solo verifica conflictos si se actualizan campos relacionados con horarios (`horaInicio`, `horaFin`, `diasSemana`)
- Excluye automáticamente el evento actual de la verificación de conflictos
- Si solo se actualiza el nombre u otros campos no relacionados con horarios, no se ejecuta la validación de conflictos

**Ejemplo de actualización inteligente:**
```javascript
// Actualizar solo el nombre - NO verifica conflictos
const updateEventName = async (eventId, newName) => {
  return await updateEvent(eventId, { nombreEvento: newName });
};

// Actualizar horario - SÍ verifica conflictos
const updateEventTime = async (eventId, newStartTime, newEndTime) => {
  return await updateEvent(eventId, { 
    horaInicio: newStartTime, 
    horaFin: newEndTime 
  });
};
```

### Eliminar Evento

```javascript
export const deleteEvent = async (eventId) => {
  try {
    await apiClient.delete(`/events/${eventId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al eliminar evento'
    };
  }
};
```

---

## Control del Movimiento Actual

### Establecer Movimiento Actual por Preset

```javascript
export const setCurrentMovementByPreset = async (presetName, velocidad) => {
  try {
    const response = await apiClient.post(`/movimiento-actual/${presetName}`, {
      velocidad: velocidad
    });
    return {
      success: true,
      movement: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al establecer movimiento actual'
    };
  }
};
```

### Actualizar Velocidad del Movimiento Actual

```javascript
export const updateCurrentMovementSpeed = async (velocidad) => {
  try {
    const response = await apiClient.patch('/movimiento-actual/velocidad', {
      velocidad: velocidad
    });
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al actualizar velocidad'
    };
  }
};
```

### Obtener Movimiento Actual

```javascript
export const getCurrentMovement = async () => {
  try {
    const response = await apiClient.get('/movimiento-actual');
    return {
      success: true,
      movement: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al obtener movimiento actual'
    };
  }
};
```

---

## Control del Programador (Scheduler)

### Obtener Estado del Scheduler

```javascript
export const getSchedulerStatus = async () => {
  try {
    const response = await apiClient.get('/scheduler/status');
    return {
      success: true,
      status: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al obtener estado del scheduler'
    };
  }
};
```

### Iniciar Scheduler

```javascript
export const startScheduler = async () => {
  try {
    const response = await apiClient.post('/scheduler/start');
    return {
      success: true,
      message: response.data.message,
      data: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al iniciar scheduler'
    };
  }
};
```

### Detener Scheduler

```javascript
export const stopScheduler = async () => {
  try {
    const response = await apiClient.post('/scheduler/stop');
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al detener scheduler'
    };
  }
};
```

### Configurar ESP32

```javascript
export const configureESP32 = async (ipAddress) => {
  try {
    const response = await apiClient.post('/scheduler/esp32/configure', {
      ip: ipAddress
    });
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al configurar ESP32'
    };
  }
};
```

### Ping ESP32

```javascript
export const pingESP32 = async () => {
  try {
    const response = await apiClient.get('/scheduler/esp32/ping');
    return {
      success: true,
      status: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al hacer ping al ESP32'
    };
  }
};
```

### Ejecutar Evento Inmediatamente

```javascript
export const executeEventNow = async (eventId) => {
  try {
    const response = await apiClient.post(`/scheduler/execute/${eventId}`);
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al ejecutar evento'
    };
  }
};
```

---

## Manejo de Errores

### Códigos de Estado HTTP Comunes

| Código | Significado | Acción Recomendada |
|--------|-------------|-------------------|
| 200 | Éxito | Continuar |
| 201 | Creado | Mostrar confirmación |
| 400 | Error de validación | Mostrar errores específicos |
| 401 | No autorizado | Redirigir a login |
| 403 | Prohibido | Mostrar mensaje de permisos |
| 404 | No encontrado | Mostrar error de recurso |
| 409 | Conflicto | Manejar duplicados o conflictos de horario |
| 429 | Demasiadas peticiones | Implementar retry |
| 500 | Error del servidor | Mostrar error genérico |

### Validaciones por Endpoint

#### Eventos:
- `nombreEvento`: 2-100 caracteres, requerido
- `horaInicio`: Formato HH:MM, requerido  
- `horaFin`: Formato HH:MM, requerido (debe ser posterior a horaInicio)
- `diasSemana`: Array con al menos un día, valores válidos: `Su`, `M`, `T`, `W`, `Th`, `F`, `Sa`
- `movementId`: ID del movimiento, requerido
- `enabled`: Booleano, opcional (default: true)

#### Movimientos:
- `nombre`: 2-100 caracteres, requerido
- `duracion`: Número entero positivo, requerido
- `movimiento.direccionGeneral`: "derecha" o "izquierda"
- `movimiento.horas.direccion`: "derecha" o "izquierda"
- `movimiento.horas.velocidad`: Número entre 1-100
- `movimiento.horas.angulo`: Número decimal entre 0.1-360 grados
- `movimiento.minutos.direccion`: "derecha" o "izquierda"
- `movimiento.minutos.velocidad`: Número entre 1-100
- `movimiento.minutos.angulo`: Número decimal entre 0.1-360 grados

#### Usuarios:
- `nombre`: 2-50 caracteres, requerido
- `apellidos`: 2-50 caracteres, requerido
- `correo`: Email válido, requerido
- `password`: Mínimo 6 caracteres, requerido (solo registro/login)
- `puesto`: Máximo 100 caracteres, opcional
- `rol`: "admin", "usuario" o "vip", requerido (solo creación por admin)

### Permisos por Rol

- **admin**: Acceso completo a todos los recursos
- **usuario**: Acceso estándar (limitado en gestión de usuarios)
- **vip**: Acceso especial (según necesidades del proyecto)

### Manejo Global de Errores

```javascript
export const handleApiError = (error) => {
  if (error.response) {
    // Error con respuesta del servidor
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return {
          title: 'Error de Validación',
          message: data.details ? 
            data.details.map(d => d.msg).join(', ') : 
            data.error
        };
      
      case 401:
        return {
          title: 'Sesión Expirada',
          message: 'Por favor, inicia sesión nuevamente'
        };
      
      case 403:
        return {
          title: 'Sin Permisos',
          message: 'No tienes permisos para realizar esta acción'
        };
      
      case 404:
        return {
          title: 'No Encontrado',
          message: 'El recurso solicitado no existe'
        };
      
      case 409:
        return {
          title: 'Conflicto',
          message: data.error || 'Ya existe un recurso con estos datos'
        };
      
      case 429:
        return {
          title: 'Demasiadas Peticiones',
          message: 'Has excedido el límite de peticiones. Intenta más tarde'
        };
      
      default:
        return {
          title: 'Error del Servidor',
          message: data.error || 'Ha ocurrido un error inesperado'
        };
    }
  } else if (error.request) {
    // Error de red
    return {
      title: 'Error de Conexión',
      message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet'
    };
  } else {
    // Error de configuración
    return {
      title: 'Error',
      message: 'Ha ocurrido un error inesperado'
    };
  }
};
```

---

## Endpoints de Información y Utilidades

### Health Check

```javascript
export const checkServerHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return {
      success: true,
      status: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: 'Servidor no disponible'
    };
  }
};
```

### Obtener Logs del Sistema

```javascript
export const getSystemLogs = async (limit = 100) => {
  try {
    const response = await apiClient.get(`/scheduler/logs?limit=${limit}`);
    return {
      success: true,
      logs: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al obtener logs'
    };
  }
};
```

---

## Mejores Prácticas

### 1. Gestión de Estado con Context API

```javascript
// AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { checkAuthStatus } from '../api/auth';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true
  });

  useEffect(() => {
    const initAuth = async () => {
      const authStatus = await checkAuthStatus();
      if (authStatus.isAuthenticated) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: authStatus
        });
      }
      setState(prev => ({ ...prev, loading: false }));
    };
    
    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 2. Hook Personalizado para API Calls

```javascript
// hooks/useApi.js
import { useState, useCallback } from 'react';
import { handleApiError } from '../api/client';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = useCallback(async (apiFunction, ...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction(...args);
      return result;
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo);
      return { success: false, error: errorInfo };
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, callApi, setError };
};
```

### 3. Componente de Manejo de Errores

```javascript
// components/ErrorHandler.js
import React from 'react';
import { Alert } from 'react-native';

export const ErrorHandler = ({ error, onDismiss }) => {
  if (!error) return null;

  const showAlert = () => {
    Alert.alert(
      error.title || 'Error',
      error.message,
      [
        {
          text: 'OK',
          onPress: onDismiss
        }
      ]
    );
  };

  React.useEffect(() => {
    if (error) {
      showAlert();
    }
  }, [error]);

  return null;
};
```

### 4. Implementación de Retry Logic

```javascript
// utils/retry.js
export const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      if (i === maxRetries - 1 || error.response?.status !== 429) {
        throw error;
      }
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};
```

---

## Ejemplos de Implementación

### 1. Pantalla de Login

```javascript
// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { ErrorHandler } from '../components/ErrorHandler';

export const LoginScreen = ({ navigation }) => {
  const [credentials, setCredentials] = useState({
    correo: '',
    password: ''
  });
  
  const { dispatch } = useAuth();
  const { loading, error, callApi, setError } = useApi();

  const handleLogin = async () => {
    const result = await callApi(loginUser, credentials);
    
    if (result.success) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: result
      });
      navigation.navigate('Home');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Correo electrónico"
        value={credentials.correo}
        onChangeText={(text) => setCredentials(prev => ({ ...prev, correo: text }))}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        placeholder="Contraseña"
        value={credentials.password}
        onChangeText={(text) => setCredentials(prev => ({ ...prev, password: text }))}
        secureTextEntry
      />
      
      <TouchableOpacity 
        onPress={handleLogin} 
        disabled={loading}
      >
        <Text>{loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}</Text>
      </TouchableOpacity>
      
      <ErrorHandler 
        error={error} 
        onDismiss={() => setError(null)} 
      />
    </View>
  );
};
```

### 2. Lista de Movimientos

```javascript
// screens/MovementsScreen.js
import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { getAllMovements, deleteMovement } from '../api/movements';
import { useApi } from '../hooks/useApi';

export const MovementsScreen = ({ navigation }) => {
  const [movements, setMovements] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { loading, error, callApi, setError } = useApi();

  const loadMovements = async () => {
    const result = await callApi(getAllMovements);
    if (result.success) {
      setMovements(result.movements);
    }
  };

  const handleDelete = async (movementId) => {
    const result = await callApi(deleteMovement, movementId);
    if (result.success) {
      setMovements(prev => prev.filter(m => m.id !== movementId));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMovements();
    setRefreshing(false);
  };

  useEffect(() => {
    loadMovements();
  }, []);

  const renderMovement = ({ item }) => (
    <View style={styles.movementItem}>
      <Text style={styles.movementName}>{item.nombre}</Text>
      <Text>Duración: {item.duracion}s</Text>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('EditMovement', { movement: item })}
        >
          <Text>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => handleDelete(item.id)}
        >
          <Text>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={movements}
        renderItem={renderMovement}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('CreateMovement')}
      >
        <Text>+</Text>
      </TouchableOpacity>
      
      <ErrorHandler 
        error={error} 
        onDismiss={() => setError(null)} 
      />
    </View>
  );
};
```

### 3. Control del Scheduler

```javascript
// screens/SchedulerControlScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { 
  getSchedulerStatus, 
  startScheduler, 
  stopScheduler,
  pingESP32 
} from '../api/scheduler';
import { useApi } from '../hooks/useApi';

export const SchedulerControlScreen = () => {
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [esp32Status, setEsp32Status] = useState(null);
  const { loading, error, callApi, setError } = useApi();

  const loadStatus = async () => {
    const statusResult = await callApi(getSchedulerStatus);
    if (statusResult.success) {
      setSchedulerStatus(statusResult.status);
    }

    const pingResult = await callApi(pingESP32);
    if (pingResult.success) {
      setEsp32Status(pingResult.status);
    }
  };

  const toggleScheduler = async () => {
    if (schedulerStatus?.isRunning) {
      const result = await callApi(stopScheduler);
      if (result.success) {
        setSchedulerStatus(prev => ({ ...prev, isRunning: false }));
      }
    } else {
      const result = await callApi(startScheduler);
      if (result.success) {
        setSchedulerStatus(prev => ({ ...prev, isRunning: true }));
      }
    }
  };

  useEffect(() => {
    loadStatus();
    
    // Actualizar estado cada 30 segundos
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Control del Programador</Text>
      
      <View style={styles.statusCard}>
        <Text>Estado del Scheduler:</Text>
        <Text style={[
          styles.statusText, 
          { color: schedulerStatus?.isRunning ? 'green' : 'red' }
        ]}>
          {schedulerStatus?.isRunning ? 'Activo' : 'Inactivo'}
        </Text>
        
        <Switch
          value={schedulerStatus?.isRunning || false}
          onValueChange={toggleScheduler}
          disabled={loading}
        />
      </View>

      <View style={styles.statusCard}>
        <Text>Estado del ESP32:</Text>
        <Text style={[
          styles.statusText,
          { color: esp32Status?.connected ? 'green' : 'red' }
        ]}>
          {esp32Status?.connected ? 'Conectado' : 'Desconectado'}
        </Text>
        
        {esp32Status?.ip && (
          <Text>IP: {esp32Status.ip}</Text>
        )}
      </View>

      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={loadStatus}
        disabled={loading}
      >
        <Text>{loading ? 'Actualizando...' : 'Actualizar Estado'}</Text>
      </TouchableOpacity>
      
      <ErrorHandler 
        error={error} 
        onDismiss={() => setError(null)} 
      />
    </View>
  );
};
```

---

## Notas Importantes

1. **Tokens JWT**: Los tokens tienen una validez de 24 horas. Implementa renovación automática o manejo de expiración.

2. **Rate Limiting**: La API permite máximo 1000 requests por IP cada 15 minutos. Implementa cache local cuando sea posible.

3. **Validaciones**: Todos los endpoints tienen validaciones estrictas. Revisa las respuestas de error para mostrar mensajes específicos.

4. **Conflictos de Eventos**: El sistema previene automáticamente eventos con horarios superpuestos. Maneja los errores 400 con mensaje de conflicto apropiadamente.

5. **ESP32**: El sistema requiere configuración del IP del ESP32 para funcionar correctamente. Verifica conectividad regularmente.

6. **Firestore**: Los datos se almacenan en tiempo real. Considera implementar listeners para actualizaciones en vivo.

7. **Logs**: Todas las acciones se registran. El endpoint `/scheduler/logs` proporciona información de debugging.

8. **CORS**: El backend está configurado para aceptar requests desde cualquier origen. En producción, configura dominios específicos.

9. **Health Check**: Usa `/health` para verificar el estado del servidor antes de realizar operaciones críticas.

10. **Permisos**: Respeta los roles de usuario. Solo admins pueden crear/eliminar usuarios y algunos endpoints están restringidos.

## Funcionalidades Recientes

### ✅ Validación de Conflictos de Horarios
- **Detección automática**: Previene eventos con horarios superpuestos
- **Validación inteligente**: Solo verifica conflictos cuando es necesario
- **Mensajes descriptivos**: Errores detallados con información del conflicto
- **Optimización**: Excluye el evento actual en actualizaciones

### ✅ Control Avanzado de Movimientos
- **Campo ángulo**: Control preciso del recorrido de manecillas (0.1-360°)
- **Movimientos pendulares**: Crear oscilaciones y patrones personalizados
- **Velocidad dinámica**: Actualizar velocidad sin cambiar otros parámetros

### ✅ Gestión Completa
- **CRUD completo**: Crear, leer, actualizar y eliminar para todos los recursos
- **Autenticación robusta**: JWT con roles y permisos
- **Scheduler integrado**: Control automático del ESP32 basado en eventos

Esta guía proporciona una base sólida para integrar la API de Malbouche en tu aplicación React Native. Adapta los ejemplos según las necesidades específicas de tu aplicación y siempre maneja los errores de manera apropiada para una mejor experiencia de usuario.
