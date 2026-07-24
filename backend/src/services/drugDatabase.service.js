async function resolveSubstanceXref(substanceName) {
  if (!substanceName || !DRUG_DB_API_KEY) return null;
  try {
    const { data } = await axios.get(`${DRUG_DB_BASE_URL}/v1/substances/xref`, {
      params: { name: substanceName },
      headers: { Authorization: `Bearer ${DRUG_DB_API_KEY}` },
      timeout: 10000,
    });
    return data || null;
  } catch (err) {
    console.error('Drug Database substance xref failed for', substanceName, '-', err.response?.status || err.message);
    return null;
  }
}

function extractAtcCode(xrefData) {
  if (!xrefData?.codes) return null;
  const whoAtc = xrefData.codes.find((c) => c.system === 'WHO-ATC');
  return whoAtc?.code || null;
}

async function findAlternativesFromDrugDatabase(substanceName, countryCode = 'CH') {
  if (!DRUG_DB_API_KEY) return [];

  const xrefData = await resolveSubstanceXref(substanceName);
  if (!xrefData) return [];

  const atcCode = extractAtcCode(xrefData);
  if (!atcCode) return [];

  try {
    const { data } = await axios.get(`${DRUG_DB_BASE_URL}/v1/atc/${atcCode}/drugs`, {
      params: { country: countryCode, limit: 20 },
      headers: { Authorization: `Bearer ${DRUG_DB_API_KEY}` },
      timeout: 10000,
    });
    return data?.drugs || [];
  } catch (err) {
    console.error('Drug Database ATC drugs lookup failed for', atcCode, '-', err.response?.status || err.message);
    return [];
  }
}