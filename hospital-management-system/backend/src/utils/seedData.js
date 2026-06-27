require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { Branch, Department } = require('../models/Branch');
const Medicine = require('../models/Medicine');

async function seed() {
  await connectDB();

  console.log('Clearing existing demo data...');
  await Promise.all([
    User.deleteMany({}),
    Patient.deleteMany({}),
    Doctor.deleteMany({}),
    Branch.deleteMany({}),
    Department.deleteMany({}),
    Medicine.deleteMany({}),
  ]);

  const branch = await Branch.create({
    name: 'City Central Hospital',
    address: '12 MG Road',
    city: 'Bengaluru',
    contactNumber: '+91-80-1234-5678',
  });

  const department = await Department.create({
    name: 'General Medicine',
    branch: branch._id,
    description: 'General physician consultations',
  });

  const adminUser = await User.create({
    fullName: 'System Admin',
    email: 'admin@hospital.com',
    mobileNumber: '+919900000001',
    password: 'Admin@1234',
    role: 'admin',
  });

  const doctorUser = await User.create({
    fullName: 'Dr. Anjali Rao',
    email: 'doctor@hospital.com',
    mobileNumber: '+919900000002',
    password: 'Doctor@1234',
    role: 'doctor',
  });

  const doctorProfile = await Doctor.create({
    user: doctorUser._id,
    qualification: 'MBBS, MD (General Medicine)',
    registrationNumber: 'KMC-2014-00231',
    department: department._id,
    specialization: 'General Medicine',
    yearsOfExperience: 10,
    consultationFee: 500,
    availability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 15 }],
  });

  const receptionistUser = await User.create({
    fullName: 'Reception Desk',
    email: 'reception@hospital.com',
    mobileNumber: '+919900000003',
    password: 'Reception@1234',
    role: 'receptionist',
  });

  const pharmacistUser = await User.create({
    fullName: 'Pharmacy Staff',
    email: 'pharmacist@hospital.com',
    mobileNumber: '+919900000004',
    password: 'Pharmacist@1234',
    role: 'pharmacist',
  });

  const patientUser = await User.create({
    fullName: 'Ramesh Kumar',
    email: 'patient@hospital.com',
    mobileNumber: '+919900000005',
    password: 'Patient@1234',
    role: 'patient',
  });

  const patientProfile = await Patient.create({
    user: patientUser._id,
    patientCode: 'PT-00000001',
    dob: new Date('1990-05-15'),
    gender: 'male',
    address: { line1: '45 Residency Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560025' },
    emergencyContact: { name: 'Sita Kumar', relationship: 'Spouse', mobileNumber: '+919900000006' },
    bloodGroup: 'B+',
    allergies: ['Penicillin'],
    existingDiseases: [],
    chronicMedications: [],
    familyHistory: { diabetes: true, hypertension: false, heartDisease: false },
  });

  // SRS Module 6 example data: Dolo 650 / Crocin 650 / Calpol 650
  await Medicine.insertMany([
    {
      brandName: 'Dolo 650',
      genericName: 'Paracetamol',
      composition: 'Paracetamol 650mg',
      manufacturer: 'Micro Labs',
      form: 'tablet',
      category: 'Analgesic/Antipyretic',
      isPenicillinBased: false,
      contraindications: ['liver_disease'],
    },
    {
      brandName: 'Crocin 650',
      genericName: 'Paracetamol',
      composition: 'Paracetamol 650mg',
      manufacturer: 'GSK',
      form: 'tablet',
      category: 'Analgesic/Antipyretic',
      isPenicillinBased: false,
      contraindications: ['liver_disease'],
    },
    {
      brandName: 'Calpol 650',
      genericName: 'Paracetamol',
      composition: 'Paracetamol 650mg',
      manufacturer: 'Sanofi',
      form: 'tablet',
      category: 'Analgesic/Antipyretic',
      isPenicillinBased: false,
      contraindications: ['liver_disease'],
    },
    {
      brandName: 'Augmentin 625',
      genericName: 'Amoxicillin + Clavulanate',
      composition: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
      manufacturer: 'GSK',
      form: 'tablet',
      category: 'Antibiotic',
      isPenicillinBased: true,
      contraindications: ['kidney_disease'],
      interactsWith: [{ composition: 'Warfarin', severity: 'moderate', note: 'May increase bleeding risk' }],
    },
  ]);

  console.log('Seed complete.');
  console.log('Demo logins:');
  console.log('  Admin:        admin@hospital.com / Admin@1234');
  console.log('  Doctor:       doctor@hospital.com / Doctor@1234');
  console.log('  Receptionist: reception@hospital.com / Reception@1234');
  console.log('  Pharmacist:   pharmacist@hospital.com / Pharmacist@1234');
  console.log('  Patient:      patient@hospital.com / Patient@1234');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
