const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const { ROLES } = require('../config/roles');

function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/register  (primarily for patient self-registration; staff created by admin)
async function register(req, res, next) {
  try {
    const { fullName, email, mobileNumber, password, role, dob, gender, address, emergencyContact, bloodGroup } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({
      fullName,
      email,
      mobileNumber,
      password,
      role: role === ROLES.PATIENT || !role ? ROLES.PATIENT : role,
    });

    let patientProfile = null;
    if (user.role === ROLES.PATIENT) {
      const patientCode = `PT-${Date.now().toString().slice(-8)}`;
      patientProfile = await Patient.create({
        user: user._id,
        patientCode,
        dob,
        gender,
        address,
        emergencyContact,
        bloodGroup,
      });
    }

    const token = generateToken(user);
    res.status(201).json({
      success: true,
      data: { user: user.toSafeJSON(), patientProfile, token },
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user);
    res.json({ success: true, data: { user: user.toSafeJSON(), token } });
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/me
async function getMe(req, res, next) {
  try {
    res.json({ success: true, data: { user: req.user.toSafeJSON() } });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, getMe };
