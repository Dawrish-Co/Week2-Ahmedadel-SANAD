const mongoose = require('mongoose');
const assert = require('node:assert/strict');
const Appointment = require('./models/Appointment');
const { getAvailableSlots, bookSlot, getDoctorSchedule } = require('./controllers/appointmentController');

function createMockResponse() {
  return {
    statusCode: null,
    data: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  };
}

async function runFlowTest() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/appointment_simulation_db');
    console.log('--- Connected to DB for Testing ---\n');

    await Appointment.deleteMany({});

    // إنشاء مواعيد جديدة
    const slot1 = await Appointment.create({ slotTime: new Date(Date.now() + 3600000), status: 'AVAILABLE' });
    const slot2 = await Appointment.create({ slotTime: new Date(Date.now() + 7200000), status: 'AVAILABLE' });
    console.log('>> Doctor created 2 initial available slots.');

     console.log('\n[1] Patient fetches available slots...');
    let patientViewData;
    const mockPatientRes = {
      status: (s) => ({ json: (d) => { patientViewData = d; } })
    };
    await getAvailableSlots({}, mockPatientRes);
    console.log(`Patient sees ${patientViewData.count} available slots.`);

     console.log('\n[2] Two patients attempt to book the same slot concurrently...');
    const competingBookings = ['Patient_Ahmed_123', 'Patient_Sara_456'].map(patientId => ({
      req: {
        user: { id: patientId, role: 'patient' },
        body: { appointmentId: slot1._id }
      },
      res: createMockResponse()
    }));

    await Promise.all(competingBookings.map(({ req, res }) => bookSlot(req, res)));

    const successfulBookings = competingBookings.filter(({ res }) => res.statusCode === 200);
    const rejectedBookings = competingBookings.filter(({ res }) => res.statusCode === 400);
    assert.equal(successfulBookings.length, 1, 'Exactly one booking should succeed.');
    assert.equal(rejectedBookings.length, 1, 'The competing booking should be rejected.');

    console.log('Successful booking:', successfulBookings[0].res.data.message);
    console.log('Rejected booking:', rejectedBookings[0].res.data.message);

     console.log('\n[3] Doctor checks the schedule...');
    let doctorScheduleData;
    const mockDoctorRes = {
      status: (s) => ({ json: (d) => { doctorScheduleData = d; } })
    };
    await getDoctorSchedule({}, mockDoctorRes);

    console.log(`\n--- Doctor Schedule Summary ---`);
    console.log(`Total Slots: ${doctorScheduleData.totalSlots}`);
    console.log(`Booked Slots Count: ${doctorScheduleData.bookedCount}`);
    console.log(`Available Slots Count: ${doctorScheduleData.availableCount}`);
    assert.equal(doctorScheduleData.bookedCount, 1);
    assert.equal(doctorScheduleData.availableCount, 1);

    console.log('\nBooked Details:', doctorScheduleData.schedule.booked);

    await mongoose.connection.close();
    console.log('\n--- Test Completed Successfully ---');
  } catch (error) {
    console.error('Test failed with error:', error);
    await mongoose.connection.close();
  }
}

runFlowTest();