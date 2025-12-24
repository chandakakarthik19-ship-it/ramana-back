const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Farmer = require('../models/Farmer');

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

/* ================= ADMIN LOGIN ================= */
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const ok = await admin.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================= FARMER LOGIN ================= */
router.post('/farmer/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const farmer = await Farmer.findOne({ phone });
    if (!farmer) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await farmer.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: farmer._id, role: 'farmer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      farmerId: farmer._id,
      name: farmer.name
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
