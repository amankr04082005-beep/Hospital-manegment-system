const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { Branch, Department } = require('../models/Branch');

const router = express.Router();
router.use(authenticate);

// All routes below are admin-only. Kept inline (no separate RBAC permission
// strings) to match this project's existing pattern in emr.routes.js /
// hospital.routes.js for simple admin-only inline routes — and because
// "is this user an admin" is a simpler check than the granular
// resource-level permissions used elsewhere (e.g. 'prescription:approve').
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
}
router.use(requireAdmin);

// SRS Module 2.5 — Hospital Administrator permission: User Management.
// GET /api/admin/users?role=doctor  — list every staff/patient account.
router.get('/users', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: users.map((u) => u.toSafeJSON()) });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/users/:id/status  { isActive: boolean }
// Activate/deactivate a staff account without deleting their history.
router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user.toSafeJSON() });
  } catch (error) {
    next(error);
  }
});

// SRS Module 2.5 — Hospital Administrator permission: Doctor Management.
// POST /api/admin/doctors  — creates the User account + linked Doctor profile together.
router.post('/doctors', async (req, res, next) => {
  try {
    const {
      fullName, email, mobileNumber, password,
      qualification, registrationNumber, departmentId, specialization, yearsOfExperience, consultationFee,
    } = req.body;

    if (!fullName || !email || !qualification || !registrationNumber || !departmentId) {
      return res.status(400).json({ success: false, message: 'fullName, email, qualification, registrationNumber, and departmentId are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
    }

    const user = await User.create({
      fullName,
      email,
      mobileNumber: mobileNumber || '+910000000000',
      password: password || `Doctor@${Date.now()}`,
      role: 'doctor',
    });

    const doctor = await Doctor.create({
      user: user._id,
      qualification,
      registrationNumber,
      department: departmentId,
      specialization,
      yearsOfExperience: yearsOfExperience || 0,
      consultationFee: consultationFee || 0,
    });

    res.status(201).json({ success: true, data: { user: user.toSafeJSON(), doctor } });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/doctors  — list every doctor with their user + department info.
router.get('/doctors', async (req, res, next) => {
  try {
    const doctors = await Doctor.find()
      .populate('user', 'fullName email mobileNumber isActive')
      .populate('department');
    res.json({ success: true, data: doctors });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/doctors/:id/status  { isActive: boolean }
router.patch('/doctors/:id/status', async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    res.json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
});

// SRS Module 2.5 — Hospital Administrator permission: Department Management.
// POST /api/admin/departments
router.post('/departments', async (req, res, next) => {
  try {
    const { name, branchId, description } = req.body;
    if (!name || !branchId) {
      return res.status(400).json({ success: false, message: 'name and branchId are required.' });
    }
    const department = await Department.create({ name, branch: branchId, description });
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/departments
router.get('/departments', async (req, res, next) => {
  try {
    const departments = await Department.find().populate('branch');
    res.json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
});

module.exports = router;