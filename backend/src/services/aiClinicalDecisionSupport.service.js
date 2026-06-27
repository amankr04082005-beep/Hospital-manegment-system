const Medicine = require('../models/Medicine');

/**
 * SRS Module 5 — Step 2 & 3: AI Analysis + AI Recommendations.
 *
 * This service ONLY produces a recommendation object. It never writes
 * directly to a Prescription as "final" content, and it never marks a
 * prescription as approved. That gate is enforced exclusively in
 * prescriptionService.approvePrescription() by a doctor.
 *
 * NOTE: This version uses a built-in MOCK/simulated AI engine instead of
 * calling an external LLM (OpenAI/Gemini/etc). This avoids API costs,
 * quota limits (HTTP 429), and network dependency — useful for demos,
 * grading, and offline development. The output shape is identical to
 * what a real LLM-backed implementation would return, so this can be
 * swapped for a real API call later without touching any other file.
 */

const AI_LABEL = 'AI Suggested - Pending Doctor Approval'; // Rule 1

// Simple keyword -> clinical suggestion knowledge base.
// Each entry mimics what an LLM might return for that symptom pattern.
const SYMPTOM_KNOWLEDGE_BASE = [
  {
    keywords: ['fever', 'temperature', 'chills'],
    probableDiagnoses: [
      { diagnosis: 'Viral fever', confidence: 0.7 },
      { diagnosis: 'Common cold / Upper respiratory infection', confidence: 0.5 },
    ],
    medicineSuggestions: [
      {
        brandName: 'Dolo 650',
        genericName: 'Paracetamol',
        composition: 'Paracetamol 650mg',
        dosage: '1 tablet',
        frequency: 'Every 6-8 hours as needed',
        durationDays: 3,
        instructions: 'Take after food. Do not exceed 4 tablets in 24 hours.',
      },
    ],
    clinicalAdvice: {
      dietRecommendations: ['Drink plenty of fluids', 'Light, easily digestible meals'],
      lifestyleRecommendations: ['Adequate rest', 'Avoid strenuous activity'],
      followUpSuggestions: ['Follow up if fever persists beyond 3 days'],
      suggestedLabTests: ['CBC if fever persists beyond 3 days'],
    },
  },
  {
    keywords: ['cough', 'cold', 'sore throat', 'throat pain'],
    probableDiagnoses: [
      { diagnosis: 'Acute upper respiratory tract infection', confidence: 0.65 },
    ],
    medicineSuggestions: [
      {
        brandName: 'Benadryl',
        genericName: 'Diphenhydramine',
        composition: 'Diphenhydramine 12.5mg',
        dosage: '10ml',
        frequency: 'Twice daily',
        durationDays: 5,
        instructions: 'Take after food. May cause drowsiness.',
      },
    ],
    clinicalAdvice: {
      dietRecommendations: ['Warm fluids', 'Avoid cold drinks/ice cream'],
      lifestyleRecommendations: ['Steam inhalation', 'Gargle with warm salt water'],
      followUpSuggestions: ['Follow up if symptoms persist beyond 5-7 days'],
      suggestedLabTests: [],
    },
  },
  {
    keywords: ['headache', 'migraine'],
    probableDiagnoses: [{ diagnosis: 'Tension headache', confidence: 0.6 }],
    medicineSuggestions: [
      {
        brandName: 'Crocin',
        genericName: 'Paracetamol',
        composition: 'Paracetamol 500mg',
        dosage: '1 tablet',
        frequency: 'Every 8 hours as needed',
        durationDays: 2,
        instructions: 'Take after food.',
      },
    ],
    clinicalAdvice: {
      dietRecommendations: ['Stay hydrated'],
      lifestyleRecommendations: ['Reduce screen time', 'Adequate sleep'],
      followUpSuggestions: ['Follow up if headaches are recurrent or severe'],
      suggestedLabTests: [],
    },
  },
  {
    keywords: ['stomach', 'abdominal', 'nausea', 'vomit', 'diarrhea', 'loose motion'],
    probableDiagnoses: [{ diagnosis: 'Acute gastroenteritis', confidence: 0.55 }],
    medicineSuggestions: [
      {
        brandName: 'ORS',
        genericName: 'Oral Rehydration Salts',
        composition: 'Electrolyte mixture',
        dosage: '1 sachet in 1L water',
        frequency: 'Sip throughout the day',
        durationDays: 3,
        instructions: 'Continue normal feeding. Avoid oily/spicy food.',
      },
    ],
    clinicalAdvice: {
      dietRecommendations: ['Bland diet (BRAT: banana, rice, applesauce, toast)', 'Avoid dairy and oily food'],
      lifestyleRecommendations: ['Rest', 'Maintain hand hygiene'],
      followUpSuggestions: ['Seek care urgently if signs of dehydration appear'],
      suggestedLabTests: ['Stool routine examination if symptoms persist'],
    },
  },
];

