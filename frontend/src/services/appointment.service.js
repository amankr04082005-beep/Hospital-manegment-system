import api from './api';

export async function bookAppointment(payload) {
  const { data } = await api.post('/appointments', payload);
  return data.data;
}

export async function getMyAppointments() {
  const { data } = await api.get('/appointments/mine');
  return data.data;
}

export async function getTodaysAppointments() {
  const { data } = await api.get('/appointments/today');
  return data.data;
}

export async function updateAppointmentStatus(id, status, cancelledReason) {
  const { data } = await api.patch(`/appointments/${id}/status`, { status, cancelledReason });
  return data.data;
}

export async function rescheduleAppointment(id, appointmentDate, timeSlot) {
  const { data } = await api.patch(`/appointments/${id}/reschedule`, { appointmentDate, timeSlot });
  return data.data;
}

export async function forwardToDoctor(id) {
  const { data } = await api.post(`/appointments/${id}/forward`);
  return data.data;
}

export async function getBranches() {
  const { data } = await api.get('/hospital/branches');
  return data.data;
}

export async function getDepartments(branchId) {
  const { data } = await api.get('/hospital/departments', { params: { branchId } });
  return data.data;
}

export async function getDoctors(departmentId) {
  const { data } = await api.get('/hospital/doctors', { params: { departmentId } });
  return data.data;
}

// SRS Module 2.2 — Receptionist permission: Register Walk-in Patients.
// Creates a brand-new Patient + User record for someone with no
// existing account, so the receptionist isn't blocked on "Patient ID"
// when a walk-in shows up with no prior record.
export async function registerWalkInPatient(payload) {
  const { data } = await api.post('/hospital/patients', payload);
  return data.data; // { user, patient }
}
