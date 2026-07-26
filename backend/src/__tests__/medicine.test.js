const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Medicine = require('../models/Medicine');
const User = require('../models/User');

describe('Medicine API Integration Tests', () => {
  let doctorToken;
  let pharmacistToken;
  let testMedicineId;

  const testDoctor = {
    fullName: 'Dr. Test',
    email: 'dr.medtest@hospital.com',
    password: 'TestPass123!',
    role: 'doctor',
    mobileNumber: '+911111111111',
  };

  const testPharmacist = {
    fullName: 'Pharm Test',
    email: 'pharm.medtest@hospital.com',
    password: 'TestPass123!',
    role: 'pharmacist',
    mobileNumber: '+912222222222',
  };

  beforeAll(async () => {
    const testUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/hospital_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testUri);
    }

    // Create test data
    await Medicine.create({
      brandName: 'TestParacetamol',
      genericName: 'Paracetamol',
      composition: 'Paracetamol 650mg',
      category: 'Analgesic',
      form: 'tablet',
      stockQuantity: 100,
      lowStockThreshold: 10,
    });

    const doctorRes = await request(app).post('/api/auth/register').send(testDoctor);
    doctorToken = doctorRes.body.data?.token;

    await User.deleteOne({ email: testPharmacist.email });
    const pharmRes = await request(app).post('/api/auth/register').send(testPharmacist);
    pharmacistToken = pharmRes.body.data?.token;
  });

  afterAll(async () => {
    await Medicine.deleteOne({ brandName: 'TestParacetamol' });
    await User.deleteOne({ email: testDoctor.email });
    await User.deleteOne({ email: testPharmacist.email });
    await mongoose.disconnect();
  });

  describe('GET /api/medicines/search', () => {
    it('should search medicines by query', async () => {
      const res = await request(app)
        .get('/api/medicines/search?q=TestParacetamol')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].brandName).toContain('TestParacetamol');
    });

    it('should return empty array for no query', async () => {
      const res = await request(app)
        .get('/api/medicines/search')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/medicines/inventory', () => {
    it('should return inventory list', async () => {
      const res = await request(app)
        .get('/api/medicines/inventory')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});

