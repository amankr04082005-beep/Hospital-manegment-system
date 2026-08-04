const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const ctrl = require('../controllers/prescription.controller');

const router = express.Router();

router.use(authenticate);

// Step 1-3: Doctor reviews patient + AI generates suggestion
router.post('/draft', authorize('ai-suggestion:use'), ctrl.createDraft);

// Step 4: Doctor accepts/modifies/removes AI suggestions, adds own medicines/advice
router.patch('/:id/review', authorize('ai-suggestion:modify'), ctrl.reviewDraft);

// Step 5: Doctor Approval — exclusive to 'prescription:approve' permission (doctor role only)
router.post('/:id/approve', authorize('prescription:approve'), ctrl.approve);

// Step 6: Prescription Generation — requires prior approval (enforced in service layer)
router.post('/:id/generate', authorize('prescription:generate'), ctrl.generate);

// Step 7: Share with Patient
router.post('/:id/share', authorize('prescription:generate'), ctrl.share);

// SRS gap-fix: patient's own prescription list (auto-listing, no manual ID needed)
// MUST be registered before '/:id' below, or Express will treat "my" as an :id value.
router.get('/my', ctrl.getMine);

// SRS Module 2.3 — Doctor permission: View Previous Prescriptions for a patient.
// MUST also be registered before '/:id', same reasoning as '/my' above.
router.get('/patient/:patientId/history', ctrl.getPatientHistory);

// SRS Module 9 — Follow-up Management worklist (receptionist/doctor/admin).
// MUST be registered before '/:id' below, same reasoning as '/my' above.
router.get('/followups', authorize('followup:manage'), ctrl.listFollowUps);

// Role-aware fetch — patients get sanitized view, staff get full clinical view
router.get('/:id', ctrl.getOne);

// SRS Module 9 — mark a follow-up as scheduled/completed/missed.
// SRS Module 9 — update follow-up status
router.patch('/:id/followup-status', authorize('followup:manage'), ctrl.updateFollowUpStatus);

// SRS Module 2.1 — Patient permission: Download Reports (PDF)
router.get('/:id/pdf', ctrl.downloadPdf);

// SRS Module 2.4 - Pharmacist permission: Verify Medicines
router.post('/:id/verify', ctrl.verify);

// SRS Module 6 - Pharmacist permission: Suggest Alternatives (no doctor override)
router.post('/:id/suggest-alternatives', authorize('medicine:suggest-alternative'), ctrl.suggestAlternatives);

// SRS Module 7 — AI Voice Assistant: persist captured conversation + generated clinical notes
router.post('/:id/consultation-notes', authorize('consultation:conduct'), ctrl.addConsultationNotes);


module.exports = router;