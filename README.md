# Backend Malbouche

Backend para la aplicación Malbouche usando Express.js y Firebase Realtime Database.

## Configuración

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Firebase

#### Opción A: Usando archivo .env (Recomendado para desarrollo)
1. Copia el archivo `.env.example` a `.env`
2. Obtén las credenciales de Firebase desde la consola de Firebase:
   - Ve a Configuración del proyecto > Cuentas de servicio
   - Genera una nueva clave privada
   - Descarga el archivo JSON
3. Convierte el JSON a una sola línea y colócalo en `FIREBASE_CREDENTIALS`

#### Opción B: Usando archivo JSON
1. Descarga las credenciales de Firebase como archivo JSON
2. Renómbralo a `firebase-credentials.json`
3. Colócalo en la carpeta `backend/`

### 3. Variables de entorno requeridas

```env
PORT=3000
FIREBASE_DB_URL=https://your-project-id-default-rtdb.firebaseio.com/
FIREBASE_CREDENTIALS={"type":"service_account",...}
```

### 4. Ejecutar el servidor
```bash
npm start
```

## Estructura del proyecto

```
backend/
├── controllers/          # Controladores de rutas
├── routes/              # Definición de rutas
├── jobs/                # Tareas programadas
├── utils/               # Utilidades
├── firebase.js          # Configuración de Firebase
├── index.js            # Punto de entrada
└── package.json        # Dependencias
```

## API Endpoints

- `GET /events` - Obtener todos los eventos
- `POST /events` - Crear un nuevo evento

## Solución de problemas

### Error: "Expected property name or '}' in JSON"
- Verifica que `FIREBASE_CREDENTIALS` sea un JSON válido en una sola línea
- Asegúrate de que no haya caracteres especiales o saltos de línea
- Usa el archivo `firebase-credentials.json` como alternativa

### Error: "FIREBASE_CREDENTIALS no encontrada"
- Verifica que el archivo `.env` exista en la carpeta `backend/`
- Asegúrate de que la variable esté definida correctamente

### Error de conexión a Firebase
- Verifica que `FIREBASE_DB_URL` sea correcta
- Confirma que las credenciales tengan los permisos necesarios