import api from './api';

export async function createDraft(payload) {
  const { data } = await api.post('/prescriptions/draft', payload);
  return data.data;
}

export async function reviewDraft(id, payload) {
  const { data } = await api.patch(`/prescriptions/${id}/review`, payload);
  return data.data;
}

export async function approvePrescription(id) {
  const { data } = await api.post(`/prescriptions/${id}/approve`);
  return data.data;
}

export async function generatePrescription(id) {
  const { data } = await api.post(`/prescriptions/${id}/generate`);
  return data.data;
}

export async function sharePrescription(id, channels) {
  const { data } = await api.post(`/prescriptions/${id}/share`, { channels });
  return data.data;
}

export async function getPrescription(id) {
  const { data } = await api.get(`/prescriptions/${id}`);
  return data.data;
}

// SRS gap-fix: list every prescription shared with the logged-in patient,
// most recent first — no need to manually paste a prescription number.
export async function getMyPrescriptions() {
  const { data } = await api.get('/prescriptions/my');
  return data.data;
}

// SRS Module 2.4 - Pharmacist permission: Verify Medicines.
export async function verifyPrescription(id, notes) {
  const { data } = await api.post(`/prescriptions/${id}/verify`, { notes });
  return data.data;
}

export async function searchMedicines(query) {
  const { data } = await api.get('/medicines/search', { params: { q: query } });
  return data.data;
}

// SRS Module 2.3 — Doctor permission: View Previous Prescriptions.
// Fetches every past prescription on file for a given patient, so the
// doctor can review history during a consultation.
export async function getPatientPrescriptionHistory(patientId) {
  const { data } = await api.get(`/prescriptions/patient/${patientId}/history`);
  return data.data;
}

// SRS Module 2.1 — Patient permission: Download Reports.
// Fetches the prescription PDF as a blob, ready to trigger a browser download.
export async function downloadPrescriptionPdf(id) {
  const response = await api.get(`/prescriptions/${id}/pdf`, { responseType: 'blob' });
  return response.data; // Blob
}

// SRS Module 7 — AI Voice Assistant: send the captured conversation
// transcript to the backend, which summarizes it into structured
// clinical notes and persists them on the prescription record.
export async function addConsultationNotes(id, rawTranscript) {
  const { data } = await api.post(`/prescriptions/${id}/consultation-notes`, { rawTranscript });
  return data.data;
}