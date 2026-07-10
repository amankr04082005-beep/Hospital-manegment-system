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

export async function getAlternativesByName(name) {
  if (!name || !name.trim()) return { resolvedId: null, alternatives: [] };
  const matches = await searchMedicines(name.trim());
  if (!matches || matches.length === 0) return { resolvedId: null, alternatives: [] };

  const exact = matches.find((m) => m.brandName?.toLowerCase() === name.trim().toLowerCase());
  const resolved = exact || matches[0];

  const alternatives = await getAlternatives(resolved._id);
  return { resolvedId: resolved._id, alternatives: alternatives.filter((a) => a._id !== resolved._id) };
}

// External drug lookups (previously powered by /api/medicines/lookup and /lookup-batch)
// were removed to “chhod drugs db” and only local inventory/alternatives are supported.


// SRS Module 2.4 — Pharmacist permission: Manage Inventory.
export async function getInventory() {
  const { data } = await api.get('/medicines/inventory');
  return data.data;
}

export async function updateStock(medicineId, adjustment, expiryDate) {
  const { data } = await api.patch(`/medicines/${medicineId}/stock`, { adjustment, expiryDate });
  return data.data;
}