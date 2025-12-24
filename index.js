const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= ROOT ROUTE (FIX) =================
app.get('/', (req, res) => {
  res.send('🚀 Tractor Tracker Backend is Running Successfully!');
});

// ================= ENV VARIABLES =================
const MONGO_URI = process.env.MONGO_URI;   // ❌ removed hardcoded value
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// ================= MONGODB =================
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connect error', err));

// ================= MODELS =================
const Admin = require('./models/Admin');

// ================= ROUTES =================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/farmer', require('./routes/farmer'));
app.use('/api/work', require('./routes/work'));

// ================= SERVER =================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ================= DEFAULT ADMIN =================
(async () => {
  try {
    const count = await Admin.countDocuments();
    if (count === 0) {
      const a = new Admin({
        username: 'admin',
        password: 'admin123'
      });
      await a.save();
      console.log('Created default admin -> username: admin password: admin123');
    }
  } catch (e) {
    console.error(e);
  }
})();
