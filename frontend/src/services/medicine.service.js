import api from './api';

// SRS Module 6 — Medicine Composition Recommendation Engine.
export async function searchMedicines(query) {
  if (!query || !query.trim()) return [];
  const { data } = await api.get('/medicines/search', { params: { q: query } });
  return data.data;
}

export async function getAlternatives(medicineId) {
  const { data } = await api.get(`/medicines/${medicineId}/alternatives`);
  return data.data;
}

// Works even when the medicine isn't in the local catalogue — the
// backend falls back to the external Drug Database API in that case.
export async function getAlternativesByName(name) {
  if (!name || !name.trim()) return { resolvedId: null, alternatives: [] };
  const { data } = await api.get('/medicines/alternatives-by-name', {
    params: { name: name.trim() },
  });
  return { resolvedId: null, alternatives: data.data || [], source: data.source };
}

// SRS Module 2.4 — Pharmacist permission: Manage Inventory.
export async function getInventory() {
  const { data } = await api.get('/medicines/inventory');
  return data.data;
}

export async function updateStock(medicineId, adjustment, expiryDate) {
  const { data } = await api.patch(`/medicines/${medicineId}/stock`, { adjustment, expiryDate });
  return data.data;
}