-- Database Schema for Barber Shop Management System
-- Database: PostgreSQL

-- Users Table
-- Stores all user roles: 'customer', 'barber', 'admin'
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) CHECK (role IN ('customer', 'barber', 'admin')) DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Barbers Table
-- Extended profile information for barbers (linked to users table for login info)
CREATE TABLE barbers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(100),
    bio TEXT,
    rating DECIMAL(3, 2) DEFAULT 5.00,
    available_slots JSONB DEFAULT '[]'::jsonb -- Stores weekly availability schedule
);

-- Appointments Table
-- Manages bookings
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    barber_id INTEGER REFERENCES barbers(id) ON DELETE SET NULL,
    appointment_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
    service_type VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT no_overlapping_appointments UNIQUE (barber_id, appointment_time)
);

-- Images Table
-- Stores references to uploaded images (before/after photos)
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    image_path VARCHAR(255) NOT NULL,
    image_type VARCHAR(20) CHECK (image_type IN ('profile', 'before', 'after')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX idx_appointments_time ON appointments(appointment_time);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_barber ON appointments(barber_id);
CREATE INDEX idx_users_email ON users(email);
