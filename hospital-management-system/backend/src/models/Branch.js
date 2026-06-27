const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: String,
    city: String,
    contactNumber: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. Cardiology, General Medicine
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    description: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = {
  Branch: mongoose.model('Branch', branchSchema),
  Department: mongoose.model('Department', departmentSchema),
};
