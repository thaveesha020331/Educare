# EduCare Backend Authentication System

## Overview
This backend provides a complete authentication system for the EduCare React Native app with MongoDB integration, JWT tokens, and role-based access control.

## Features
- ✅ User Registration (Teacher, Parent, Student roles)
- ✅ User Login with JWT tokens
- ✅ Password hashing with bcrypt
- ✅ Input validation with express-validator
- ✅ Protected routes with JWT middleware
- ✅ MongoDB integration with proper indexing
- ✅ CORS enabled for frontend communication
- ✅ Error handling and logging

## API Endpoints

### Authentication Routes

#### 1. Health Check
```
GET /health
```
**Response:**
```json
{
  "message": "Server is running!",
  "timestamp": "2025-10-12T04:18:38.015Z"
}
```

#### 2. User Registration
```
POST /api/auth/register
```
**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "teacher",
  "phone": "1234567890",
  "schoolId": "SCH001",
  "childId": "",
  "studentType": "normal"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "68eb2c3a40e8732cb1521d10",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "teacher",
    "phone": "1234567890",
    "schoolId": "SCH001",
    "childId": "",
    "studentType": null,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. User Login
```
POST /api/auth/login
```
**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "68eb2c3a40e8732cb1521d10",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "teacher",
    "phone": "1234567890",
    "schoolId": "SCH001",
    "childId": "",
    "studentType": null,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 4. Get User Profile (Protected)
```
GET /api/auth/profile
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "user": {
    "_id": "68eb2c3a40e8732cb1521d10",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "teacher",
    "phone": "1234567890",
    "schoolId": "SCH001",
    "childId": "",
    "studentType": null,
    "createdAt": "2025-10-12T04:19:06.000Z",
    "updatedAt": "2025-10-12T04:19:06.000Z"
  }
}
```

#### 5. Update User Profile (Protected)
```
PUT /api/auth/profile
Authorization: Bearer <jwt_token>
```
**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "9876543210",
  "schoolId": "SCH002"
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully"
}
```

## User Roles and Validation

### Roles
- **teacher**: Requires `schoolId`
- **parent**: Requires `childId`
- **student**: Requires `studentType` (normal/special)

### Validation Rules
- **Email**: Must be valid email format
- **Password**: Minimum 6 characters
- **Name**: Minimum 2 characters
- **Phone**: Optional string (no strict format)
- **Role**: Must be one of: teacher, parent, student
- **Student Type**: Must be one of: normal, special (only for students)

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  role: String, // 'teacher', 'parent', 'student'
  phone: String,
  schoolId: String, // required for teachers
  childId: String,  // required for parents
  studentType: String, // 'normal' or 'special' for students
  createdAt: Date,
  updatedAt: Date
}
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd Backend
npm install
```

### 2. Environment Variables
Create a `.env` file in the Backend directory:
```
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
MONGODB_URI=mongodb+srv://NewUser:veesha2025@educare.fa1yvuh.mongodb.net/?retryWrites=true&w=majority&appName=EduCare
```

### 3. Start the Server
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

### 4. Test the API
```bash
# Test health endpoint
curl http://localhost:4000/health

# Test registration
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"teacher","schoolId":"SCH001"}'

# Test login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Frontend Integration

The frontend has been updated with:
- `src/services/auth.js` - Authentication service with all API calls
- Updated `src/screens/AuthScreen.js` - Connected to backend API
- AsyncStorage integration for token management
- Form validation matching backend requirements

### Frontend Usage Example
```javascript
import { AuthService } from '../services/auth';

// Register a new user
const response = await AuthService.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  role: 'teacher',
  schoolId: 'SCH001'
});

// Login user
const loginResponse = await AuthService.login('john@example.com', 'password123');

// Get user profile
const profile = await AuthService.getProfile();

// Check if user is authenticated
const isAuth = await AuthService.isAuthenticated();
```

## Security Features
- Password hashing with bcrypt (12 salt rounds)
- JWT tokens with 7-day expiration
- Input validation and sanitization
- CORS protection
- Error handling without sensitive data exposure

## Error Handling
All endpoints return consistent error responses:
```json
{
  "message": "Error description",
  "errors": [] // Validation errors (if applicable)
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created (registration)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (invalid token)
- `404` - Not Found
- `500` - Internal Server Error

## Testing Status
✅ Health endpoint working
✅ Registration endpoint working
✅ Login endpoint working
✅ JWT token generation working
✅ MongoDB connection working
✅ Frontend integration complete