const DEFAULT_SUGGESTION = {
  probableDiagnoses: [
    { diagnosis: 'Nonspecific presentation — clinical correlation advised', confidence: 0.3 },
  ],
  medicineSuggestions: [],
  clinicalAdvice: {
    dietRecommendations: ['Maintain adequate hydration'],
    lifestyleRecommendations: ['Adequate rest'],
    followUpSuggestions: ['Doctor to assess further based on examination'],
    suggestedLabTests: [],
  },
};

/**
 * Simulates an LLM call: matches the patient's symptom text against
 * a small knowledge base and returns a structured suggestion object.
 * Always resolves (never throws), so the UI never sees a 429 or
 * network failure — this mirrors a real implementation's shape exactly.
 */
async function callLanguageModel({ symptoms = '' }) {
  // Simulate a short "thinking" delay so the UI loading state feels real.
  await new Promise((resolve) => setTimeout(resolve, 400));

  const lowerSymptoms = symptoms.toLowerCase();
  const matches = SYMPTOM_KNOWLEDGE_BASE.filter((entry) =>
    entry.keywords.some((kw) => lowerSymptoms.includes(kw))
  );

  if (matches.length === 0) {
    return DEFAULT_SUGGESTION;
  }

  // Merge all matching entries (a patient may report multiple symptom groups).
  const merged = matches.reduce(
    (acc, entry) => ({
      probableDiagnoses: [...acc.probableDiagnoses, ...entry.probableDiagnoses],
      medicineSuggestions: [...acc.medicineSuggestions, ...entry.medicineSuggestions],
      clinicalAdvice: {
        dietRecommendations: [...acc.clinicalAdvice.dietRecommendations, ...entry.clinicalAdvice.dietRecommendations],
        lifestyleRecommendations: [
          ...acc.clinicalAdvice.lifestyleRecommendations,
          ...entry.clinicalAdvice.lifestyleRecommendations,
        ],
        followUpSuggestions: [
          ...acc.clinicalAdvice.followUpSuggestions,
          ...entry.clinicalAdvice.followUpSuggestions,
        ],
        suggestedLabTests: [...acc.clinicalAdvice.suggestedLabTests, ...entry.clinicalAdvice.suggestedLabTests],
      },
    }),
    {
      probableDiagnoses: [],
      medicineSuggestions: [],
      clinicalAdvice: {
        dietRecommendations: [],
        lifestyleRecommendations: [],
        followUpSuggestions: [],
        suggestedLabTests: [],
      },
    }
  );

  // De-duplicate simple string lists.
  merged.clinicalAdvice.dietRecommendations = [...new Set(merged.clinicalAdvice.dietRecommendations)];
  merged.clinicalAdvice.lifestyleRecommendations = [...new Set(merged.clinicalAdvice.lifestyleRecommendations)];
  merged.clinicalAdvice.followUpSuggestions = [...new Set(merged.clinicalAdvice.followUpSuggestions)];
  merged.clinicalAdvice.suggestedLabTests = [...new Set(merged.clinicalAdvice.suggestedLabTests)];

  return merged;
}

