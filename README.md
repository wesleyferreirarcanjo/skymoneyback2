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
- **User Status Management** - PENDING, ACTIVE, INACTIVE, SUSPENDED, APPROVED states
- **Auto Admin Creation** - Admin user automatically created on application startup
- **Password Hashing** - Secure password storage with bcrypt
- **Queue Management System** - Complete donation queue management with position tracking
- **Receiver Management** - Track and manage current donation receivers
- **Queue Statistics** - Comprehensive queue analytics and reporting
- **Admin-Only Queue Management** - Only administrators can add users to donation queues
- **CORS Configuration** - Full CORS support for cross-origin requests
- **PostgreSQL Database** - Robust data persistence

## Use Case
This system is designed for Brazilian financial applications that need to:
- Collect comprehensive user financial data for KYC (Know Your Customer) compliance
- Manage PIX payment integration (Brazil's instant payment system)
- Support cryptocurrency transactions (Bitcoin and USDT)
- Implement user approval workflows for financial services
- Store banking information for payment processing
- Track user status and admin approval processes
- Manage donation queues with position tracking and receiver management
- Implement fair distribution systems for donations or benefits
- Track user participation in donation events

Perfect for fintech applications, payment platforms, cryptocurrency exchanges, donation platforms, or any service requiring extensive user financial data collection and queue management in Brazil.

## Test Data Generation

The system includes a test data generation feature that creates 98 variations of user data for testing purposes. This feature excludes the following fields as requested:
- `pixQrCode`
- `btcQrCode` 
- `usdtQrCode`
- `adminApproved`
- `status`
- `role`

### Usage

To generate test data when starting the application, use the `--generate-test-data` flag:

```bash
# Development with test data generation
npm run start:dev -- --generate-test-data

# Production with test data generation
npm run start:prod:test-data
```

### Generated Data

The system will create 98 test users with:
- Unique emails (user1@test.com, user2@test.com, etc.)
- Unique phone numbers (11999990001, 11999990002, etc.)
- Unique CPF numbers (00000000001, 00000000002, etc.)
- Varied first names and last names from predefined lists
- Different banks, PIX key types, and addresses
- Unique Bitcoin and USDT addresses
- All users will have `role: USER`, `status: APPROVED`, and `adminApproved: true`

The generation process logs progress every 10 users and provides a final summary of successful creations and any errors.

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
# Create .env file with your database configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=skymoneyback
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_SYNC=true
JWT_SECRET=your-secret-key-here
NODE_ENV=development
PORT=3000
```

3. Test your database connection:
```bash
npm run db:test
```

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

### Database Management
- `npm run db:test` - Test database connection and show configuration
- `npm run seed` - Run database seed (create admin user)
- `GET /health` - Health check endpoint with database status

### Default Admin User
The application automatically creates an admin user on startup:
- **Email**: admin@skymoney.com
- **Password**: admin123456
- **Role**: ADMIN
- **Status**: APPROVED
- **PIX Key**: admin@skymoney.com
- **Admin Approved**: true

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
- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get user by ID (admin only)
- `PATCH /users/:id` - Update user by ID (admin only - can modify any field)
- `PATCH /users/:id/approve` - Approve user (admin only)
- `DELETE /users/:id` - Delete user (admin only)

### Queue Management
- `POST /queue` - Add user to donation queue (admin only)
- `GET /queue` - Get all queue entries (admin only)
- `GET /queue/donation/:donationNumber` - Get queue for specific donation count
- `GET /queue/my-queues` - Get current user's queue entries
- `GET /queue/stats/:donationNumber` - Get queue statistics for donation count
- `GET /queue/position/:donationNumber` - Get user's position in specific donation count queue
- `GET /queue/current-receiver/:donationNumber` - Get current receiver for donation count
- `GET /queue/:id` - Get specific queue entry by ID
- `PATCH /queue/:id` - Update queue entry (admin only)
- `PATCH /queue/reorder/:donationNumber` - Reorder queue positions (admin only)
- `PATCH /queue/swap` - Swap positions between two users in queue (admin only)
- `DELETE /queue/:id` - Remove queue entry (admin only)
- `DELETE /queue/leave/:donationNumber` - Leave specific donation count queue

### Authentication Headers
Include the JWT token in your requests:
```
Authorization: Bearer <your-jwt-token>
```

## User Roles & Access Control
- `USER` - Regular user with read-only access
  - Can only view their own profile
  - Cannot modify any user data
  - Cannot access other users' data
  - Cannot add users to donation queues
  - Can view their own queue positions and leave queues
- `ADMIN` - Administrator with full access
  - Can modify any user data including sensitive fields
  - Can approve/reject users
  - Can delete users
  - Can add users to donation queues
  - Can manage all queue operations
  - Full access to all endpoints
  - Can modify any field of any user

### Data Modification Policy
**ONLY ADMINS** can modify user data and manage donation queues. Regular users have read-only access to their own profile and can only leave queues they're already in.

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

### Queue Management
- **Queue Entries**: Track user positions in donation queues
- **Position Management**: Sequential position tracking (1, 2, 3, etc.)
- **Donation Events**: Organize queues by donation count (number of donations received)
- **Receiver Tracking**: Current receiver flag for each donation round
- **Passed Users**: Track users who were skipped in queue
- **User Relations**: Foreign key relationships to user data

## Environment Variables
```bash
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=skymoneyback
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_SYNC=true

# JWT Configuration
JWT_SECRET=your-secret-key-here

# Application Configuration
NODE_ENV=development
PORT=3000
```

### Environment Variables Description
- `DATABASE_HOST` - PostgreSQL server host (default: localhost)
- `DATABASE_PORT` - PostgreSQL server port (default: 5432)
- `DATABASE_NAME` - Database name (default: skymoneyback)
- `DATABASE_USER` - Database username (default: postgres)
- `DATABASE_PASSWORD` - Database password (default: password)
- `DATABASE_SYNC` - Enable/disable database synchronization (default: true for development)
- `JWT_SECRET` - Secret key for JWT token signing
- `NODE_ENV` - Application environment (development/production)
- `PORT` - Application port (default: 3000)

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

## Queue Management API Examples

**Note**: The `donation_number` field represents the count of donations received (e.g., 5 means this is the 5th donation round). This organizes queues by donation rounds rather than arbitrary identifiers.

### Add user to donation queue (Admin only)
```bash
curl -X POST http://localhost:3000/queue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "position": 1,
    "donation_number": 5,
    "user_id": "USER_UUID_HERE"
  }'
