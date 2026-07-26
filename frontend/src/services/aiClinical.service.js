import api from './api';

/**
 * AI Clinical Decision Support Service
 * Calls the backend which proxies to Python ML service
 */

const AI_CLINICAL_SERVICE_URL = 'http://127.0.0.1:8000';

/**
 * Get clinical recommendation from Python ML service
 * @param {Object} params - Input parameters
 * @param {string} params.symptoms - Patient symptoms description
 * @param {string[]} params.allergies - Patient allergies
 * @param {string[]} params.existingDiseases - Patient existing conditions
 * @param {string[]} params.currentMedications - Patient current medications
 * @returns {Promise<Object>} Clinical recommendation
 */
export async function getClinicalRecommendation({
  symptoms,
  allergies = [],
  existingDiseases = [],
  currentMedications = [],
}) {
  try {
    const response = await fetch(`${AI_CLINICAL_SERVICE_URL}/api/v1/clinical/recommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms,
        allergies,
        existing_diseases: existingDiseases,
        current_medications: currentMedications,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('AI Clinical service error:', err);
    throw err;
  }
}

/**
 * Check health of Python ML service
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${AI_CLINICAL_SERVICE_URL}/api/v1/health`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
