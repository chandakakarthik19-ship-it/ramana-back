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

    res.json({ success: true, token });
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
      success: true,
      token,
      farmerId: farmer._id,
      name: farmer.name
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= FORGOT PASSWORD (ADMIN PASSWORD REQUIRED) ================= */
router.post('/farmer/forgot-password', async (req, res) => {
  try {
    const { phone, newPassword, adminPassword } = req.body;

    if (!phone || !newPassword || !adminPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // 🔐 Verify Admin Password
    const admin = await Admin.findOne({});
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const adminOk = await admin.comparePassword(adminPassword);
    if (!adminOk) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    // 👨‍🌾 Find Farmer
    const farmer = await Farmer.findOne({ phone });
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    // 🔄 Update Farmer Password
    farmer.password = newPassword;
    await farmer.save();

    res.json({
      success: true,
      message: 'Farmer password changed successfully'
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
