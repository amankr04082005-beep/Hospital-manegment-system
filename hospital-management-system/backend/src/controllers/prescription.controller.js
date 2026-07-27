const prescriptionService = require('../services/prescription.service');
const Doctor = require('../models/Doctor');
const Prescription = require('../models/Prescription');
const { generateClinicalNotes } = require('../services/consultationNotes.service');

// POST /api/prescriptions/draft  (Doctor only) â€” Step 1-3: review history + generate AI suggestion
async function createDraft(req, res, next) {
  try {
    const { appointmentId, patientId, symptoms, labReports } = req.body;

    // Prevents: "Cast to ObjectId failed for value \"undefined\" at path \"_id\" for model \"Patient\""
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: 'appointmentId is required.' });
    }
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'patientId is required.' });
    }

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(403).json({ success: false, message: 'Doctor profile required.' });

    const prescription = await prescriptionService.createDraftWithAiSuggestion(
      { appointmentId, patientId, doctorId: doctor._id, symptoms, labReports },
      req.user,
      req.ipAddress
    );

    res.status(201).json({ success: true, data: prescription });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/prescriptions/:id/review  (Doctor only) â€” Step 4: accept/modify/remove/add
async function reviewDraft(req, res, next) {
  try {
    const { finalMedicines, finalAdvice, diagnosis, followUpDate, changesSummary } = req.body;
    const prescription = await prescriptionService.reviewAndStageFinal(
      req.params.id,
      { finalMedicines, finalAdvice, diagnosis, followUpDate, changesSummary },
      req.user,
      req.ipAddress
    );
    res.json({ success: true, data: prescription });
  } catch (error) {
    next(error);
  }
}

// POST /api/prescriptions/:id/approve  (Doctor only) â€” Step 5: Doctor Approval
async function approve(req, res, next) {
  try {
    const prescription = await prescriptionService.approvePrescription(req.params.id, req.user, req.ipAddress);
    res.json({ success: true, message: 'Prescription approved.', data: prescription });
  } catch (error) {
    next(error);
  }
}

// POST /api/prescriptions/:id/generate  â€” Step 6: Prescription Generation (requires prior approval)
async function generate(req, res, next) {
  try {
    const prescription = await prescriptionService.generatePrescriptionArtifacts(req.params.id, req.user, req.ipAddress);
    res.json({ success: true, data: prescription });
  } catch (error) {
    next(error);
  }
}

// POST /api/prescriptions/:id/share  â€” Step 7: Share with Patient
async function share(req, res, next) {
  try {
    const { channels } = req.body;
    const prescription = await prescriptionService.shareWithPatient(req.params.id, channels, req.user, req.ipAddress);
    res.json({ success: true, data: prescription });
  } catch (error) {
    next(error);
  }
}

// GET /api/prescriptions/my  (Patient only)
async function getMine(req, res, next) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Only patients can list their own prescriptions.' });
    }
    const prescriptions = await prescriptionService.getMyPrescriptions(req.user._id);
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    next(error);
  }
}

// GET /api/prescriptions/patient/:patientId/history  (Doctor/staff only)
// SRS Module 2.3 â€” Doctor permission: View Previous Prescriptions.
// MUST be registered before '/:id' in routes, same reasoning as '/my'.
async function getPatientHistory(req, res, next) {
  try {
    if (req.user.role === 'patient') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this.' });
    }
    const prescriptions = await prescriptionService.getPreviousPrescriptionsForPatient(req.params.patientId);
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    next(error);
  }
}

// GET /api/prescriptions/:id  â€” role-aware view
async function getOne(req, res, next) {
  try {
    if (req.user.role === 'patient') {
      const view = await prescriptionService.getForPatient(req.params.id);
      if (!view) {
        return res.status(403).json({
          success: false,
          message: 'Prescription is pending doctor approval and is not yet available to view.',
        });
      }
      return res.json({ success: true, data: view });
    }

    const full = await prescriptionService.getForClinicalStaff(req.params.id);
    if (!full) return res.status(404).json({ success: false, message: 'Prescription not found.' });
    res.json({ success: true, data: full });
  } catch (error) {
    next(error);
  }
}

