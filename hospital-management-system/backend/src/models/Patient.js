const mongoose = require('mongoose');

// SRS Module 1: Patient Registration fields
const patientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    patientCode: { type: String, required: true, unique: true }, // human-readable Patient ID
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    emergencyContact: {
      name: String,
      relationship: String,
      mobileNumber: String,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
      default: 'unknown',
    },

    // Module 3: Electronic Medical Records (EMR)
    allergies: [{ type: String, trim: true }],
    existingDiseases: [{ type: String, trim: true }],
    chronicMedications: [{ type: String, trim: true }],
    familyHistory: {
      diabetes: { type: Boolean, default: false },
      hypertension: { type: Boolean, default: false },
      heartDisease: { type: Boolean, default: false },
      other: [{ type: String }],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
