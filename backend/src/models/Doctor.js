const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    qualification: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true }, // Medical Registration Number (SRS Rule 4)
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    specialization: { type: String },
    yearsOfExperience: { type: Number, default: 0 },
    digitalSignatureUrl: { type: String }, // used at prescription approval time
    consultationFee: { type: Number, default: 0 },
    availability: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = Sunday
        startTime: String, // "09:00"
        endTime: String, // "17:00"
        slotDurationMinutes: { type: Number, default: 15 },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
