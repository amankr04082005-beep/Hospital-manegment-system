const { lookupDrug, lookupMultipleDrugs, fetchFromOpenFDA } = require('../services/drugDatabase.service');

describe('Drug Database Service Unit Tests', () => {
  describe('lookupDrug()', () => {
    it('should return not found for empty input', async () => {
      const result = await lookupDrug('');
      expect(result.found).toBe(false);
    });

    it('should return not found for null input', async () => {
      const result = await lookupDrug(null);
      expect(result.found).toBe(false);
    });

    it('should return not found for whitespace input', async () => {
      const result = await lookupDrug('   ');
      expect(result.found).toBe(false);
    });
  });

  describe('lookupMultipleDrugs()', () => {
    it('should handle empty array', async () => {
      const results = await lookupMultipleDrugs([]);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should return results for each drug', async () => {
      const results = await lookupMultipleDrugs(['Aspirin', '']);
      expect(results.length).toBe(2);
      expect(results[0].query).toBe('Aspirin');
      expect(results[1].query).toBe('');
    }, 15000);
  });

  describe('fetchFromOpenFDA()', () => {
    it('should return null for empty input', async () => {
      const result = await fetchFromOpenFDA('');
      expect(result).toBeNull();
    });

    it('should return null for null input', async () => {
      const result = await fetchFromOpenFDA(null);
      expect(result).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      // This tests the error handling path
      const result = await fetchFromOpenFDA('NONEXISTENT_DRUG_XYZ_12345');
      // Should either return data or null — not throw
      expect(result === null || result.source === 'openfda').toBe(true);
    }, 15000);
  });
});

