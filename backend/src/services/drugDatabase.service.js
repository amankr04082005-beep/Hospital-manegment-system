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
 *
 * OpenFDA is a public FDA dataset — it is informational only and
 * should never be treated as a substitute for clinical judgement.
 */

const OPENFDA_BASE_URL = 'https://api.fda.gov/drug/label.json';

/**
 * Query OpenFDA for a drug by brand name or generic name.
 * Returns a normalized subset of fields, or null if nothing is found
 * or the request fails (network issues, no match, rate limit, etc).
 */
async function fetchFromOpenFDA(drugName) {
  if (!drugName) return null;

  // Try brand name first, then generic name, since OpenFDA indexes them separately.
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
      // 404 / no match / rate limit — just try the next search strategy.
      console.error('OpenFDA lookup failed for', search, '-', err.response?.status || err.message);
      continue;
    }
  }

  return null;
}

/**
 * Look up a single drug by name.
 * Checks the local curated database first; falls back to OpenFDA.
 */
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

  const externalMatch = await fetchFromOpenFDA(drugName);
  if (externalMatch) {
    return { found: true, source: 'openfda', data: externalMatch };
  }

  return { found: false, source: null, data: null };
}

/**
 * Search multiple drugs at once (e.g. checking a whole prescription list).
 */
async function lookupMultipleDrugs(drugNames = []) {
  const results = await Promise.all(
    drugNames.map(async (name) => ({
      query: name,
      ...(await lookupDrug(name)),
    }))
  );
  return results;
}

module.exports = {
  lookupDrug,
  lookupMultipleDrugs,
  fetchFromOpenFDA,
};
