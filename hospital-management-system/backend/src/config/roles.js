// Role-Based Access Control definitions — mirrors SRS Section 2 (User Roles)

const ROLES = {
  PATIENT: 'patient',
  RECEPTIONIST: 'receptionist',
  DOCTOR: 'doctor',
  PHARMACIST: 'pharmacist',
  ADMIN: 'admin',
};

// SRS Rule 6: Only authorized doctors can approve prescriptions.
// Receptionists, Nurses, Pharmacists, and Patients cannot approve prescriptions.
const PERMISSIONS = {
  [ROLES.PATIENT]: [
    'appointment:create',
    'appointment:view-own',
    'prescription:view-own',
    'report:download-own',
    'followup:view-own',
  ],
  [ROLES.RECEPTIONIST]: [
    'appointment:view-all',
    'appointment:create', // used for walk-in registration on behalf of a patient
    'appointment:register-walkin',
    'appointment:assign-doctor',
    'appointment:forward',
    'appointment:reschedule',
    'queue:manage',
  ],
  [ROLES.DOCTOR]: [
    'appointment:view-all',
    'patient-history:view',
    'prescription:view',
    'consultation:conduct',
    'prescription:generate',
    'ai-suggestion:use',
    'ai-suggestion:modify',
    'prescription:approve', // exclusive approval right
    'diagnosis:record',
    'followup:add-advice',
  ],
  [ROLES.PHARMACIST]: [
    'prescription:view',
    'medicine:verify',
    'medicine:suggest-alternative',
    'inventory:manage',
  ],
  [ROLES.ADMIN]: [
    'user:manage',
    'doctor:manage',
    'department:manage',
    'report:view-all',
    'audit:view',
    'system:configure',
  ],
};

module.exports = { ROLES, PERMISSIONS };
