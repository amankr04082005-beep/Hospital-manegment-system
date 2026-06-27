const mongoose = require('mongoose');

// SRS Module 6: Medicine Composition Recommendation Engine
const medicineSchema = new mongoose.Schema(
  {
    brandName: { type: String, required: true, trim: true },
    genericName: { type: String, required: true, trim: true },
    composition: { type: String, required: true, trim: true }, // e.g. "Paracetamol 650mg"
    manufacturer: String,
    form: { type: String, enum: ['tablet', 'syrup', 'injection', 'capsule', 'ointment', 'other'], default: 'tablet' },
    category: String, // e.g. "Analgesic", "Antibiotic"
    isPenicillinBased: { type: Boolean, default: false }, // used for allergy alerts
    contraindications: [{ type: String }], // e.g. ["kidney_disease", "liver_disease"]
    interactsWith: [
      {
        composition: String,
        severity: { type: String, enum: ['severe', 'moderate', 'minor'] },
        note: String,
      },
    ],

    // SRS Module 2.4 — Pharmacist permission: Manage Inventory.
    // A simple single-location stock count. lowStockThreshold drives the
    // "low stock" flag the pharmacist sees so they know to reorder before
    // a medicine actually runs out, not after.
    stockQuantity: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    expiryDate: Date,
    lastRestockedAt: Date,
  },
  { timestamps: true }
);

medicineSchema.index({ composition: 'text', brandName: 'text', genericName: 'text' });

// Convenience: lets the frontend just check `medicine.isLowStock` instead
// of re-deriving the comparison everywhere it lists medicines.
medicineSchema.virtual('isLowStock').get(function isLowStock() {
  return this.stockQuantity <= this.lowStockThreshold;
});
medicineSchema.set('toJSON', { virtuals: true });
medicineSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Medicine', medicineSchema);