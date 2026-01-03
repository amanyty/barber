require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded images

// Database Connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test DB Connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error acquiring client', err.stack);
    } else {
        console.log('Database connected successfully');
        release();
    }
});

// -- Authentication Routes --

// Register
app.post('/api/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, passwordHash, role || 'customer']
        );
        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) return res.status(400).json({ error: 'User not found' });

        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.rows[0].id, role: user.rows[0].role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.rows[0].id, name: user.rows[0].name, role: user.rows[0].role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// -- Appointment Routes --

// Book Appointment
app.post('/api/appointments', async (req, res) => {
    // Ideally verify JWT here
    const { user_id, barber_id, appointment_time, service_type, notes } = req.body;

    try {
        // Check availability (simplistic check for overlapping time slot for same barber)
        // In production, you'd check a range or specific slots
        const newAppointment = await pool.query(
            'INSERT INTO appointments (customer_id, barber_id, appointment_time, service_type, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user_id, barber_id, appointment_time, service_type, notes]
        );
        res.status(201).json(newAppointment.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Time slot already booked for this barber' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Appointments (for a user)
app.get('/api/appointments/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const appointments = await pool.query(
            'SELECT a.*, b.name as barber_name FROM appointments a JOIN barbers b_profile ON a.barber_id = b_profile.id JOIN users b ON b_profile.user_id = b.id WHERE a.customer_id = $1',
            [userId]
        );
        res.json(appointments.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// -- Barbers Routes --

app.get('/api/barbers', async (req, res) => {
    try {
        const barbers = await pool.query('SELECT b.id, u.name, b.specialization, b.rating FROM barbers b JOIN users u ON b.user_id = u.id');
        res.json(barbers.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// -- Image Upload Route --

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('image'), async (req, res) => {
    const { user_id, appointment_id, image_type } = req.body;
    const image_path = req.file ? req.file.path : null;

    if (!image_path) return res.status(400).json({ error: 'No image uploaded' });

    try {
        const newImage = await pool.query(
            'INSERT INTO images (user_id, appointment_id, image_path, image_type) VALUES ($1, $2, $3, $4) RETURNING *',
            [user_id, appointment_id, image_path, image_type]
        );
        res.status(201).json(newImage.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
