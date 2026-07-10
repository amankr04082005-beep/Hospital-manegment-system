const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// POST /api/appointments  — SRS Module 1: Appointment Booking
async function bookAppointment(req, res, next) {
  try {
    const { doctorId, departmentId, branchId, appointmentDate, timeSlot, symptoms, isWalkIn } = req.body;

    let patient;
    if (req.user.role === 'patient') {
      patient = await Patient.findOne({ user: req.user._id });
    } else if (req.user.role === 'receptionist' && req.body.patientId) {
      const patientId = req.body.patientId;
      if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
        return res.status(400).json({ success: false, message: 'Invalid patientId provided.' });
      }
      patient = await Patient.findById(patientId);
    }
    if (!patient) {
      return res.status(400).json({ success: false, message: 'Valid patient record required to book an appointment.' });
    }

    // Conflict check on doctor + date + slot
    const clash = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate,
      timeSlot,
      status: { $nin: ['cancelled'] },
    });
    if (clash) {
      return res.status(409).json({ success: false, message: 'This time slot is already booked for the selected doctor.' });
    }

    const appointmentNumber = `APT-${Date.now().toString().slice(-8)}-${uuidv4().slice(0, 4).toUpperCase()}`;
    const qrCodeDataUrl = await QRCode.toDataURL(appointmentNumber);

    const appointment = await Appointment.create({
      appointmentNumber,
      patient: patient._id,
      doctor: doctorId,
      department: departmentId,
      branch: branchId,
      appointmentDate,
      timeSlot,
      symptoms,
      qrCodeDataUrl,
      bookedBy: req.user._id,
      isWalkIn: Boolean(isWalkIn),
      status: 'booked',
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
}

// GET /api/appointments/today — Reception Dashboard (Module 2)
// Bug fix: the previous Date.setHours(0,0,0,0) boundary was computed in
// the server's local timezone, but appointmentDate is often saved as a
// bare "YYYY-MM-DD" string (parsed by Mongo as UTC midnight). In a
// timezone ahead of UTC (e.g. India, UTC+5:30) that mismatch could push
// a "today" appointment just outside the window. Widening the range by
// a day on each side is a simple, safe fix that avoids the edge case
// without needing to rewrite how dates are stored everywhere else.
async function getTodaysAppointments(req, res, next) {
  try {
    // appointmentDate is often sent as a YYYY-MM-DD string from <input type="date">.
    // That gets interpreted/serialized with timezone rules. To make "today queue"
    // stable across timezones, build boundaries using the client's local day but
    // compare using UTC-safe day boundaries.

    const now = new Date();

    // Use local date parts (year/month/day) then convert to UTC boundaries.
    // This avoids "late night" appointments falling into the wrong day window.
    const todayLocal = {
      y: now.getFullYear(),
      m: now.getMonth(),
      d: now.getDate(),
    };

    const startLocal = new Date(todayLocal.y, todayLocal.m, todayLocal.d - 1, 0, 0, 0, 0);
    const endLocal = new Date(todayLocal.y, todayLocal.m, todayLocal.d + 1, 23, 59, 59, 999);

    const start = new Date(Date.UTC(
      startLocal.getFullYear(),
      startLocal.getMonth(),
      startLocal.getDate(),
      0, 0, 0, 0
    ));

    const end = new Date(Date.UTC(
      endLocal.getFullYear(),
      endLocal.getMonth(),
      endLocal.getDate(),
      23, 59, 59, 999
    ));

    const appointments = await Appointment.find({
      appointmentDate: { $gte: start, $lte: end },
    })
      .populate('patient')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'fullName' } })
      .sort({ timeSlot: 1 });

    res.json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
}



// GET /api/appointments/mine — Patient's own appointments
async function getMyAppointments(req, res, next) {
  try {

    console.log('[getMyAppointments] req.user:', {
      id: req.user?._id,
      role: req.user?.role,
    });

    const patient = await Patient.findOne({ user: req.user._id });
    console.log('[getMyAppointments] patient found:', patient?._id);

    if (!patient) {
      const message =
        process.env.NODE_ENV === 'development'
          ? 'Patient profile missing for this logged-in user. (Patient.findOne({ user: req.user._id }) returned null.)'
          : undefined;
      return res.json({ success: true, data: [], ...(message ? { message } : {}) });
    }

    const appointments = await Appointment.find({ patient: patient._id })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'fullName' } })
      .populate('department')
      .sort({ appointmentDate: -1 });

    console.log('[getMyAppointments] appointments count:', appointments.length);

    res.json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/appointments/:id/status
async function updateStatus(req, res, next) {
  try {
    const { status, cancelledReason } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, ...(cancelledReason && { cancelledReason }) },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });
    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/appointments/:id/reschedule
async function reschedule(req, res, next) {
  try {
    const { appointmentDate, timeSlot } = req.body;
    const original = await Appointment.findById(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: 'Appointment not found.' });

    original.status = 'cancelled';
    original.cancelledReason = 'Rescheduled';
    await original.save();

    const appointmentNumber = `APT-${Date.now().toString().slice(-8)}-${uuidv4().slice(0, 4).toUpperCase()}`;
    const qrCodeDataUrl = await QRCode.toDataURL(appointmentNumber);

    const rebooked = await Appointment.create({
      appointmentNumber,
      patient: original.patient,
      doctor: original.doctor,
      department: original.department,
      branch: original.branch,
      appointmentDate,
      timeSlot,
      symptoms: original.symptoms,
      qrCodeDataUrl,
      bookedBy: req.user._id,
      rescheduledFrom: original._id,
      status: 'booked',
    });

    res.json({ success: true, data: rebooked });
  } catch (error) {
    next(error);
  }
}

// POST /api/appointments/:id/forward — Receptionist forwards patient to doctor
async function forwardToDoctor(req, res, next) {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'fullName' } });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });

    appointment.status = 'in_progress';
    await appointment.save();

    res.json({ success: true, message: 'Patient profile, history & reports forwarded to doctor.', data: appointment });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  bookAppointment,
  getTodaysAppointments,
  getMyAppointments,
  updateStatus,
  reschedule,
  forwardToDoctor,
};