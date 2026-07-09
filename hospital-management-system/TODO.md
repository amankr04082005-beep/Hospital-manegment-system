# Hospital Appointment & AI-Assisted Consultation Management System — Implementation Tracker

## Completed
- ✅ Verified backend enforcement for Module 5 AI CDSS workflow, including:
  - AI output tagged as **"AI Suggested - Pending Doctor Approval"**
  - Doctor-only approval gating
  - Patient never sees AI recommendations or raw consultation notes
  - PDF generation only after doctor approval
  - Audit trail entries for AI suggestion generation, doctor modifications, approval, generation, sharing, pharmacist verification, and consultation notes
- ✅ Verified frontend pages currently align with doctor workflow gating:
  - Consultation page blocks approval/generate actions after status changes
  - Patient prescriptions page can download only approved items via backend

## Remaining (to fully satisfy SRS, especially Module 6)
- [ ] Implement pharmacist "Suggest Alternatives" persistence (backend):
  - Add prescription schema field to store pharmacist alternative suggestions without modifying doctor-approved final medicines
  - Add audit trail event for pharmacist alternative suggestions
- [ ] Add new backend endpoint + controller/service method:
  - `POST /api/prescriptions/:id/suggest-alternatives` (pharmacist only)
  - Enforce role + ensure it can’t override doctor-final medicines
- [ ] Wire pharmacist UI to persist alternatives:
  - Update `VerifyPrescriptionPage.jsx` to send selected alternatives to backend and display saved result
- [ ] Update patient view policy (if desired/required):
  - Decide whether pharmacist alternatives should be visible to patient post-approval
  - Ensure AI suggestions remain hidden

## Testing
- [ ] Run backend tests/manual checks (API calls in order): draft → review → approve → generate → share → pharmacist verify → pharmacist suggest alternatives.
- [ ] Validate that PDF is still not generated before doctor approval.

