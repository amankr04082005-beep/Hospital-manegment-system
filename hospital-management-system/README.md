# MediFlow — Hospital Appointment & AI-Assisted Consultation Management System

Built from the provided SRS. Full module structure is scaffolded; **Modules 1, 2, 3 (partial), 5, and 6** are fully implemented end-to-end (backend + frontend). Other modules have working route/data structure stubs so the project can grow into them.

## What's fully working

| SRS Module | Status | Where |
|---|---|---|
| 1. Patient Appointment Booking | ✅ Full | `backend/src/controllers/appointment.controller.js`, `frontend/src/pages/patient/BookAppointmentPage.jsx` |
| 2. Appointment Management (queue, forward, reschedule) | ✅ Full | same controller, `frontend/src/pages/receptionist/*` |
| 3. EMR | ⚙️ Basic CRUD | `backend/src/routes/emr.routes.js` |
| 4. Doctor Consultation | ✅ Full | `frontend/src/pages/doctor/*` |
| 5. AI-Assisted Clinical Decision Support | ✅ Full, compliance-enforced | see below |
| 6. Medicine Composition Engine | ✅ Full | `backend/src/services/aiClinicalDecisionSupport.service.js`, `backend/src/models/Medicine.js` |
| 7. Prescription Generation (PDF/QR) | ✅ QR + record; PDF generation hook present (pdfkit installed, not wired to a template yet) | `backend/src/services/prescription.service.js` |
| 8. Follow-up Management | ⚙️ Data field only (`followUpDate`) | — |
| 9. Reporting & Analytics | 🧱 Structure only, not implemented | — |
| 10. Notifications (SMS/Email) | 🧱 Twilio/SMTP config present, dispatch not wired | `.env.example` |

## Module 5 — how the compliance rules are actually enforced (not just documented)

This was the most important part of the SRS, so it's enforced in code, not just described:

- **Rule 1** (`AI Suggested - Pending Doctor Approval` label) — hardcoded, immutable field in `Prescription.aiRecommendation.label` (`backend/src/models/Prescription.js`).
- **Rule 2** (patients never see AI suggestions) — `Prescription.toPatientView()` strips `aiRecommendation` and `auditTrail` entirely; `prescriptionService.getForPatient()` is the *only* path patients can hit, and it returns `null` until the prescription is approved.
- **Rule 3** (no PDF/number without approval) — `generatePrescriptionArtifacts()` throws if `status !== 'doctor_approved'`.
- **Rule 4** (approved prescription must carry doctor name, registration number, timestamp, signature) — all four fields are required on `Prescription.approval` and populated from the `Doctor` record at approval time.
- **Rule 5** (audit trail) — every mutation (`ai_suggestion_generated`, `doctor_modified`, `prescription_approved`, `prescription_generated`, `prescription_shared`) appends an entry to `auditTrail`, including actor, role, IP, and timestamp.
- **Rule 6** (only doctors approve) — `approvePrescription()` checks `actor.role === 'doctor'` *and* that a matching `Doctor` profile exists *and* that the prescription is assigned to that doctor — independent of route middleware, so it's safe even if called directly.

The frontend visualizes this with two distinct badges: an amber dashed **"AI Suggested — Pending Doctor Approval"** tag vs. a solid teal **"Doctor Approved"** stamp, so the draft/final distinction is visible at a glance in the consultation screen.

## Project structure

```
hospital-management-system/
├── backend/                  Node.js + Express + MongoDB API
│   └── src/
│       ├── config/           DB connection, RBAC permission map
│       ├── models/            Mongoose schemas (User, Patient, Doctor, Appointment, Prescription, Medicine, EMR...)
│       ├── controllers/       Request handlers
│       ├── services/          Business logic — AI CDSS service + prescription workflow service
│       ├── middleware/        JWT auth, RBAC, validation, error handling
│       ├── routes/            Express routers per module
│       └── utils/seedData.js  Demo data (users, branch, department, medicines)
└── frontend/                  React (Vite) web portal
    └── src/
        ├── pages/             Role-specific screens (patient, doctor, receptionist, pharmacist, admin, auth)
        ├── components/        Layout shell, badges, shared UI primitives
        ├── context/           Auth context (JWT in localStorage)
        ├── services/          Axios API clients
        └── styles/            Design tokens (globals.css)
```

## Running it locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, and (optionally) OPENAI_API_KEY for real AI suggestions
npm run seed     # creates demo branch/department/doctor/patient/medicines
npm run dev      # starts on http://localhost:5000
```

Without `OPENAI_API_KEY` set, the AI suggestion endpoint still works — it returns a placeholder recommendation so you can exercise the full doctor-review → approve → share workflow without an API key.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev      # starts on http://localhost:3000, proxies /api to localhost:5000
```

### 3. Demo logins (after `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@hospital.com | Admin@1234 |
| Doctor | doctor@hospital.com | Doctor@1234 |
| Receptionist | reception@hospital.com | Reception@1234 |
| Pharmacist | pharmacist@hospital.com | Pharmacist@1234 |
| Patient | patient@hospital.com | Patient@1234 |

### Try the core flow

1. Log in as the **patient**, book an appointment with Dr. Anjali Rao.
2. Log in as **reception**, see it on today's queue, click "Forward to doctor."
3. Log in as the **doctor**, open "My patients today" → "Start consultation," enter symptoms, click "Generate AI clinical suggestion."
4. Review/edit the AI-suggested medicines, save the review, then click **Approve prescription** — note the badge switches from amber "AI Suggested" to teal "Doctor Approved."
5. Click "Generate & share with patient."
6. Log back in as the **patient**, go to "My Prescriptions," paste the prescription ID (visible in the doctor's network response / Mongo `_id`) to see the patient-facing view — confirm the raw AI suggestion block is never present there.

## Notes

- `node_modules` and `.env` are intentionally excluded from this zip — run `npm install` in each folder.
- The medicine catalog seeded includes the SRS's own example (Dolo 650 / Crocin 650 / Calpol 650, all Paracetamol 650mg) plus a penicillin-based antibiotic to demonstrate the allergy-alert path.
- This is a working scaffold meant to be extended, not a production-hardened deployment — review auth/session settings, add rate limiting tuned to your traffic, and wire real SMS/email providers before going live.
