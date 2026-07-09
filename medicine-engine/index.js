/**
 * Medicine Composition & AI Clinical Decision Support Engine
 * 
 * This module provides:
 * 1. Symptom-to-medicine recommendation logic
 * 2. Medicine interaction checking
 * 3. Clinical advice generation
 * 4. Dosage and duration calculations
 */

const AI_LABEL = 'AI Suggested - Pending Doctor Approval';

// Symptom knowledge base with clinical recommendations
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
        frequency: 'Sip frequently',
        durationDays: 3,
        instructions: 'Mix in boiled and cooled water. Drink throughout the day.',
      },
    ],
    clinicalAdvice: {
      dietRecommendations: ['Light diet', 'BRAT diet (banana, rice, applesauce, toast)'],
      lifestyleRecommendations: ['Rest', 'Avoid dairy and fatty foods'],
      followUpSuggestions: ['Seek medical advice if symptoms persist or worsen'],
      suggestedLabTests: ['Stool test if diarrhea persists beyond 3 days'],
    },
  },
];

/**
 * Match symptoms to knowledge base and generate AI recommendations
 * @param {string} symptoms - Patient's symptom description
 * @returns {object} Recommendation object with diagnoses and medicines
 */
function analyzeSymptoms(symptoms) {
  if (!symptoms || typeof symptoms !== 'string') {
    return {
      matchScore: 0,
      probableDiagnoses: [],
      medicineSuggestions: [],
      clinicalAdvice: null,
      error: 'Invalid symptoms input',
    };
  }

  const lowerSymptoms = symptoms.toLowerCase();
  let bestMatch = null;
  let bestMatchScore = 0;

  // Find best match from knowledge base
  for (const entry of SYMPTOM_KNOWLEDGE_BASE) {
    let matchCount = 0;
    for (const keyword of entry.keywords) {
      if (lowerSymptoms.includes(keyword)) {
        matchCount++;
      }
    }

    const matchScore = matchCount / entry.keywords.length;
    if (matchScore > bestMatchScore) {
      bestMatchScore = matchScore;
      bestMatch = entry;
    }
  }

  if (!bestMatch) {
    return {
      matchScore: 0,
      probableDiagnoses: [],
      medicineSuggestions: [],
      clinicalAdvice: null,
      message: 'No matching symptoms found',
    };
  }

  return {
    matchScore: bestMatchScore,
    probableDiagnoses: bestMatch.probableDiagnoses,
    medicineSuggestions: bestMatch.medicineSuggestions,
    clinicalAdvice: bestMatch.clinicalAdvice,
  };
}

/**
 * Check for medicine interactions
 * @param {array} medicines - Array of medicine compositions
 * @returns {array} Array of interaction warnings
 */
function checkMedicineInteractions(medicines) {
  if (!Array.isArray(medicines)) {
    return [];
  }

  const interactions = [];
  
  // Simple interaction logic - can be extended with a database
  const interactionMap = {
    'Paracetamol': ['Aspirin', 'Ibuprofen'],
    'Diphenhydramine': ['Alcohol'],
  };

  for (let i = 0; i < medicines.length; i++) {
    for (let j = i + 1; j < medicines.length; j++) {
      const med1 = medicines[i];
      const med2 = medicines[j];

      if (interactionMap[med1] && interactionMap[med1].includes(med2)) {
        interactions.push({
          severity: 'moderate',
          medicine1: med1,
          medicine2: med2,
          note: `Potential interaction between ${med1} and ${med2}`,
        });
      }
    }
  }

  return interactions;
}

/**
 * Generate prescription recommendations based on analysis
 * @param {object} options - Configuration options
 * @returns {object} Complete recommendation package
 */
function generateRecommendation(options = {}) {
  const { symptoms, currentMedicines = [] } = options;

  if (!symptoms) {
    return {
      success: false,
      error: 'Symptoms are required',
    };
  }

  const analysis = analyzeSymptoms(symptoms);
  const interactions = checkMedicineInteractions(currentMedicines);

  return {
    success: true,
    timestamp: new Date().toISOString(),
    label: AI_LABEL,
    analysis,
    interactions,
    medicines: analysis.medicineSuggestions,
    clinicalAdvice: analysis.clinicalAdvice,
  };
}

/**
 * Calculate total duration and pill count
 * @param {array} medicines - Array of medicine suggestions
 * @returns {object} Duration stats
 */
function calculateDuration(medicines) {
  if (!Array.isArray(medicines) || medicines.length === 0) {
    return { maxDays: 0, totalPills: 0 };
  }

  let maxDays = 0;
  let totalPills = 0;

  medicines.forEach((med) => {
    if (med.durationDays) {
      maxDays = Math.max(maxDays, med.durationDays);
      // Simple calculation: assume 1 tablet per frequency instance
      const frequencyCount = (med.frequency.match(/day/i) || ['1']).length;
      totalPills += frequencyCount * med.durationDays;
    }
  });

  return { maxDays, totalPills };
}

// Export public API
module.exports = {
  analyzeSymptoms,
  checkMedicineInteractions,
  generateRecommendation,
  calculateDuration,
  SYMPTOM_KNOWLEDGE_BASE,
  AI_LABEL,
};
