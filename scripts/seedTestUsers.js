require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function setTestUser(email, role) {
  const password = crypto.randomBytes(18).toString('base64url');
  const user = await User.findOne({ email }) || new User({ email, role });

  user.role = role;
  user.status = 'ACTIVE';
  user.password = password;
  await user.save();

  return password;
}

async function seedTestUsers() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test users cannot be seeded in production.');
  }

  try {
    await connectDB();

    const patientPassword = await setTestUser('patient@example.test', 'patient');
    const doctorPassword = await setTestUser('doctor@example.test', 'doctor');

    console.log('Test accounts created. Copy these credentials into the Postman collection:');
    console.log(`Patient: patient@example.test / ${patientPassword}`);
    console.log(`Doctor: doctor@example.test / ${doctorPassword}`);
  } finally {
    await mongoose.connection.close();
  }
}

seedTestUsers().catch(error => {
  console.error('Could not create test accounts:', error.message);
  process.exitCode = 1;
});