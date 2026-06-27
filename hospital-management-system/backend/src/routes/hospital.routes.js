const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { Branch, Department } = require('../models/Branch');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Patient = require('../models/Patient');

const router = express.Router();
router.use(authenticate);

// Public-ish (any authenticated user) listing for booking flows
router.get('/branches', async (req, res, next) => {
  try {
    const branches = await Branch.find({ isActive: true });
    res.json({ success: true, data: branches });
  } catch (error) {
    next(error);
  }
});

router.get('/departments', async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.branchId) filter.branch = req.query.branchId;
    const departments = await Department.find(filter);
    res.json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
});

router.get('/doctors', async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.departmentId) filter.department = req.query.departmentId;
    const doctors = await Doctor.find(filter)
      .populate('user', 'fullName email mobileNumber')
      .populate('department');
    res.json({ success: true, data: doctors });
  } catch (error) {
    next(error);
  }
});

// SRS Module 2.2 — Receptionist permission: Register Walk-in Patients.
// Creates a new Patient + linked User record for a walk-in who has no
// account yet. No password is required here — the receptionist is
// registering them at the desk, not creating a login the patient will
// use immediately; a random placeholder password is set so the model's
// validation passes, and the patient can set a real password later via
// "forgot password" if they ever want portal access themselves.
router.post('/patients', authorize('appointment:create'), async (req, res, next) => {
  try {
    const { fullName, email, mobileNumber, dob, gender, address, bloodGroup, allergies, existingDiseases } = req.body;

    if (!fullName || !mobileNumber) {
      return res.status(400).json({ success: false, message: 'fullName and mobileNumber are required.' });
    }

    // Walk-ins may not have an email; synthesize a unique placeholder if none given,
    // since User.email is required+unique in the schema.
    const effectiveEmail = email && email.trim() ? email.trim() : `walkin-${Date.now()}@mediflow.local`;

    const existingUser = await User.findOne({ email: effectiveEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'A patient with this email already exists. Search by their existing Patient ID instead.' });
    }

    const placeholderPassword = `Walkin@${Date.now()}`;

    const user = await User.create({
      fullName,
      email: effectiveEmail,
      mobileNumber,
      password: placeholderPassword,
      role: 'patient',
    });

    const patientCode = `PT-${Date.now().toString().slice(-8)}`;
    const patient = await Patient.create({
      user: user._id,
      patientCode,
      dob: dob || new Date('2000-01-01'),
      gender: gender || 'other',
      address,
      bloodGroup: bloodGroup || 'unknown',
      allergies: allergies || [],
      existingDiseases: existingDiseases || [],
    });

    res.status(201).json({ success: true, data: { user: user.toSafeJSON(), patient } });
  } catch (error) {
    next(error);
  }
});

// Admin-only management (Module: Hospital Administrator)
router.post('/branches', authorize('department:manage'), async (req, res, next) => {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
});

router.post('/departments', authorize('department:manage'), async (req, res, next) => {
  try {
    const department = await Department.create(req.body);
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
});

module.exports = router;