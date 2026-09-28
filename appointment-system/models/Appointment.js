const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  slotTime: {
    type: Date,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'BOOKED'],
    default: 'AVAILABLE'
  },
  patientId: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);