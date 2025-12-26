const express = require('express');
const router = express.Router();
const multer = require('multer');

/* ================= MODELS ================= */
const Admin = require('../models/Admin');
const Farmer = require('../models/Farmer');
const Work = require('../models/Work');

/* ================= ✅ CRITICAL FIX =================
   Correct middleware path (THIS FIXES ROUTE NOT FOUND)
=================================================== */
const { authAdmin } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

/* ===================================================
   CHANGE ADMIN PASSWORD
=================================================== */
router.post('/change-password', authAdmin, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const ok = await admin.comparePassword(oldPassword);
    if (!ok) {
      return res.status(401).json({ error: 'Old password incorrect' });
    }

    admin.password = newPassword; // hashed by pre-save hook
    await admin.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===================================================
   CREATE FARMER
=================================================== */
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

/* ===================================================
   LIST FARMERS (MANAGE FARMER DROPDOWN)
=================================================== */
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

/* ===================================================
   DELETE FARMER (SUPPORT BOTH URLS)
=================================================== */
router.delete(['/farmers/:id', '/farmer/:id'], authAdmin, async (req, res) => {
  try {
    await Farmer.findByIdAndDelete(req.params.id);
    await Work.deleteMany({ farmer: req.params.id });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===================================================
   ADD WORK
=================================================== */
router.post('/work', authAdmin, async (req, res) => {
  try {
    let { farmerId, workType, minutes, ratePer60 } = req.body;

    if (!farmerId || !workType || !minutes || !ratePer60) {
      return res.status(400).json({ error: 'Missing fields' });
    }

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

/* ===================================================
   LIST WORK HISTORY (THIS FIXES HISTORY TABLE)
=================================================== */
router.get('/work', authAdmin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.farmerId) {
      filter.farmer = req.query.farmerId;
    }

    const works = await Work.find(filter)
      .populate('farmer', 'name phone')
      .sort({ date: -1 });

    res.json({ success: true, works });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===================================================
   DELETE WORK
=================================================== */
router.delete('/work/:id', authAdmin, async (req, res) => {
  try {
    await Work.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===================================================
   ADD PAYMENT (STORES IN MONGODB + UPDATES HISTORY)
=================================================== */
router.post('/payment/:farmerId', authAdmin, async (req, res) => {
  try {
    const { amount, workId } = req.body;
    const payAmt = Number(amount);

    if (!payAmt || payAmt <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const farmer = await Farmer.findById(req.params.farmerId);
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    // Store payment
    farmer.payments.push({
      amount: payAmt,
      workId: workId || null
    });

    farmer.totalPaid += payAmt;
    await farmer.save();

    // Update work payment
    if (workId) {
      await Work.findByIdAndUpdate(workId, {
        $inc: { paymentGiven: payAmt }
      });
    } else {
      const latestWork = await Work.findOne({ farmer: farmer._id })
        .sort({ date: -1 });

      if (latestWork) {
        latestWork.paymentGiven += payAmt;
        await latestWork.save();
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
