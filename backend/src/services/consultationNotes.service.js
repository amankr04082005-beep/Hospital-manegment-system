/**
 * SRS Module 7 — AI Voice Assistant: Auto Clinical Notes Generation.
 *
 * Takes a raw doctor-patient conversation transcript (captured in the
 * browser via the Web Speech API) and produces structured clinical
 * notes. This is a MOCK/simulated engine — no external API call, no
 * cost, no quota limits — mirroring the same approach used for
 * aiClinicalDecisionSupport.service.js. The output shape is what a
 * real LLM-backed summarizer would return, so it can be swapped later
 * without touching any caller.
 */

const COMPLAINT_KEYWORDS = ['pain', 'fever', 'cough', 'headache', 'ache', 'hurt', 'feeling', 'since', 'days'];
const HISTORY_KEYWORDS = ['history', 'before', 'previously', 'last time', 'diagnosed', 'surgery', 'allergic', 'allergy'];
const OBSERVATION_KEYWORDS = ['temperature', 'bp', 'blood pressure', 'pulse', 'looks', 'appears', 'examination', 'exam'];
const PLAN_KEYWORDS = ['prescribe', 'take', 'medicine', 'tablet', 'rest', 'follow up', 'follow-up', 'test', 'advise', 'recommend'];

/**
 * Splits a transcript into sentences and buckets each one into the
 * clinical note section whose keywords it best matches.
 */
function classifyTranscript(rawTranscript) {
  const sentences = rawTranscript
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const buckets = {
    chiefComplaint: [],
    historyOfPresentIllness: [],
    observations: [],
    plan: [],
  };

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();

    if (PLAN_KEYWORDS.some((kw) => lower.includes(kw))) {
      buckets.plan.push(sentence);
    } else if (OBSERVATION_KEYWORDS.some((kw) => lower.includes(kw))) {
      buckets.observations.push(sentence);
    } else if (HISTORY_KEYWORDS.some((kw) => lower.includes(kw))) {
      buckets.historyOfPresentIllness.push(sentence);
    } else if (COMPLAINT_KEYWORDS.some((kw) => lower.includes(kw))) {
      buckets.chiefComplaint.push(sentence);
    } else {
      // Unclassified small-talk / filler — default into history so nothing is silently dropped.
      buckets.historyOfPresentIllness.push(sentence);
    }
  }

  return buckets;
}

/**
 * Main entry point: takes the raw transcript text and returns a
 * structured notes object ready to store on prescription.consultationNotes.
 */
function generateClinicalNotes(rawTranscript) {
  const trimmed = (rawTranscript || '').trim();

  if (!trimmed) {
    return {
      rawTranscript: '',
      structuredNotes: {
        chiefComplaint: 'No conversation captured.',
        historyOfPresentIllness: '',
        observations: '',
        plan: '',
      },
    };
  }

  const buckets = classifyTranscript(trimmed);

  return {
    rawTranscript: trimmed,
    structuredNotes: {
      chiefComplaint: buckets.chiefComplaint.join(' ') || 'Not explicitly mentioned in captured conversation.',
      historyOfPresentIllness: buckets.historyOfPresentIllness.join(' ') || 'None captured.',
      observations: buckets.observations.join(' ') || 'None captured.',
      plan: buckets.plan.join(' ') || 'None captured.',
    },
  };
}

module.exports = { generateClinicalNotes };