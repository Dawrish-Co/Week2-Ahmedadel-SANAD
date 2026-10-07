const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const tokenMatch = req.get('authorization')?.match(/^Bearer\s+(\S+)$/i);

  if (!tokenMatch) {
    return res.status(401).json({ success: false, message: 'Bearer token required.' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: 'JWT_SECRET is not configured.' });
  }

  try {
    const payload = jwt.verify(tokenMatch[1], process.env.JWT_SECRET);

    if (typeof payload === 'string' || typeof payload.sub !== 'string' || !payload.sub) {
      return res.status(401).json({ success: false, message: 'Invalid token claims.' });
    }

    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to access this resource.' });
    }

    return next();
  };
}

module.exports = { authenticateToken, authorizeRoles };