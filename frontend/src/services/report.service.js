import api from './api';

// SRS Module 8 — Reporting and Analytics (Admin only).
// Each function maps to one backend report endpoint.

export async function getAppointmentReport(filter) {
  const { data } = await api.get('/reports/appointments', { params: filter ? { filter } : {} });
  return data.data;
}

export async function getDoctorReport() {
  const { data } = await api.get('/reports/doctors');
  return data.data;
}

export async function getPrescriptionReport() {
  const { data } = await api.get('/reports/prescriptions');
  return data.data;
}

export async function getRevenueReport() {
  const { data } = await api.get('/reports/revenue');
  return data.data;
}
