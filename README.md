# Malbouche Backend API

Backend for the Malbouche application using Express.js and Firebase Firestore.

## 🚀 Features

- **JWT Authentication**: Secure registration and login with bcrypt
- **Firestore Database**: Scalable cloud storage
- **Robust Validation**: Input validation with express-validator
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Logging system with Winston
- **Documentation**: Swagger/OpenAPI 3.0

## 📁 Project Structure

```
backend/
├── controllers/          # Business logic
│   ├── authController.js
│   ├── usersController.js
│   ├── movementsController.js
│   └── eventsController.js
├── routes/               # Route definitions
│   ├── auth.js
│   ├── users.js
│   ├── movements.js
│   └── events.js
├── middleware/           # Custom middlewares
│   ├── auth.js
│   ├── validation.js
│   └── errorHandler.js
├── services/             # External services
│   ├── firebase.js
│   └── logger.js
├── swagger.json          # API documentation
├── index.js             # Entry point
└── package.json         # Dependencies
```

## 🔧 Configuration

### 1. Environment Variables

Create a `.env` file in the project root:

```env
# Server port
PORT=3000

# JWT Secret for signing tokens
JWT_SECRET=your_very_secure_jwt_secret_here

# Firebase credentials as JSON string
FIREBASE_CREDENTIALS={"type":"service_account","project_id":"your-project-id",...}

# CORS configuration
CORS_ORIGIN=*

# Logging configuration
LOG_LEVEL=info

# Environment
NODE_ENV=production
```

### 2. Firebase Configuration

#### Option A: Environment Variable (Recommended for production)

1. Go to Firebase console → Project settings → Service accounts
2. Generate a new private key and download the JSON file
3. Convert the complete JSON to a single line and place it in `FIREBASE_CREDENTIALS`

Example:
```env
FIREBASE_CREDENTIALS={"type":"service_account","project_id":"malbouche-ad977","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"...","universe_domain":"googleapis.com"}
```

### 3. Installation and Execution

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Run in production
npm start
```

## 📊 Firestore Structure

### Collections

#### `users`
```javascript
{
  name: "John",
  lastName: "Doe",
  email: "john@example.com",
  passwordHash: "bcrypt_hash",
  position: "Developer",
  role: "user", // admin, user, guest
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

#### `movements`
```javascript
{
  name: "Left Movement",
  movementType: "left", // right, left, swing, crazy, normal, custom
  speed: 75, // 1-100
  duration: 30, // seconds
  createdAt: "2024-01-01T00:00:00.000Z",
  createdBy: "user_id"
}
```

#### `events`
```javascript
{
  eventName: "Morning Event",
  startTime: "09:00",
  endTime: "10:00",
  weekDays: ["monday", "tuesday", "wednesday"],
  movementType: "swing",
  active: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  createdBy: "user_id"
}
```

#### `logs`
```javascript
{
  userId: "user_id",
  action: "create_event",
  result: "success",
  timestamp: "2024-01-01T00:00:00.000Z",
  details: { eventCreated: "event_id" }
}
```

## 🔐 Authentication

### Registration
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "position": "Developer"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Using the Token
```bash
GET /api/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🛡️ Roles and Permissions

- **admin**: Full access to all functions
- **user**: Can create/edit their own resources
- **guest**: Read-only access

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login

### Users
- `GET /api/users` - List users (admin)
- `POST /api/users` - Create user (admin)
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin)

### Movements
- `GET /api/movements` - List movements
- `POST /api/movements` - Create movement
- `PUT /api/movements/:id` - Update movement
- `DELETE /api/movements/:id` - Delete movement

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

## 🚀 Deployment on Render

### 1. Preparation

1. Upload your code to GitHub
2. Connect your repository to Render
3. Configure environment variables in Render

### 2. Environment Variables in Render

In the Render dashboard, configure:

```
PORT=3000
NODE_ENV=production
JWT_SECRET=your_very_secure_jwt_secret
FIREBASE_CREDENTIALS={"type":"service_account",...}
LOG_LEVEL=info
```

### 3. Build Configuration

Render will automatically detect that it's a Node.js project and use:

- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 4. Health Check

The `/health` endpoint is available for monitoring:

```bash
GET /health
```

Response:
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

## 📖 Documentation

- **Swagger UI**: Available at `/docs`
- **Postman Collection**: Import `swagger.json` into Postman
- **Health Check**: `/health`

## 🔍 Troubleshooting

### Error: "FIREBASE_CREDENTIALS not found"
- Verify that the variable is defined in `.env` or in Render
- Make sure the JSON is on a single line

### Error: "Missing fields in credentials"
- Verify that the Firebase JSON contains all required fields
- Download credentials again from Firebase

### Error: "Invalid token"
- Verify that the JWT token hasn't expired
- Make sure to include `Bearer ` before the token

## 🤝 Contributing

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is under the MIT License - see the [LICENSE](LICENSE) file for details.