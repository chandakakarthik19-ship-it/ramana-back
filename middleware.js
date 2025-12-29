const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

/* =====================================================
   ADMIN AUTH MIDDLEWARE
===================================================== */
function authAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access only' });
    }

    // attach admin info to request
    req.user = {
      id: decoded.id,
      role: 'admin'
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/* =====================================================
   FARMER AUTH MIDDLEWARE
===================================================== */
function authFarmer(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'farmer') {
      return res.status(403).json({ error: 'Farmer access only' });
    }

    // attach farmer info to request
    req.user = {
      id: decoded.id,
      role: 'farmer'
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = {
  authAdmin,
  authFarmer
};