```

**Response:**
```json
{
  "id": "queue-uuid-here",
  "position": 1,
  "donation_number": 5,
  "is_receiver": false,
  "passed_user_ids": [],
  "user_id": "USER_UUID_HERE",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z",
  "user": {
    "id": "USER_UUID_HERE",
    "firstName": "João",
    "lastName": "Silva",
    "email": "joao@example.com"
  }
}
```

**Note:** If the specified position already exists but has an empty `user_id` (from a previously removed user), the new user will be added to that existing position by updating the queue entry instead of creating a new one.

### Get queue for specific donation count
```bash
curl -X GET http://localhost:3000/queue/donation/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
[
  {
    "id": "queue-uuid-1",
    "position": 1,
    "donation_number": 5,
    "is_receiver": true,
    "passed_user_ids": [],
    "user_id": "USER_UUID_1",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "user": {
      "id": "USER_UUID_1",
      "firstName": "João",
      "lastName": "Silva",
      "email": "joao@example.com"
    }
  },
  {
    "id": "queue-uuid-2",
    "position": 2,
    "donation_number": 5,
    "is_receiver": false,
    "passed_user_ids": [],
    "user_id": "USER_UUID_2",
    "created_at": "2024-01-15T10:35:00.000Z",
    "updated_at": "2024-01-15T10:35:00.000Z",
    "user": {
      "id": "USER_UUID_2",
      "firstName": "Maria",
      "lastName": "Santos",
      "email": "maria@example.com"
    }
  }
]
```

### Get my queue entries
```bash
curl -X GET http://localhost:3000/queue/my-queues \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
[
  {
    "id": "queue-uuid-1",
    "position": 1,
    "donation_number": 5,
    "is_receiver": true,
    "passed_user_ids": [],
    "user_id": "USER_UUID_HERE",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
]
```

### Get queue statistics
```bash
curl -X GET http://localhost:3000/queue/stats/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "totalUsers": 5,
  "currentReceiver": {
    "id": "queue-uuid-1",
    "position": 1,
    "donation_number": 5,
    "is_receiver": true,
    "passed_user_ids": [],
    "user_id": "USER_UUID_1",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "user": {
      "id": "USER_UUID_1",
      "firstName": "João",
      "lastName": "Silva",
      "email": "joao@example.com"
    }
  },
  "nextInLine": {
    "id": "queue-uuid-2",
    "position": 2,
    "donation_number": 5,
    "is_receiver": false,
    "passed_user_ids": [],
    "user_id": "USER_UUID_2",
    "created_at": "2024-01-15T10:35:00.000Z",
    "updated_at": "2024-01-15T10:35:00.000Z",
    "user": {
      "id": "USER_UUID_2",
      "firstName": "Maria",
      "lastName": "Santos",
      "email": "maria@example.com"
    }
  }
}
```

### Get my position in queue
```bash
curl -X GET http://localhost:3000/queue/position/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "position": 3
}
```


### Reorder queue positions (Admin only)
```bash
curl -X PATCH http://localhost:3000/queue/reorder/5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '[
    {"id": "queue-uuid-2", "position": 1},
    {"id": "queue-uuid-1", "position": 2},
    {"id": "queue-uuid-3", "position": 3}
  ]'
