const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const aiService = require('./aiClinicalDecisionSupport.service');

/**
 * SRS Module 5: full lifecycle enforcement.
 * Status machine: draft_created -> under_review -> doctor_approved
 *                 -> prescription_generated -> shared_with_patient
 *
 * Hard rules enforced here (not just in the schema):
 * Rule 2: getForPatient() only ever returns toPatientView(), which strips aiRecommendation.
 * Rule 3: generatePrescriptionPdf-eligible only after status === doctor_approved.
 * Rule 5: every mutation pushes an auditTrail entry.
 * Rule 6: approvePrescription() requires actor.role === 'doctor' and a matching Doctor record.
 */

function appendAudit(prescription, eventType, actor, details, ipAddress) {
  prescription.auditTrail.push({
    eventType,
    actor: actor?._id,
    actorRole: actor?.role,
    details,
    ipAddress,
    timestamp: new Date(),
  });
}

/**
 * Patients are handed a human-friendly prescriptionNumber (e.g. "RX-...-BE25E9"),
 * never the raw Mongo _id. This resolves either form to a Prescription document.
 */
async function findByIdOrPrescriptionNumber(identifier) {
  if (!identifier) return null;

  if (mongoose.Types.ObjectId.isValid(identifier) && String(identifier).length === 24) {
    const byId = await Prescription.findById(identifier);
    if (byId) return byId;
  }

  return Prescription.findOne({ prescriptionNumber: identifier });
}

async function createDraftWithAiSuggestion({ appointmentId, patientId, doctorId, symptoms, labReports }, actor, ipAddress) {
  // Guard against frontend/body mapping issues causing Mongoose cast errors
  if (patientId === undefined || patientId === null || patientId === '' ) {
    throw new Error('patientId is required (createDraftWithAiSuggestion).');
  }
  if (appointmentId === undefined || appointmentId === null || appointmentId === '' ) {
    throw new Error('appointmentId is required (createDraftWithAiSuggestion).');
  }

  const patient = await Patient.findById(patientId);
  if (!patient) throw new Error('Patient not found');


  const aiRecommendation = await aiService.generateClinicalRecommendation({
    symptoms,
    medicalHistory: { existingDiseases: patient.existingDiseases, familyHistory: patient.familyHistory },
    allergies: patient.allergies,
    existingDiseases: patient.existingDiseases,
    currentMedications: patient.chronicMedications,
    labReports,
  });

  const prescription = new Prescription({
    appointment: appointmentId,
    patient: patientId,
    doctor: doctorId,
    aiRecommendation,
    status: 'under_review',
    auditTrail: [],
  });

  appendAudit(prescription, 'ai_suggestion_generated', actor, { symptoms }, ipAddress);
  await prescription.save();
  return prescription;
}

async function reviewAndStageFinal(prescriptionId, { finalMedicines, finalAdvice, diagnosis, followUpDate, changesSummary }, actor, ipAddress) {
  const prescription = await Prescription.findById(prescriptionId);
  if (!prescription) throw new Error('Prescription not found');
  if (prescription.status === 'doctor_approved' || prescription.status === 'prescription_generated' || prescription.status === 'shared_with_patient') {
    throw new Error('Prescription already approved — cannot modify. Create a new version instead.');
  }

  prescription.finalMedicines = finalMedicines;
  prescription.finalAdvice = finalAdvice;
  prescription.diagnosis = diagnosis;
  prescription.followUpDate = followUpDate;
  prescription.status = 'under_review';

  appendAudit(prescription, 'doctor_modified', actor, { changesSummary }, ipAddress);
  await prescription.save();
  return prescription;
}

async function approvePrescription(prescriptionId, actor, ipAddress) {
  if (!actor || actor.role !== 'doctor') {
    throw new Error('Forbidden: only an authorized doctor may approve a prescription.');
  }

  const doctor = await Doctor.findOne({ user: actor._id });
  if (!doctor) {
    throw new Error('Forbidden: no doctor profile found for this user.');
  }

  const prescription = await Prescription.findById(prescriptionId).populate('doctor');
  if (!prescription) throw new Error('Prescription not found');

  if (String(prescription.doctor._id) !== String(doctor._id)) {
    throw new Error('Forbidden: this prescription is not assigned to you.');
  }

  if (!prescription.finalMedicines || prescription.finalMedicines.length === 0) {
    throw new Error('Cannot approve an empty prescription — add at least one medicine.');
  }

  prescription.status = 'doctor_approved';
  prescription.approval = {
    approvedBy: doctor._id,
    doctorName: actor.fullName,
    medicalRegistrationNumber: doctor.registrationNumber,
    approvedAt: new Date(),
    digitalSignatureUrl: doctor.digitalSignatureUrl,
    ipAddress,
  };
  prescription.version += 1;

  appendAudit(prescription, 'prescription_approved', actor, { approvalTimestamp: prescription.approval.approvedAt }, ipAddress);
  await prescription.save();
  return prescription;
}

