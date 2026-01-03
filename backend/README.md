# Barber Shop Backend API

This is a Node.js/Express backend for the Barber Shop management system, using PostgreSQL as the database.

## Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+)

## Setup

1.  **Install Dependencies**:
    ```bash
    cd backend
    npm install
    ```

2.  **Database Setup**:
    - Create a PostgreSQL database (e.g., `barber_db`).
    - Run the schema script to create tables:
      ```bash
      psql -U postgres -d barber_db -f schema.sql
      ```

3.  **Configuration**:
    - Copy `.env.example` to `.env`:
      ```bash
      cp .env.example .env
      ```
    - Update `.env` with your database credentials.

4.  **Run Server**:
    ```bash
    # Development
    npm run dev

    # Production
    npm start
    ```

## API Endpoints

### Authentication
- `POST /api/register` - { name, email, password, role }
- `POST /api/login` - { email, password }

### Appointments
- `POST /api/appointments` - { user_id, barber_id, appointment_time, service_type, notes }
- `GET /api/appointments/:userId` - Get appointments for a specific user.

### Barbers
- `GET /api/barbers` - List all barbers.

### Enquiries
- `POST /api/enquiries` - { name, email, subject, message }

### Images
- `POST /api/upload` - Upload image (form-data: 'image').

## Security

- **Passwords**: Hashed using `bcrypt`.
- **Auth**: JWT based authentication (add `Authorization: Bearer <token>` header to protected routes).
- **Validation**: Basic SQL constraints enforced; `express-validator` recommended for request body validation.
