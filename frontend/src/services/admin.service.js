import api from './api';

// SRS Module 2.5 — Hospital Administrator: User Management.
export async function getUsers(role) {
  const { data } = await api.get('/admin/users', { params: role ? { role } : {} });
  return data.data;
}

export async function setUserStatus(userId, isActive) {
  const { data } = await api.patch(`/admin/users/${userId}/status`, { isActive });
  return data.data;
}

// SRS Module 2.5 — Hospital Administrator: Doctor Management.
export async function getDoctors() {
  const { data } = await api.get('/admin/doctors');
  return data.data;
}

export async function createDoctor(payload) {
  const { data } = await api.post('/admin/doctors', payload);
  return data.data;
}

export async function setDoctorStatus(doctorId, isActive) {
  const { data } = await api.patch(`/admin/doctors/${doctorId}/status`, { isActive });
  return data.data;
}

// SRS Module 2.5 — Hospital Administrator: Department Management.
export async function getDepartments() {
  const { data } = await api.get('/admin/departments');
  return data.data;
}

export async function createDepartment(payload) {
  const { data } = await api.post('/admin/departments', payload);
  return data.data;
}