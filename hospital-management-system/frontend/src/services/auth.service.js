import api from './api';

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data.data;
}

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data.data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data.data;
}