// POST /api/prescriptions/:id/verify  (Pharmacist only)
// SRS Module 2.4 - Pharmacist permission: Verify Medicines.
async function verify(req, res, next) {
  try {
    if (req.user.role !== 'pharmacist') {
      return res.status(403).json({ success: false, message: 'Only pharmacists can verify a prescription.' });
    }

    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found.' });

    if (!['doctor_approved', 'prescription_generated', 'shared_with_patient'].includes(prescription.status)) {
      return res.status(400).json({ success: false, message: 'Prescription is not yet approved - nothing to verify.' });
    }

    prescription.pharmacistVerification = {
      verifiedBy: req.user._id,
      verifiedByName: req.user.fullName,
      verifiedAt: new Date(),
      notes: req.body.notes || '',
    };

    prescription.auditTrail.push({
      eventType: 'prescription_verified_by_pharmacist',
      actor: req.user._id,
      actorRole: req.user.role,
      details: { notes: req.body.notes || '' },
      ipAddress: req.ipAddress,
    });

    await prescription.save();
    res.json({ success: true, message: 'Prescription verified.', data: prescription });
  } catch (error) {
    next(error);
  }
}

// GET /api/prescriptions/:id/pdf  â€” SRS Module 2.1: Patient "Download Reports" permission.
// Streams the doctor-approved prescription as a downloadable PDF.
async function downloadPdf(req, res, next) {
  try {
    const pdfBuffer = await prescriptionService.generatePrescriptionPdf(req.params.id);
    if (!pdfBuffer) {
      return res.status(404).json({ success: false, message: 'Prescription not found or not yet approved.' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="prescription-${req.params.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

// POST /api/prescriptions/:id/consultation-notes  (Doctor only)
async function addConsultationNotes(req, res, next) {
  try {
    const { rawTranscript } = req.body;
    if (!rawTranscript || !rawTranscript.trim()) {
      return res.status(400).json({ success: false, message: 'rawTranscript is required.' });
    }

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(403).json({ success: false, message: 'Doctor profile required.' });

    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found.' });

    const { structuredNotes } = generateClinicalNotes(rawTranscript);

    prescription.consultationNotes = {
      rawTranscript: rawTranscript.trim(),
      structuredNotes,
      capturedBy: doctor._id,
      generatedAt: new Date(),
      noteGeneratorVersion: 'mock-notes-engine-v1',
    };

    prescription.auditTrail.push({
      eventType: 'consultation_notes_generated',
      actor: req.user._id,
      actorRole: req.user.role,
      details: { transcriptLength: rawTranscript.trim().length },
      ipAddress: req.ipAddress,
    });

    await prescription.save();

    res.json({ success: true, data: prescription });
  } catch (error) {
    next(error);
  }
}

// POST /api/prescriptions/:id/suggest-alternatives (Pharmacist only)
async function suggestAlternatives(req, res, next) {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items[] is required.' });
    }

    const prescription = await prescriptionService.suggestPharmacistAlternatives(
      req.params.id,
      req.user,
      { items },
      req.ipAddress
    );

    res.json({ success: true, message: 'Alternatives suggested by pharmacist.', data: prescription });
  } catch (error) {
    next(error);
  }
}

// GET /api/prescriptions/followups  (Doctor/Receptionist/Admin only)
// SRS Module 8 - Follow-up Management: worklist of prescriptions needing action.
async function getFollowUps(req, res, next) {
  try {
    if (req.user.role === 'patient' || req.user.role === 'pharmacist') {
      return res.status(403).json({ success: false, message: 'Not authorized to view the follow-up worklist.' });
    }
    let doctorId;
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) return res.status(403).json({ success: false, message: 'Doctor profile required.' });
      doctorId = doctor._id;
    }
    const { status } = req.query;
    const worklist = await prescriptionService.getFollowUpWorklist({ doctorId, status });
    res.json({ success: true, data: worklist });
  } catch (error) {
    next(error);
  }
}
// PATCH /api/prescriptions/:id/followup-status  (Doctor/Receptionist/Admin only)
// SRS Module 8 - updates follow-up status, optionally linking a booked appointment.
async function updateFollowUpStatus(req, res, next) {
  try {
    if (req.user.role === 'patient' || req.user.role === 'pharmacist') {
      return res.status(403).json({ success: false, message: 'Not authorized to update follow-up status.' });
    }
    const { followUpStatus, appointmentId } = req.body;
    if (!followUpStatus) {
      return res.status(400).json({ success: false, message: 'followUpStatus is required.' });
    }
    const prescription = await prescriptionService.updateFollowUpStatus(
      req.params.id,
      { followUpStatus, appointmentId },
      req.user,
      req.ipAddress
    );
    res.json({ success: true, message: 'Follow-up status updated.', data: prescription });
  } catch (error) {
    next(error);
  }
}

module.exports = { createDraft, reviewDraft, approve, generate, share, getOne, getMine, getPatientHistory, downloadPdf, verify, addConsultationNotes, suggestAlternatives, getFollowUps, updateFollowUpStatus };

