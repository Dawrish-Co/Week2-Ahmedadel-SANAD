require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function approveDoctor() {
  const email = (process.argv[2] || '').trim().toLowerCase();

  if (!email) {
    throw new Error('Usage: npm run approve:doctor -- doctor@example.com');
  }

  try {
    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('No account found for that email.');
    }

    user.role = 'doctor';
    user.status = 'ACTIVE';
    await user.save();
    console.log(`Doctor account approved: ${email}`);
  } finally {
    await mongoose.connection.close();
  }
}

approveDoctor().catch(error => {
  console.error('Could not approve doctor:', error.message);
  process.exitCode = 1;
});