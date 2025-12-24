const express = require('express');
const router = express.Router();
const Work = require('../models/Work');
const Farmer = require('../models/Farmer');
const { authAdmin, authFarmer } = require('./middleware');

/* ================= ADD WORK (ADMIN ONLY) ================= */
router.post('/add', authAdmin, async (req, res) => {
  try {
    const { farmerId, workType, minutes, ratePer60, date } = req.body;

    if (!farmerId || !workType || !minutes || !ratePer60) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const totalAmount = (minutes / 60) * Number(ratePer60);

    const work = new Work({
      farmer: farmerId,
      workType,
      minutes,
      ratePer60,
      totalAmount,
      date: date || new Date()
    });

    await work.save();

    res.status(201).json({
      success: true,
      message: 'Work added successfully',
      work
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================= FARMER WORK HISTORY (FARMER ONLY) ================= */
router.get('/my', authFarmer, async (req, res) => {
  try {
    // 🔴 CRITICAL: req.user.id comes from authFarmer middleware
    const works = await Work.find({ farmer: req.user.id })
      .sort({ date: -1 });

    res.json({
      success: true,
      works
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================= ADMIN VIEW ALL WORK ================= */
router.get('/', authAdmin, async (req, res) => {
  try {
    const works = await Work.find()
      .populate('farmer', 'name phone')
      .sort({ date: -1 });

    res.json({
      success: true,
      works
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ================= ADMIN DELETE WORK ================= */
router.delete('/:id', authAdmin, async (req, res) => {
  try {
    await Work.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
