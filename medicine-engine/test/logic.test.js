/**
 * Medicine Engine Logic Tests
 * Tests core medicine composition and recommendation engine
 */

const engine = require('../index');

// Test counters
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertDefined(value, message) {
  if (value === undefined || value === null) {
    throw new Error(`${message}: value is not defined`);
  }
}

// ========================================
// TEST SUITE
// ========================================

console.log('🧪 Medicine Engine Tests\n');

// Test 1: Module exports
test('Module exports all required functions', () => {
  assertDefined(engine.analyzeSymptoms, 'analyzeSymptoms not found');
  assertDefined(engine.checkMedicineInteractions, 'checkMedicineInteractions not found');
  assertDefined(engine.generateRecommendation, 'generateRecommendation not found');
  assertDefined(engine.calculateDuration, 'calculateDuration not found');
  assertDefined(engine.SYMPTOM_KNOWLEDGE_BASE, 'SYMPTOM_KNOWLEDGE_BASE not found');
  assertDefined(engine.AI_LABEL, 'AI_LABEL not found');
});

// Test 2: Symptom analysis - fever
test('analyzeSymptoms detects fever symptoms', () => {
  const result = engine.analyzeSymptoms('I have high fever and chills');
  assert(result.matchScore > 0, 'Should have positive match score');
  assert(result.probableDiagnoses.length > 0, 'Should return probable diagnoses');
  assert(result.medicineSuggestions.length > 0, 'Should return medicine suggestions');
});

// Test 3: Symptom analysis - cough
test('analyzeSymptoms detects cough and cold symptoms', () => {
  const result = engine.analyzeSymptoms('bad cough and sore throat');
  assert(result.matchScore > 0, 'Should have positive match score');
  assert(result.probableDiagnoses.length > 0, 'Should return probable diagnoses');
});

// Test 4: Symptom analysis - headache
test('analyzeSymptoms detects headache', () => {
  const result = engine.analyzeSymptoms('severe migraine headache');
  assert(result.matchScore > 0, 'Should have positive match score');
  assertEquals(result.probableDiagnoses[0].diagnosis, 'Tension headache', 'Should return tension headache diagnosis');
});

// Test 5: Symptom analysis - no match
test('analyzeSymptoms handles unknown symptoms gracefully', () => {
  const result = engine.analyzeSymptoms('xyz unknown symptom abc');
  assertEquals(result.matchScore, 0, 'Should have zero match score');
  assertEquals(result.probableDiagnoses.length, 0, 'Should return empty diagnoses');
});

// Test 6: Invalid symptom input
test('analyzeSymptoms handles invalid input', () => {
  const result = engine.analyzeSymptoms(null);
  assert(result.error !== undefined, 'Should return error object');
  assertEquals(result.matchScore, 0, 'Should have zero match score');
});

// Test 7: Medicine interactions - no interactions
test('checkMedicineInteractions detects no conflicts with different medicines', () => {
  const medicines = ['Aspirin', 'Crocin'];
  const result = engine.checkMedicineInteractions(medicines);
  assertEquals(result.length, 0, 'Should return no interactions');
});

// Test 8: Medicine interactions - detection
test('checkMedicineInteractions detects Paracetamol-Aspirin conflict', () => {
  const medicines = ['Paracetamol', 'Aspirin'];
  const result = engine.checkMedicineInteractions(medicines);
  assert(result.length > 0, 'Should detect interaction');
  assertEquals(result[0].severity, 'moderate', 'Should be moderate severity');
});

// Test 9: Medicine interactions - invalid input
test('checkMedicineInteractions handles non-array input', () => {
  const result = engine.checkMedicineInteractions(null);
  assertEquals(result.length, 0, 'Should return empty array');
});

// Test 10: Generate recommendation - success
test('generateRecommendation creates valid recommendation', () => {
  const result = engine.generateRecommendation({
    symptoms: 'fever and headache',
    currentMedicines: [],
  });
  assert(result.success === true, 'Should succeed');
  assertDefined(result.timestamp, 'Should have timestamp');
  assertEquals(result.label, engine.AI_LABEL, 'Should have correct label');
  assertDefined(result.analysis, 'Should have analysis');
});

// Test 11: Generate recommendation - missing symptoms
test('generateRecommendation fails without symptoms', () => {
  const result = engine.generateRecommendation({ currentMedicines: [] });
  assert(result.success === false, 'Should fail');
  assertDefined(result.error, 'Should have error message');
});

// Test 12: Calculate duration - valid medicines
test('calculateDuration computes correct duration', () => {
  const medicines = [
    { durationDays: 3, frequency: 'Every 6 hours daily' },
    { durationDays: 5, frequency: 'Twice daily' },
  ];
  const result = engine.calculateDuration(medicines);
  assertEquals(result.maxDays, 5, 'Should return max duration');
  assert(result.totalPills > 0, 'Should calculate total pills');
});

// Test 13: Calculate duration - empty input
test('calculateDuration handles empty input', () => {
  const result = engine.calculateDuration([]);
  assertEquals(result.maxDays, 0, 'Should return 0 max days');
  assertEquals(result.totalPills, 0, 'Should return 0 total pills');
});

// Test 14: Knowledge base integrity
test('SYMPTOM_KNOWLEDGE_BASE has valid structure', () => {
  assert(Array.isArray(engine.SYMPTOM_KNOWLEDGE_BASE), 'Should be an array');
  assert(engine.SYMPTOM_KNOWLEDGE_BASE.length > 0, 'Should have entries');
  
  const entry = engine.SYMPTOM_KNOWLEDGE_BASE[0];
  assertDefined(entry.keywords, 'Entry should have keywords');
  assertDefined(entry.probableDiagnoses, 'Entry should have diagnoses');
  assertDefined(entry.medicineSuggestions, 'Entry should have medicines');
  assertDefined(entry.clinicalAdvice, 'Entry should have clinical advice');
});

// Test 15: AI label constant
test('AI_LABEL is correctly set', () => {
  assertEquals(engine.AI_LABEL, 'AI Suggested - Pending Doctor Approval', 'AI label should match requirement');
});

// ========================================
// RESULTS
// ========================================

console.log(`\n${'='.repeat(50)}`);
console.log(`Tests Passed: ${passed}`);
console.log(`Tests Failed: ${failed}`);
console.log(`Total Tests: ${passed + failed}`);
console.log(`${'='.repeat(50)}`);

if (failed > 0) {
  process.exit(1);
}

process.exit(0);
