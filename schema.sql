-- Database Schema: Canvas Makeover (VortexDB Architecture)
-- Run this script in the Supabase SQL Editor

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('customer', 'barber', 'admin');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE enquiry_status AS ENUM ('new', 'contacted', 'converted', 'closed');
CREATE TYPE image_type AS ENUM ('before', 'after', 'portfolio');
CREATE TYPE notification_type AS ENUM ('sms', 'email', 'whatsapp');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');

-- 3. TABLES

-- table: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role user_role DEFAULT 'customer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    -- Note: Password auth is handled by Supabase Auth (auth.users). 
    -- This table is for app-specific profile data.
);

-- table: services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INT DEFAULT 30,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- table: appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id),
    service_id UUID REFERENCES services(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status appointment_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- table: enquiries (For 'Contact Us' form)
CREATE TABLE enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    service_interested TEXT,
    message TEXT,
    status enquiry_status DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- table: customer_images (Portfolio & Before/After)
CREATE TABLE customer_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id), -- Optional: if tied to specific user
    image_url TEXT NOT NULL,
    image_type image_type DEFAULT 'portfolio',
    caption TEXT,
    public_visible BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- table: notifications_log
CREATE TABLE notifications_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enquiry_id UUID REFERENCES enquiries(id),
    notification_type notification_type,
    recipient TEXT,
    status notification_status DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. INDEXES
CREATE INDEX idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX idx_enquiries_status ON enquiries(status);
CREATE INDEX idx_notifications_status ON notifications_log(status);

-- 5. ROW LEVEL SECURITY (RLS)
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_images ENABLE ROW LEVEL SECURITY;

-- Policy: Enquiries - Public Insert (for contact form), Admin Select
CREATE POLICY "Public Enquiries Insert" ON enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin Enquiries View" ON enquiries FOR SELECT USING (auth.role() = 'authenticated'); 
-- Note: accurate 'auth.role()' check depends on Supabase setup. 
-- For MVP, 'authenticated' usually means any logged in user (admin).

-- Policy: Images - Public View (if public_visible), Admin All
CREATE POLICY "Public Portfolio View" ON customer_images FOR SELECT USING (public_visible = true);
CREATE POLICY "Admin Images Manage" ON customer_images FOR ALL USING (auth.role() = 'authenticated');