async function generatePrescriptionArtifacts(prescriptionId, actor, ipAddress) {
  const prescription = await Prescription.findById(prescriptionId);
  if (!prescription) throw new Error('Prescription not found');

  if (prescription.status !== 'doctor_approved' && prescription.status !== 'prescription_generated') {
    throw new Error('Cannot generate prescription artifacts before doctor approval.');
  }

  if (!prescription.prescriptionNumber) {
    prescription.prescriptionNumber = `RX-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;
  }

  const verificationPayload = JSON.stringify({
    rx: prescription.prescriptionNumber,
    patient: prescription.patient,
    doctor: prescription.doctor,
    approvedAt: prescription.approval?.approvedAt,
  });
  prescription.qrCodeVerificationUrl = await QRCode.toDataURL(verificationPayload);
  prescription.hospitalSealApplied = true;
  prescription.status = 'prescription_generated';

  appendAudit(prescription, 'prescription_generated', actor, { prescriptionNumber: prescription.prescriptionNumber }, ipAddress);
  await prescription.save();
  return prescription;
}

async function shareWithPatient(prescriptionId, channels, actor, ipAddress) {
  const prescription = await Prescription.findById(prescriptionId);
  if (!prescription) throw new Error('Prescription not found');
  if (prescription.status !== 'prescription_generated') {
    throw new Error('Prescription must be generated before it can be shared.');
  }

  prescription.sharedVia = channels;
  prescription.sharedAt = new Date();
  prescription.status = 'shared_with_patient';

  appendAudit(prescription, 'prescription_shared', actor, { channels }, ipAddress);
  await prescription.save();

  if (prescription.appointment) {
    await Appointment.findByIdAndUpdate(prescription.appointment, { status: 'completed' });
  }

  return prescription;
}

async function getForPatient(identifier) {
  const prescription = await findByIdOrPrescriptionNumber(identifier);
  if (!prescription) return null;
  return prescription.toPatientView();
}

async function getForClinicalStaff(identifier) {
  const prescription = await findByIdOrPrescriptionNumber(identifier);
  if (!prescription) return null;
  return Prescription.findById(prescription._id)
    .populate('patient')
    .populate('doctor')
    .populate('appointment');
}

/**
 * SRS Module 2.3 — Doctor permission: View Previous Prescriptions.
 * Returns every prescription on file for a patient (by Patient _id, as
 * used elsewhere in the clinical/EMR flows), most recent first. Unlike
 * getMyPrescriptions(), this is the full clinical record (not the
 * patient-sanitized view) since the caller here is a doctor reviewing
 * history during a consultation, not the patient themself.
 */
async function getPreviousPrescriptionsForPatient(patientId) {
  return Prescription.find({
    patient: patientId,
    status: { $in: ['doctor_approved', 'prescription_generated', 'shared_with_patient'] },
  })
    .populate('doctor')
    .select('-aiRecommendation -consultationNotes -auditTrail')
    .sort({ createdAt: -1 });
}

async function getMyPrescriptions(patientUserId) {
  const patient = await Patient.findOne({ user: patientUserId });
  if (!patient) return [];

  const prescriptions = await Prescription.find({
    patient: patient._id,
    status: { $in: ['doctor_approved', 'prescription_generated', 'shared_with_patient'] },
  })
    .populate('doctor')
    .sort({ createdAt: -1 });

  return prescriptions.map((p) => p.toPatientView()).filter(Boolean);
}

/**
 * SRS Module 2.1 - Patient permission: Download Reports.
 * Renders the doctor-approved prescription as a PDF buffer. Only ever
 * built from toPatientView() data, so the AI block / consultation notes /
 * audit trail can never leak into a downloadable file.
 */
async function suggestPharmacistAlternatives(prescriptionId, pharmacistActor, { items }, ipAddress) {
  if (!pharmacistActor || pharmacistActor.role !== 'pharmacist') {
    throw new Error('Forbidden: only pharmacists may suggest alternatives.');
  }

  const prescription = await Prescription.findById(prescriptionId);
  if (!prescription) throw new Error('Prescription not found');

  // Do not allow pharmacist to override doctor-approved finalMedicines.
  // Allow suggestions after at least doctor approval (under_review/approved).
  if (!['doctor_approved', 'prescription_generated', 'shared_with_patient'].includes(prescription.status)) {
    throw new Error('Alternatives can only be suggested for doctor-approved prescriptions.');
  }

  // Basic normalization/validation
  const safeItems = (items || []).map((it) => ({
    originalMedicine: it.originalMedicine,
    alternativeBrandName: it.alternativeBrandName,
    alternativeComposition: it.alternativeComposition,
    notes: it.notes || '',
  }));

  prescription.pharmacistAlternativeSuggestions = [
    {
      suggestedBy: pharmacistActor._id,
      suggestedByName: pharmacistActor.fullName,
      suggestedAt: new Date(),
      items: safeItems,
    },
  ];

  appendAudit(
    prescription,
    'pharmacist_alternative_suggestions',
    pharmacistActor,
    { items: safeItems.map((x) => ({
      originalMedicine: x.originalMedicine,
      alternativeBrandName: x.alternativeBrandName,
      alternativeComposition: x.alternativeComposition,
      notes: x.notes,
    })) },
    ipAddress
  );

  await prescription.save();
  return prescription;
}

async function generatePrescriptionPdf(identifier) {
  const prescription = await findByIdOrPrescriptionNumber(identifier);
  if (!prescription) return null;

  const patientView = prescription.toPatientView();
  if (!patientView) return null;

  const populated = await Prescription.findById(prescription._id).populate('patient').populate('doctor');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('MediFlow - Prescription', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('#555').text(patientView.prescriptionNumber || 'Pending generation', { align: 'center' });
    doc.moveDown(1.5);

    doc.fillColor('#000').fontSize(12);
    doc.text('Doctor: Dr. ' + (populated.doctor?.user?.fullName || populated.approval?.doctorName || ''));
    if (populated.approval?.medicalRegistrationNumber) {
      doc.text('Registration No: ' + populated.approval.medicalRegistrationNumber);
    }
    doc.text('Patient: ' + (populated.patient?.user?.fullName || ''));
    if (populated.approval?.approvedAt) {
      doc.text('Approved: ' + new Date(populated.approval.approvedAt).toLocaleString());
    }
    doc.moveDown();

    doc.fontSize(14).text('Diagnosis', { underline: true });
    doc.fontSize(12).text(patientView.diagnosis?.primary || 'Not specified');
    doc.moveDown();

    doc.fontSize(14).text('Medicines', { underline: true });
    (patientView.finalMedicines || []).forEach((m, i) => {
      doc
        .fontSize(12)
        .text((i + 1) + '. ' + (m.brandName || m.genericName) + ' - ' + m.dosage + ', ' + m.frequency + ', ' + m.durationDays + ' days');
      if (m.instructions) {
        doc.fontSize(10).fillColor('#555').text('   ' + m.instructions);
        doc.fillColor('#000');
      }
    });
    doc.moveDown();

    if (patientView.finalAdvice?.dietAdvice) {
      doc.fontSize(14).text('Diet advice', { underline: true });
      doc.fontSize(12).text(patientView.finalAdvice.dietAdvice);
      doc.moveDown();
    }
    if (patientView.finalAdvice?.followUpInstructions) {
      doc.fontSize(14).text('Follow-up instructions', { underline: true });
      doc.fontSize(12).text(patientView.finalAdvice.followUpInstructions);
      doc.moveDown();
    }
    if (patientView.followUpDate) {
      doc.fontSize(12).text('Follow-up date: ' + new Date(patientView.followUpDate).toLocaleDateString());
      doc.moveDown();
    }

    doc.fontSize(9).fillColor('#888').text(
      "This is the doctor's final, approved prescription. Draft AI suggestions reviewed during the consultation are never included.",
      { align: 'center' }
    );

    doc.end();
  });
}

module.exports = {
  createDraftWithAiSuggestion,
  reviewAndStageFinal,
  approvePrescription,
  generatePrescriptionArtifacts,
  shareWithPatient,
  getForPatient,
  getForClinicalStaff,
  getMyPrescriptions,
  generatePrescriptionPdf,
  getPreviousPrescriptionsForPatient,
  suggestPharmacistAlternatives,
};
