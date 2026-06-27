const mongoose = require('mongoose');

// SRS Module 3: Electronic Medical Records (EMR)
const emrEntrySchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    recordType: {
      type: String,
      enum: ['consultation_note', 'lab_report', 'xray', 'mri', 'ct_scan', 'other'],
      required: true,
    },
    title: { type: String, required: true },
    description: String,
    fileUrl: String, // uploaded report/scan file
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recordDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

emrEntrySchema.index({ patient: 1, recordDate: -1 });

module.exports = mongoose.model('EmrEntry', emrEntrySchema);
