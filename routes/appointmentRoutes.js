const express = require('express');
const router = express.Router();
const {
  getAvailableSlots,
  getDoctorSchedule,
  bookSlot
} = require('../controllers/appointmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// مسار للمريض: استعراض المواعيد المتاحة فقط
router.get('/patient/available', authenticateToken, authorizeRoles('patient'), getAvailableSlots);

// مسار للمريض: حجز ميعاد
router.post('/patient/book', authenticateToken, authorizeRoles('patient'), bookSlot);

// مسار للدكتور: استعراض الجدول بالكامل (المحجوز والمتاح)
router.get('/doctor/schedule', authenticateToken, authorizeRoles('doctor'), getDoctorSchedule);

module.exports = router;