const express = require('express');
const router = express.Router();
const multer = require('multer');

/* ================= MODELS ================= */
const Admin = require('../models/Admin');
const Farmer = require('../models/Farmer');
const Work = require('../models/Work');
const Expense = require('../models/Expense'); // ✅ NEW

/* ================= AUTH MIDDLEWARE ================= */
const { authAdmin } = require('../middleware');

/* ================= FILE UPLOAD ================= */
const upload = multer({ dest: 'uploads/' });

/* =====================================================
   CHANGE ADMIN PASSWORD
===================================================== */
router.post('/change-password', authAdmin, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      return res.status(400).json({ error: 'Missing fields' });

    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const ok = await admin.comparePassword(oldPassword);
    if (!ok) return res.status(401).json({ error: 'Old password incorrect' });

    admin.password = newPassword;
    await admin.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   VERIFY ADMIN PASSWORD
===================================================== */
router.post('/verify-password', authAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.json({ success: false });

    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.json({ success: false });

    const ok = await admin.comparePassword(password);
    res.json({ success: ok });
  } catch {
    res.json({ success: false });
  }
});

/* =====================================================
   CREATE FARMER
===================================================== */
router.post('/farmers', authAdmin, upload.single('profile'), async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password)
      return res.status(400).json({ error: 'Missing fields' });

    const exists = await Farmer.findOne({ phone });
    if (exists) return res.status(409).json({ error: 'Farmer already exists' });

    const farmer = new Farmer({
      name,
      phone,
      password,
      profileImage: req.file ? `/uploads/${req.file.filename}` : null
    });

    await farmer.save();
    res.json({ success: true, farmer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   LIST FARMERS
===================================================== */
router.get('/farmers', authAdmin, async (req, res) => {
  try {
    const farmers = await Farmer.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ success: true, farmers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   DELETE FARMER + WORKS
===================================================== */
router.delete('/farmers/:id', authAdmin, async (req, res) => {
  try {
    await Farmer.findByIdAndDelete(req.params.id);
    await Work.deleteMany({ farmer: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   ADD WORK
===================================================== */
router.post('/work', authAdmin, async (req, res) => {
  try {
    let { farmerId, workType, minutes, ratePer60 } = req.body;
    if (!farmerId || !workType || !minutes || !ratePer60)
      return res.status(400).json({ error: 'Missing fields' });

    minutes = Number(minutes);
    ratePer60 = Number(ratePer60);
    const totalAmount = (minutes / 60) * ratePer60;

    const work = new Work({
      farmer: farmerId,
      workType,
      minutes,
      ratePer60,
      totalAmount,
      paymentGiven: 0
    });

    await work.save();
    res.json({ success: true, work });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   UPDATE WORK
===================================================== */
router.put('/work/:id', authAdmin, async (req, res) => {
  try {
    const { workType, minutes, ratePer60 } = req.body;
    const work = await Work.findById(req.params.id);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    work.workType = workType;
    work.minutes = Number(minutes);
    work.ratePer60 = Number(ratePer60);
    work.totalAmount = (work.minutes / 60) * work.ratePer60;

    await work.save();
    res.json({ success: true, work });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   LIST WORK HISTORY
===================================================== */
router.get('/work', authAdmin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.farmerId) filter.farmer = req.query.farmerId;

    const works = await Work.find(filter)
      .populate('farmer', 'name phone')
      .sort({ date: -1 });

    res.json({ success: true, works });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   DELETE WORK
===================================================== */
router.delete('/work/:id', authAdmin, async (req, res) => {
  try {
    await Work.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   ADD PAYMENT
===================================================== */
router.post('/payment/:farmerId', authAdmin, async (req, res) => {
  try {
    const payAmt = Number(req.body.amount);
    if (!payAmt || payAmt <= 0)
      return res.status(400).json({ error: 'Invalid amount' });

    const farmer = await Farmer.findById(req.params.farmerId);
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });

    farmer.payments.push({ amount: payAmt });
    await farmer.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   DELETE PAYMENT
===================================================== */
router.delete('/payment/:farmerId/:paymentId', authAdmin, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.farmerId);
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });

    farmer.payments = farmer.payments.filter(
      p => p._id.toString() !== req.params.paymentId
    );
    await farmer.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   🚜 TRACTOR EXPENSES (NEW FEATURE)
===================================================== */

/* ADD EXPENSE */
router.post('/expenses', authAdmin, async (req, res) => {
  try {
    const { type, amount } = req.body;
    if (!type || !amount)
      return res.status(400).json({ error: 'Missing fields' });

    await Expense.create({ type, amount: Number(amount) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* LIST EXPENSES */
router.get('/expenses', authAdmin, async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json({ success: true, expenses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* DELETE EXPENSE (OPTIONAL BUT USEFUL) */
router.delete('/expenses/:id', authAdmin, async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
