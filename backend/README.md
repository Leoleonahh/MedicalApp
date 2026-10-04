# TypeScript Backend for Medical App

This backend has been converted from Python/Flask to TypeScript/Express.js with TypeORM.

## Project Structure

```
src/
├── config/
│   ├── config.ts          # Configuration management
│   └── database.ts        # TypeORM setup
├── entities/
│   └── User.ts            # User model
├── services/
│   └── auth.service.ts    # Authentication logic
├── controllers/
│   └── auth.controller.ts # Route handlers
├── routes/
│   ├── auth.routes.ts     # Auth endpoints
│   └── predict.routes.ts  # Prediction endpoints
└── index.ts               # Main application entry point
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with database credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=1234
DB_NAME=medical_app
DB_PORT=3306
PORT=5000
NODE_ENV=development
```

3. Start the server:
```bash
npm run dev      # Development with ts-node
npm run build    # Build to dist
npm start        # Production (after build)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
  - Body: `{ "username": "user", "password": "pass" }`
  
- `POST /api/auth/login` - Login and authenticate
  - Body: `{ "username": "user", "password": "pass" }`

### Prediction
- `POST /api/predict` - Predict wound type from image
  - Form-data: `image` (file)

### Health
- `GET /health` - Check server status

## Key Features

1. **Type Safety**: Full TypeScript types
2. **Database**: TypeORM with MySQL
3. **Authentication**: bcrypt password hashing
4. **ML Integration**: Python AI models via child_process
5. **File Upload**: Multer for image handling
6. **CORS**: Enabled for frontend integration

## ML Integration

Python scripts are called from TypeScript:
1. API receives image file → temp file created
2. Python script processes image
3. Result returned as JSON
4. Temp file cleaned up

## Notes

- ML models and utilities remain in Python unchanged
- Database configuration uses environment variables
- Proper error handling and logging
- TensorFlow warnings are suppressed

## Testing

Use Postman or curl:

```bash
# Health check
curl http://localhost:5000/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"pass123"}'

# Predict (with image file)
curl -X POST http://localhost:5000/api/predict \
  -F "image=@/path/to/image.jpg"
```
