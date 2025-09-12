# SkyMoneyBack2 - Authentication System

A NestJS application with JWT-based authentication system supporting user and admin roles.

## Features

- JWT Bearer Token Authentication
- User Registration and Login
- Role-based Access Control (USER/ADMIN)
- User Profile Management
- Admin User Approval System
- Password Hashing with bcrypt
- PostgreSQL Database Integration

## Setup

### Option 1: Docker (Recommended)

1. **Development with Docker:**
```bash
# Start PostgreSQL and PgAdmin
docker-scripts.bat dev
# or on Linux/Mac: ./docker-scripts.sh dev

# Run the app locally
npm install
npm run start:dev
```

2. **Full Production with Docker:**
```bash
# Start everything (app + database)
docker-scripts.bat prod
# or on Linux/Mac: ./docker-scripts.sh prod
```

### Option 2: Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables:
```bash
cp .env.example .env
```

3. Configure your database connection in `.env`

4. Run the application:
```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

## Docker Commands

- `docker-scripts.bat dev` - Start development environment (PostgreSQL + PgAdmin)
- `docker-scripts.bat prod` - Start production environment (App + PostgreSQL)
- `docker-scripts.bat stop` - Stop all containers
- `docker-scripts.bat logs` - Show container logs
- `docker-scripts.bat build` - Build the application
- `docker-scripts.bat clean` - Clean up containers and volumes
- `docker-scripts.bat seed` - Run database seed (create admin user)

### PgAdmin Access
When running in development mode:
- URL: http://localhost:8080
- Email: admin@skymoneyback.com
- Password: admin123

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - Logout user

### Users
- `GET /users/profile` - Get current user profile (authenticated)
- `PATCH /users/profile` - Update current user profile (authenticated)
- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get user by ID (admin only)
- `PATCH /users/:id` - Update user by ID (admin only)
- `PATCH /users/:id/approve` - Approve user (admin only)
- `DELETE /users/:id` - Delete user (admin only)

### Authentication Headers
Include the JWT token in your requests:
```
Authorization: Bearer <your-jwt-token>
```

## User Roles
- `USER` - Regular user with limited access
- `ADMIN` - Administrator with full access

## Database Schema
The system uses a comprehensive user table with fields for:
- Basic info (name, email, phone)
- Financial data (PIX, bank details, crypto addresses)
- Admin approval system
- User status management

## Environment Variables
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=skymoneyback
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=3000
```

## Example API Usage

### Register a new user
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Access protected route
```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```