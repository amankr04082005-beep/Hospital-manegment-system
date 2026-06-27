const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const EmrEntry = require('../models/EmrEntry');
const Patient = require('../models/Patient');

const router = express.Router();
router.use(authenticate);

// GET /api/emr/:patientId — full medical history (Module 3)
router.get('/:patientId', async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    const records = await EmrEntry.find({ patient: patient._id }).sort({ recordDate: -1 });
    res.json({ success: true, data: { patientProfile: patient, records } });
  } catch (error) {
    next(error);
  }
});

// POST /api/emr/:patientId — add a record (lab report, scan, consultation note)
router.post('/:patientId', async (req, res, next) => {
  try {
    const entry = await EmrEntry.create({
      patient: req.params.patientId,
      recordedBy: req.user._id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
