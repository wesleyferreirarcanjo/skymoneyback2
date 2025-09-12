# SkyMoneyBack2 - Financial User Management System

A comprehensive NestJS application for managing users with financial data, Brazilian PIX integration, and cryptocurrency support. Features a complete user registration system with extensive financial information collection and admin approval workflow.

## Features

- **JWT Bearer Token Authentication** - Secure user authentication
- **Comprehensive User Registration** - Collects extensive user and financial data
- **Brazilian PIX Integration** - PIX key management with QR codes and copy-paste functionality
- **Cryptocurrency Support** - Bitcoin (BTC) and USDT address management
- **Bank Account Management** - Complete banking information storage
- **Role-based Access Control** - USER/ADMIN roles with different permissions
- **Admin Approval System** - Pending user approval workflow
- **User Status Management** - PENDING, ACTIVE, INACTIVE, SUSPENDED states
- **Password Hashing** - Secure password storage with bcrypt
- **PostgreSQL Database** - Robust data persistence

## Use Case
This system is designed for Brazilian financial applications that need to:
- Collect comprehensive user financial data for KYC (Know Your Customer) compliance
- Manage PIX payment integration (Brazil's instant payment system)
- Support cryptocurrency transactions (Bitcoin and USDT)
- Implement user approval workflows for financial services
- Store banking information for payment processing
- Track user status and admin approval processes

Perfect for fintech applications, payment platforms, cryptocurrency exchanges, or any service requiring extensive user financial data collection in Brazil.

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
The system uses a comprehensive user table with extensive financial data collection:

### Personal Information
- Basic info (firstName, lastName, email, phone)
- Brazilian CPF and birth date
- Address information (CEP, address, addressNumber)

### Financial Data
- **PIX Integration**: PIX key, key type, owner name, copy-paste text, QR code
- **Banking**: Bank name, agency, account number
- **Cryptocurrency**: Bitcoin (BTC) and USDT addresses with QR codes
- **Optional**: Avatar image

### System Management
- User roles (USER/ADMIN)
- User status (PENDING/ACTIVE/INACTIVE/SUSPENDED)
- Admin approval system with approval tracking
- Timestamps for creation and updates

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

### Register a new user (Complete financial data)
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "João",
    "lastName": "Silva",
    "email": "joao@example.com",
    "phone": "+5511999999999",
    "cpf": "12345678901",
    "birthDate": "1990-01-01",
    "cep": "01234-567",
    "address": "Rua das Flores, 123",
    "addressNumber": "123",
    "bank": "Banco do Brasil",
    "agency": "1234",
    "account": "12345-6",
    "pixKeyType": "CPF",
    "pixKey": "12345678901",
    "pixOwnerName": "João Silva",
    "pixCopyPaste": "00020126580014br.gov.bcb.pix...",
    "pixQrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "btcAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "btcQrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "usdtAddress": "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
    "usdtQrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "avatar": "https://example.com/avatar.jpg",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "password123"
  }'
```

### Admin approve user
```bash
curl -X PATCH http://localhost:3000/users/USER_ID/approve \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Access protected route
```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```