const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Farmer = require('../models/Farmer');
const Work = require('../models/Work');
const multer = require('multer');
const { authAdmin } = require('./middleware');

const upload = multer({ dest: 'uploads/' });

/* ================= CHANGE ADMIN PASSWORD ================= */
router.post('/change-password', authAdmin, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const ok = await admin.comparePassword(oldPassword);
    if (!ok) {
      return res.status(401).json({ error: 'Old password incorrect' });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= CREATE FARMER ================= */
router.post('/farmers', authAdmin, upload.single('profile'), async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const exists = await Farmer.findOne({ phone });
    if (exists) {
      return res.status(409).json({ error: 'Farmer already exists' });
    }

    const profileImage = req.file ? `/uploads/${req.file.filename}` : null;

    const farmer = new Farmer({
      name,
      phone,
      password,
      profileImage,
      payments: []
    });

    await farmer.save();
    res.json({ success: true, farmer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= LIST FARMERS ================= */
router.get('/farmers', authAdmin, async (req, res) => {
  try {
    const list = await Farmer.find()
      .select('-password')
      .sort({ createdAt: -1 });

    // ✅ IMPORTANT FOR FRONTEND
    res.json({ success: true, farmers: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= DELETE FARMER ================= */
router.delete('/farmers/:id', authAdmin, async (req, res) => {
  try {
    await Farmer.findByIdAndDelete(req.params.id);
    await Work.deleteMany({ farmer: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= ADD WORK ================= */
router.post('/work', authAdmin, async (req, res) => {
  try {
    let { farmerId, workType, minutes, ratePer60, notes, timeStr } = req.body;

    if ((!minutes || minutes === '') && timeStr) {
      const s = String(timeStr);
      if (s.includes('.')) {
        const [h, m] = s.split('.');
        minutes = (Number(h) * 60) + Number((m || '0').padEnd(2, '0'));
      } else {
        minutes = Number(s);
      }
    }

    if (!farmerId || !workType || !minutes || !ratePer60) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const totalAmount = (minutes / 60) * Number(ratePer60);

    const work = new Work({
      farmer: farmerId,
      workType,
      minutes,
      ratePer60,
      totalAmount,
      notes,
      paymentGiven: 0
    });

    await work.save();
    res.json({ success: true, work });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= UPDATE WORK ================= */
router.put('/work/:id', authAdmin, async (req, res) => {
  try {
    const { workType, minutes, ratePer60, paymentGiven, notes } = req.body;
    const totalAmount = (minutes / 60) * Number(ratePer60 || 0);

    const work = await Work.findByIdAndUpdate(
      req.params.id,
      { workType, minutes, ratePer60, totalAmount, paymentGiven, notes },
      { new: true }
    );

    res.json({ success: true, work });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= DELETE WORK ================= */
router.delete('/work/:id', authAdmin, async (req, res) => {
  try {
    await Work.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= LIST WORK ================= */
router.get('/work', authAdmin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.farmerId) filter.farmer = req.query.farmerId;

    const list = await Work.find(filter)
      .populate('farmer', 'name phone')
      .sort({ date: -1 });

    res.json({ success: true, works: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= ADD PAYMENT ================= */
router.post('/payment/:farmerId', authAdmin, async (req, res) => {
  try {
    const { amount, workId } = req.body;

    const farmer = await Farmer.findById(req.params.farmerId);
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    // Ensure payments array exists
    if (!farmer.payments) farmer.payments = [];

    farmer.payments.push({
      amount: Number(amount),
      workId: workId || null,
      date: new Date()
    });

    await farmer.save();

    if (workId) {
      const work = await Work.findById(workId);
      if (work) {
        work.paymentGiven = (work.paymentGiven || 0) + Number(amount);
        await work.save();
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
