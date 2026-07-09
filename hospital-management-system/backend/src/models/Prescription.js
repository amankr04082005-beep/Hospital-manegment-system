const mongoose = require('mongoose');

/**
 * SRS Module 5: AI Assisted Clinical Decision Support
 *
 * CRITICAL COMPLIANCE RULES enforced by this schema + the prescription service:
 * Rule 1: AI recommendations must be clearly marked "AI Suggested - Pending Doctor Approval".
 * Rule 2: Patients must never see AI recommendations before doctor approval (enforced in controller/service, not schema).
 * Rule 3: No prescription PDF shall be generated without doctor approval.
 * Rule 4: Every approved prescription must contain doctor name, registration number, approval timestamp, digital signature.
 * Rule 5: Full audit log of AI suggestions, doctor changes, final prescription, approval time/doctor.
 * Rule 6: Only role === 'doctor' may transition status to 'doctor_approved' (enforced in service layer).
 *
 * SRS Module 7: AI Voice Assistant — Doctor-Patient Conversation Capture +
 * Auto Clinical Notes Generation. Like the AI diagnosis block, the raw
 * conversation transcript and generated notes are clinical working
 * material for the doctor — never exposed to the patient directly
 * (see toPatientView() below).
 */

const medicineItemSchema = new mongoose.Schema(
  {
    brandName: String,
    genericName: String,
    composition: String,
    dosage: String, // e.g. "650mg"
    frequency: String, // e.g. "1-0-1" (morning-afternoon-night)
    durationDays: Number,
    instructions: String, // e.g. "After food"
    source: {
      type: String,
      enum: ['ai_suggested', 'doctor_added'],
      required: true,
    },
  },
  { _id: false }
);

const aiRecommendationSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      default: 'AI Suggested - Pending Doctor Approval', // Rule 1
      immutable: true,
    },
    probableDiagnoses: [{ diagnosis: String, confidence: Number }],
    medicineSuggestions: [medicineItemSchema],
    clinicalAdvice: {
      dietRecommendations: [String],
      lifestyleRecommendations: [String],
      followUpSuggestions: [String],
      suggestedLabTests: [String],
    },
    interactionWarnings: [
      {
        severity: { type: String, enum: ['severe', 'moderate', 'minor'] },
        description: String,
      },
    ],
    allergyAlerts: [String],
    contraindicationAlerts: [String],
    generatedAt: { type: Date, default: Date.now },
    aiModelVersion: String,
  },
  { _id: false }
);

// SRS Module 7 — captured via browser speech recognition during the
// consultation, then summarized into structured note sections.
const consultationNotesSchema = new mongoose.Schema(
  {
    rawTranscript: String, // full doctor-patient conversation, as captured
    structuredNotes: {
      chiefComplaint: String,
      historyOfPresentIllness: String,
      observations: String,
      plan: String,
    },
    capturedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    generatedAt: { type: Date, default: Date.now },
    noteGeneratorVersion: { type: String, default: 'mock-notes-engine-v1' },
  },
  { _id: false }
);

const auditEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: [
        'ai_suggestion_generated',
        'doctor_modified',
        'medicine_added',
        'medicine_removed',
        'advice_added',
        'dosage_changed',
        'duration_changed',
        'prescription_approved',
        'prescription_generated',
        'prescription_shared',
        'consultation_notes_generated', // SRS Module 7
        'prescription_verified_by_pharmacist', // SRS Module 2.4
        'pharmacist_alternative_suggestions', // Module 6 pharmacist suggestions
      ],
      required: true,
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorRole: String,
    details: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Pharmacist alternatives suggestions (Module 6)
const pharmacistAlternativeSuggestionSchema = new mongoose.Schema(
  {
    suggestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    suggestedByName: String,
    suggestedAt: { type: Date, default: Date.now },
    items: [
      {
        originalMedicine: String, // brand/generic/composition text
        alternativeBrandName: String,
        alternativeComposition: String,
        notes: String,
      },
    ],
  },
  { _id: false }
);


const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionNumber: { type: String, unique: true, sparse: true }, // assigned only on generation (Rule 3)
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },

    diagnosis: {
      primary: String,
      secondary: [String],
    },

    // Step 3: AI Recommendations — stored separately, never directly patient-visible
    aiRecommendation: aiRecommendationSchema,

    // SRS Module 7: AI Voice Assistant output — never directly patient-visible
    consultationNotes: consultationNotesSchema,

    // Step 4/5: Doctor's final, reviewed content — this is what gets shared
    finalMedicines: [medicineItemSchema],
    finalAdvice: {
      dietAdvice: String,
      exerciseAdvice: String,
      followUpInstructions: String,
    },
    followUpDate: Date,

    status: {
      type: String,
      enum: [
        'draft_created',
        'under_review',
        'doctor_approved',
        'prescription_generated',
        'shared_with_patient',
      ],
      default: 'draft_created',
    },

    // Rule 4: required at approval time
    approval: {
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
      doctorName: String,
      medicalRegistrationNumber: String,
      approvedAt: Date,
      digitalSignatureUrl: String,
      ipAddress: String,
    },

    qrCodeVerificationUrl: String,
    hospitalSealApplied: { type: Boolean, default: false },

    // SRS Module 2.4 — Pharmacist permission: Verify Medicines.
    pharmacistVerification: {
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      verifiedByName: String,
      verifiedAt: Date,
      notes: String,
    },

    // Pharmacist alternatives suggestions (Module 6)
    // IMPORTANT: MUST NOT change doctor-approved finalMedicines.
    pharmacistAlternativeSuggestions: [pharmacistAlternativeSuggestionSchema],

    sharedVia: [{ type: String, enum: ['patient_portal', 'mobile_app', 'sms_link', 'email', 'print'] }],
    sharedAt: Date,

    // Rule 5: Audit trail — append-only
    auditTrail: [auditEventSchema],

    // Version history for traceability
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ status: 1 });

// Guard: patient-facing serialization must strip AI block + consultation notes.
prescriptionSchema.methods.toPatientView = function toPatientView() {
  if (
    this.status !== 'doctor_approved' &&
    this.status !== 'prescription_generated' &&
    this.status !== 'shared_with_patient'
  ) {
    return null;
  }

  const obj = this.toObject();
  delete obj.aiRecommendation; // never expose raw AI suggestions to patient
  delete obj.consultationNotes; // never expose raw conversation transcript/notes to patient
  delete obj.auditTrail;
  // policy: hide pharmacist alternative suggestions from patient-facing view
    delete obj.pharmacistAlternativeSuggestions;
    return obj;
};

module.exports = mongoose.model('Prescription', prescriptionSchema);

