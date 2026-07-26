const mongoose = require('mongoose');

/**
 * AuditLog — Immutable record of all critical operations.
 *
 * Healthcare compliance (HIPAA / local regulations) requires that
 * every access to and modification of patient data be traceable to
 * a specific user, timestamped, and immutable.
 *
 * This model is append-only via mongoose middleware that prevents
 * update/delete operations at the database level.
 */
const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userEmail: { type: String, required: true },
    userRole: { type: String, required: true },

    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'LOGIN_FAILED',
        'CREATE_APPOINTMENT',
        'UPDATE_APPOINTMENT',
        'CANCEL_APPOINTMENT',
        'VIEW_PATIENT_HISTORY',
        'CREATE_PRESCRIPTION_DRAFT',
        'REVIEW_PRESCRIPTION',
        'APPROVE_PRESCRIPTION',
        'GENERATE_PRESCRIPTION',
        'SHARE_PRESCRIPTION',
        'ADD_EMR_RECORD',
        'VIEW_EMR_HISTORY',
        'UPDATE_MEDICINE_STOCK',
        'REGISTER_PATIENT',
        'ADMIN_ACTION',
      ],
    },

    resourceType: { type: String, required: true }, // e.g. 'Appointment', 'Prescription', 'EmrEntry'
    resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },

    details: { type: mongoose.Schema.Types.Mixed, default: {} }, // flexible metadata
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  {
    timestamps: true,
    // Prevent updates to existing audit logs
    statics: {
      async markImmutable() {
        // no-op — just a semantic marker
      },
    },
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

// Prevent deletion of audit logs
auditLogSchema.pre('deleteOne', function (next) {
  const error = new Error('Audit logs are immutable and cannot be deleted.');
  error.statusCode = 403;
  next(error);
});
auditLogSchema.pre('deleteMany', function (next) {
  const error = new Error('Audit logs are immutable and cannot be deleted.');
  error.statusCode = 403;
  next(error);
});
// Prevent updates
auditLogSchema.pre('findOneAndUpdate', function (next) {
  const error = new Error('Audit logs are immutable and cannot be modified.');
  error.statusCode = 403;
  next(error);
});
auditLogSchema.pre('updateOne', function (next) {
  const error = new Error('Audit logs are immutable and cannot be modified.');
  error.statusCode = 403;
  next(error);
});

module.exports = mongoose.model('AuditLog', auditLogSchema);

