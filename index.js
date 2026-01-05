const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors({
  origin: "*", // allow Vercel frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ================= PING ROUTE (KEEP ALIVE) ================= */
app.get('/ping', (req, res) => {
  res.status(200).send('✅ Server is awake');
});

/* ================= ROOT ROUTE ================= */
app.get('/', (req, res) => {
  res.send('🚀 Tractor Tracker Backend is Running Successfully!');
});

/* ================= ENV VARIABLES ================= */
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is missing in .env file');
  process.exit(1);
}

/* ================= MONGODB CONNECTION ================= */
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

/* ================= MODELS ================= */
const Admin = require('./models/Admin');

/* ================= ROUTES ================= */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/farmer', require('./routes/farmer'));
app.use('/api/work', require('./routes/work'));

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

/* ================= CREATE DEFAULT ADMIN ================= */
(async () => {
  try {
    const count = await Admin.countDocuments();
    if (count === 0) {
      const admin = new Admin({
        username: 'admin',
        password: 'admin123'
      });
      await admin.save();
      console.log('✅ Default admin created');
      console.log('👉 username: admin');
      console.log('👉 password: admin123');
    }
  } catch (err) {
    console.error('❌ Default admin creation failed:', err.message);
  }
})();
