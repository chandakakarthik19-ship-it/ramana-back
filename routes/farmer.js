const express = require('express');
const router = express.Router();
const Farmer = require('../models/Farmer');
const Work = require('../models/Work');
const { authFarmer } = require('../middleware');

/* ================= REGISTER FARMER ================= */
router.post('/', async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const exists = await Farmer.findOne({ phone });
    if (exists) {
      return res.status(409).json({ error: 'Farmer already exists' });
    }

    const farmer = new Farmer({
      name,
      phone,
      password
    });

    await farmer.save();

    res.status(201).json({
      success: true,
      message: 'Farmer registered successfully',
      farmerId: farmer._id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================= FARMER DASHBOARD (🔥 NEW) ================= */
router.get('/dashboard', authFarmer, async (req, res) => {
  try {
    // get farmer payments
    const farmer = await Farmer.findById(req.user.id)
      .select('name phone payments');

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    // get farmer works
    const works = await Work.find({ farmer: req.user.id })
      .sort({ date: -1 });

    res.json({
      success: true,
      farmer,
      works
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
