const axios = require('axios');
const Medicine = require('../models/Medicine');

/**
 * SRS Module 6 — Drug Database Integration.
 *
 * Strategy:
 *  1. Look up the medicine in our local `Medicine` collection first
 *     (fast, curated, used for contraindication/interaction checks).
 *  2. If not found locally, fall back to the free, public OpenFDA
 *     Drug Label API (https://open.fda.gov/apis/drug/label/) which
 *     requires NO API key and NO signup.
 *  3. For "same composition" alternatives specifically, fall back to
 *     the Drug Database API (drug-database.com) using:
 *       substance name -> xref (UNII + codes) -> ATC code -> drugs in
 *       that ATC subtree.
 *     NOTE: /v1/substances/{unii} on this provider returns 404 even
 *     for valid UNIIs (provider-side data gap), so we deliberately do
 *     NOT call it. Instead we extract the ATC code directly from the
 *     /v1/substances/xref response's `codes` array.
 *
 * OpenFDA / RxNorm / Drug Database are informational only and
 * should never be treated as a substitute for clinical judgement.
 */

const OPENFDA_BASE_URL = 'https://api.fda.gov/drug/label.json';

const RXNORM_BASE_URL = 'https://rxnav.nlm.nih.gov/';

const DRUG_DB_BASE_URL = process.env.DRUG_DATABASE_API_URL || 'https://drug-database.com';
const DRUG_DB_API_KEY = process.env.DRUG_DATABASE_API_KEY || dd_live_ZsxJf9z1GI-YqepLg7WqMn6-d-n4gn_P;

function safeEncode(q) {
  return encodeURIComponent(q || '');
}

async function fetchFromRxNormByName(drugName) {
  if (!drugName) return null;

  try {
    const { data } = await axios.get(`${RXNORM_BASE_URL}REST/rxcui.json?name=${safeEncode(drugName)}`, {
      timeout: 10000,
    });

    const rxcuis = data?.idGroup?.rxnormId || [];
    if (!rxcuis.length) return null;

    const rxcui = Array.isArray(rxcuis) ? rxcuis[0] : null;
    if (!rxcui) return null;

    const nameResp = await axios.get(
      `${RXNORM_BASE_URL}REST/clinDrugName.json?rxcui=${safeEncode(rxcui)}`,
      { timeout: 10000 }
    );

    const names = nameResp?.data?.names || nameResp?.data?.nameGroup?.name || [];

    return {
      source: 'rxnorm',
      brandName: null,
      genericName: Array.isArray(names) ? names[0]?.name || null : null,
      manufacturer: null,
      composition: null,
      warnings: null,
      drugInteractionsText: null,
      contraindicationsText: null,
      dosageText: null,
    };
  } catch (err) {
    console.error('RxNorm lookup failed for', drugName, '-', err.response?.status || err.message);
    return null;
  }
}

async function fetchFromOpenFDA(drugName) {
  if (!drugName) return null;

  const searchAttempts = [
    `openfda.brand_name:"${drugName}"`,
    `openfda.generic_name:"${drugName}"`,
  ];

  for (const search of searchAttempts) {
    try {
      const { data } = await axios.get(OPENFDA_BASE_URL, {
        params: { search, limit: 1 },
        timeout: 10000,
      });

      const result = data?.results?.[0];
      if (!result) continue;

      return {
        source: 'openfda',
        brandName: result.openfda?.brand_name?.[0] || drugName,
        genericName: result.openfda?.generic_name?.[0] || null,
        manufacturer: result.openfda?.manufacturer_name?.[0] || null,
        composition: result.active_ingredient?.[0]?.slice(0, 500) || null,
        warnings: result.warnings?.[0]?.slice(0, 1000) || null,
        drugInteractionsText: result.drug_interactions?.[0]?.slice(0, 1000) || null,
        contraindicationsText: result.contraindications?.[0]?.slice(0, 1000) || null,
        dosageText: result.dosage_and_administration?.[0]?.slice(0, 1000) || null,
      };
    } catch (err) {
      console.error('OpenFDA lookup failed for', search, '-', err.response?.status || err.message);
      continue;
    }
  }

  return null;
}

async function lookupDrug(drugName) {
  if (!drugName || !drugName.trim()) {
    return { found: false, source: null, data: null };
  }

  const localMatch = await Medicine.findOne({
    $or: [
      { brandName: new RegExp(`^${drugName}$`, 'i') },
      { genericName: new RegExp(`^${drugName}$`, 'i') },
      { composition: new RegExp(drugName, 'i') },
    ],
  }).lean();

  if (localMatch) {
    return { found: true, source: 'local', data: localMatch };
  }

  const openFDAResult = await fetchFromOpenFDA(drugName);
  if (openFDAResult) {
    return { found: true, source: 'openfda', data: openFDAResult };
  }

  const rxNormResult = await fetchFromRxNormByName(drugName);
  if (rxNormResult) {
    return { found: true, source: 'rxnorm', data: rxNormResult };
  }

  return { found: false, source: null, data: null };
}

async function lookupMultipleDrugs(drugNames = []) {
  const results = await Promise.all(
    drugNames.map(async (name) => ({
      query: name,
      ...(await lookupDrug(name)),
    }))
  );
  return results;
}

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
  const codes = xrefData?.codes || [];

  const whoAtc = codes.find((c) => c.system === 'WHO-ATC');
  if (whoAtc?.code) return whoAtc.code;

  const whoVatc = codes.find((c) => c.system === 'WHO-VATC' && c.code?.startsWith('Q'));
  if (whoVatc?.code) return whoVatc.code.slice(1);

  return null;
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

module.exports = {
  lookupDrug,
  lookupMultipleDrugs,
  fetchFromOpenFDA,
  findAlternativesFromDrugDatabase,
};