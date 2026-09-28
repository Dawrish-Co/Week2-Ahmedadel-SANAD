const jwt = require('jsonwebtoken');
const User = require('../models/User');

function createAccessToken(user) {
  return jwt.sign(
    { role: user.role },
    process.env.JWT_SECRET,
    { subject: user._id.toString(), expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
}

function toPublicUser(user) {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    status: user.status
  };
}

exports.register = async (req, res) => {
  const { email, password, role = 'patient' } = req.body || {};

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ success: false, message: 'A valid email is required.' });
  }

  if (typeof password !== 'string' || password.length < 12) {
    return res.status(400).json({ success: false, message: 'Password must be at least 12 characters.' });
  }

  if (!['patient', 'doctor'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be patient or doctor.' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: 'JWT_SECRET is not configured.' });
  }

  try {
    const user = await User.create({
      email: email.trim().toLowerCase(),
      password,
      role,
      status: role === 'doctor' ? 'PENDING' : 'ACTIVE'
    });

    if (user.status === 'PENDING') {
      return res.status(202).json({
        success: true,
        message: 'Doctor account registered and is waiting for approval.',
        user: toPublicUser(user)
      });
    }

    return res.status(201).json({
      success: true,
      accessToken: createAccessToken(user),
      user: toPublicUser(user)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    console.error('Registration error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not complete registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: 'JWT_SECRET is not configured.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status === 'PENDING') {
      return res.status(403).json({ success: false, message: 'Doctor account is waiting for approval.' });
    }

    return res.status(200).json({
      success: true,
      accessToken: createAccessToken(user),
      user: toPublicUser(user)
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not complete login.' });
  }
};