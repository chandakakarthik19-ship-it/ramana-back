const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

/* ================= ADMIN AUTH ================= */
function authAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = auth.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    req.user = { id: decoded.id, role: 'admin' };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/* ================= FARMER AUTH (🔥 CRITICAL FIX) ================= */
function authFarmer(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = auth.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'farmer') {
      return res.status(403).json({ error: 'Farmer only' });
    }

    // 🔴 THIS LINE FIXES YOUR ISSUE
    // Farmer dashboard uses req.user.id
    req.user = { id: decoded.id, role: 'farmer' };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = {
  authAdmin,
  authFarmer
};