```

**Response:**
```json
[
  {
    "id": "queue-uuid-2",
    "position": 1,
    "donation_number": 5,
    "is_receiver": true,
    "passed_user_ids": [],
    "user_id": "USER_UUID_2",
    "created_at": "2024-01-15T10:35:00.000Z",
    "updated_at": "2024-01-15T11:10:00.000Z",
    "user": {
      "id": "USER_UUID_2",
      "firstName": "Maria",
      "lastName": "Santos",
      "email": "maria@example.com"
    }
  },
  {
    "id": "queue-uuid-1",
    "position": 2,
    "donation_number": 5,
    "is_receiver": false,
    "passed_user_ids": [],
    "user_id": "USER_UUID_1",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T11:10:00.000Z",
    "user": {
      "id": "USER_UUID_1",
      "firstName": "João",
      "lastName": "Silva",
      "email": "joao@example.com"
    }
  },
  {
    "id": "queue-uuid-3",
    "position": 3,
    "donation_number": 5,
    "is_receiver": false,
    "passed_user_ids": [],
    "user_id": "USER_UUID_3",
    "created_at": "2024-01-15T10:40:00.000Z",
    "updated_at": "2024-01-15T11:10:00.000Z",
    "user": {
      "id": "USER_UUID_3",
      "firstName": "Pedro",
      "lastName": "Costa",
      "email": "pedro@example.com"
    }
  }
]
```

### Remove queue entry (Admin only)
```bash
curl -X DELETE http://localhost:3000/queue/QUEUE_UUID_HERE \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "User successfully removed from queue"
}
```

**Note:** When a user is removed from the queue, the queue entry is not deleted. Instead, the `user_id` is set to `null` and the removed user's ID is added to the `passed_user_ids` array for tracking purposes. Duplicate user IDs are allowed in `passed_user_ids` to track multiple removals of the same user.

### Leave a donation queue
```bash
curl -X DELETE http://localhost:3000/queue/leave/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Successfully left the donation queue"
}
```

### Get current receiver for donation
```bash
curl -X GET http://localhost:3000/queue/current-receiver/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "id": "queue-uuid-2",
  "position": 1,
  "donation_number": 5,
  "is_receiver": true,
  "passed_user_ids": ["USER_UUID_1"],
  "user_id": "USER_UUID_2",
  "created_at": "2024-01-15T10:35:00.000Z",
  "updated_at": "2024-01-15T11:00:00.000Z",
  "user": {
    "id": "USER_UUID_2",
    "firstName": "Maria",
    "lastName": "Santos",
    "email": "maria@example.com"
  }
}
```

## Queue Management Features

### Key Capabilities
- **Position Tracking**: Sequential position management (1, 2, 3, etc.)
- **Donation Events**: Organize multiple donation queues by donation number
- **Receiver Management**: Track current receiver and move to next
- **Passed Users**: Keep track of users who were skipped
- **Queue Statistics**: Get comprehensive queue analytics
- **Admin Controls**: Full administrative control over queue management
- **Admin-Only Queue Creation**: Only administrators can add users to donation queues
- **User Self-Service**: Users can view their positions and leave queues

### Queue States
- **Position**: Sequential number indicating user's place in queue
- **is_receiver**: Boolean flag indicating if user is currently receiving
- **passed_user_ids**: Array of user IDs who previously held this position (duplicates allowed for multiple removals)
- **donation_number**: Number of donations received (count) - organizes queues by donation round

### Error Handling
- **409 Conflict**: User already in queue, position already taken
- **404 Not Found**: Queue entry not found, user not in queue
- **400 Bad Request**: Invalid position data, non-sequential positions
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: Insufficient permissions for admin-only operations