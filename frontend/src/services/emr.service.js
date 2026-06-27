import api from './api';

// SRS Module 3 — Electronic Medical Records (EMR)
// Fetches the patient's profile plus their full medical record history
// (lab reports, scans, past consultation notes).
export async function getPatientHistory(patientId) {
  const { data } = await api.get(`/emr/${patientId}`);
  return data.data; // { patientProfile, records }
}

// Adds a new EMR record for a patient — e.g. a lab report, scan, or
// consultation note. recordType must be one of:
// 'consultation_note' | 'lab_report' | 'xray' | 'mri' | 'ct_scan' | 'other'
export async function addRecord(patientId, { recordType, title, description, fileUrl }) {
  const { data } = await api.post(`/emr/${patientId}`, { recordType, title, description, fileUrl });
  return data.data;
}
