const express = require('express');
const router = express.Router();
const Farmer = require('../models/Farmer');

/* ================= REGISTER FARMER ================= */
router.post('/', async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // check if farmer already exists
    const exists = await Farmer.findOne({ phone });
    if (exists) {
      return res.status(409).json({ error: 'Farmer already exists' });
    }

    const farmer = new Farmer({
      name,
      phone,
      password // will be hashed automatically
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

module.exports = router;