async function checkAllergyAlerts(allergies = [], suggestedMedicines = []) {
  const alerts = [];
  for (const med of suggestedMedicines) {
    const catalogMatch = await Medicine.findOne({ composition: new RegExp(med.composition || '', 'i') });
    if (catalogMatch && catalogMatch.isPenicillinBased && allergies.some((a) => /penicillin/i.test(a))) {
      alerts.push(`Penicillin based medicine detected: ${med.brandName || med.genericName}`);
    }
  }
  return alerts;
}

async function checkContraindications(existingDiseases = [], suggestedMedicines = []) {
  const alerts = [];
  const diseaseMap = { 'kidney disease': 'kidney_disease', 'liver disease': 'liver_disease' };
  const patientFlags = existingDiseases
    .map((d) => diseaseMap[d.toLowerCase()])
    .filter(Boolean);

  for (const med of suggestedMedicines) {
    const catalogMatch = await Medicine.findOne({ composition: new RegExp(med.composition || '', 'i') });
    if (!catalogMatch) continue;
    const conflicts = catalogMatch.contraindications.filter((c) => patientFlags.includes(c));
    if (conflicts.length) {
      alerts.push(
        `${med.brandName || med.genericName} may be contraindicated due to: ${conflicts.join(', ')}`
      );
    }
  }
  return alerts;
}

async function checkDrugInteractions(currentMedications = [], suggestedMedicines = []) {
  const warnings = [];
  for (const newMed of suggestedMedicines) {
    const catalogMatch = await Medicine.findOne({ composition: new RegExp(newMed.composition || '', 'i') });
    if (!catalogMatch || !catalogMatch.interactsWith?.length) continue;
    for (const existing of currentMedications) {
      const hit = catalogMatch.interactsWith.find((i) =>
        new RegExp(i.composition, 'i').test(existing)
      );
      if (hit) {
        warnings.push({
          severity: hit.severity,
          description: `${newMed.brandName || newMed.genericName} + ${existing}: ${hit.note}`,
        });
      }
    }
  }
  return warnings;
}

/**
 * Main entry point: SRS Module 5 Step 1-3.
 * Returns a recommendation object tagged with the compliance label.
 * Caller (prescriptionService) is responsible for persisting this
 * under prescription.aiRecommendation — NEVER under finalMedicines.
 */
async function generateClinicalRecommendation({
  symptoms,
  medicalHistory,
  allergies = [],
  existingDiseases = [],
  currentMedications = [],
  labReports = [],
}) {
  const aiOutput = await callLanguageModel({ symptoms });

  const medicineSuggestions = (aiOutput.medicineSuggestions || []).map((m) => ({
    ...m,
    source: 'ai_suggested',
  }));

  const [allergyAlerts, contraindicationAlerts, interactionWarnings] = await Promise.all([
    checkAllergyAlerts(allergies, medicineSuggestions),
    checkContraindications(existingDiseases, medicineSuggestions),
    checkDrugInteractions(currentMedications, medicineSuggestions),
  ]);

  return {
    label: AI_LABEL,
    probableDiagnoses: aiOutput.probableDiagnoses || [],
    medicineSuggestions,
    clinicalAdvice: aiOutput.clinicalAdvice || {
      dietRecommendations: [],
      lifestyleRecommendations: [],
      followUpSuggestions: [],
      suggestedLabTests: [],
    },
    interactionWarnings,
    allergyAlerts,
    contraindicationAlerts,
    generatedAt: new Date(),
    aiModelVersion: 'mock-clinical-engine-v1',
  };
}

module.exports = {
  AI_LABEL,
  generateClinicalRecommendation,
  checkAllergyAlerts,
  checkContraindications,
  checkDrugInteractions,
};