const mongoose = require('mongoose');

// SRS Module 1 & 2: Appointment Booking + Management
const appointmentSchema = new mongoose.Schema(
  {
    appointmentNumber: { type: String, required: true, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },

    appointmentDate: { type: Date, required: true },
    timeSlot: { type: String, required: true }, // e.g. "10:30-10:45"
    symptoms: { type: String },

    status: {
      type: String,
      enum: ['booked', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'booked',
    },

    // Queue management (Module 2)
    tokenNumber: { type: Number },
    isPriority: { type: Boolean, default: false },

    // Confirmation artifacts
    qrCodeDataUrl: { type: String },

    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // patient or receptionist for walk-in
    isWalkIn: { type: Boolean, default: false },

    cancelledReason: { type: String },
    rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, appointmentDate: 1, timeSlot: 1 });
appointmentSchema.index({ patient: 1, appointmentDate: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
