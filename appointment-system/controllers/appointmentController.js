const Appointment = require('../models/Appointment');

exports.getAvailableSlots = async (req, res) => {
  try {
    const availableSlots = await Appointment.find({ status: 'AVAILABLE' }).sort({ slotTime: 1 });
    return res.status(200).json({
      success: true,
      count: availableSlots.length,
      slots: availableSlots
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDoctorSchedule = async (req, res) => {
  try {
    const allSlots = await Appointment.find({}).sort({ slotTime: 1 });
    const bookedSlots = allSlots.filter(slot => slot.status === 'BOOKED');
    const availableSlots = allSlots.filter(slot => slot.status === 'AVAILABLE');

    return res.status(200).json({
      success: true,
      totalSlots: allSlots.length,
      bookedCount: bookedSlots.length,
      availableCount: availableSlots.length,
      schedule: {
        booked: bookedSlots,
        available: availableSlots
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.bookSlot = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const patientId = req.user.id;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'appointmentId is required.'
      });
    }

    const updatedAppointment = await Appointment.findOneAndUpdate(
      { _id: appointmentId, status: 'AVAILABLE' },
      { status: 'BOOKED', patientId },
      { returnDocument: 'after' }
    );
    if (!updatedAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This slot is either already booked or does not exist!'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment booked successfully!',
      appointment: updatedAppointment
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};