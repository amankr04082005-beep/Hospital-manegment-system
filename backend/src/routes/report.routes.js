const express = require("express");

const router = express.Router();

const {
  getAppointmentReport,
  getDoctorReport,
  getPrescriptionReport,
  getRevenueReport,
} = require("../controllers/report.controller");

// Appointment Report
router.get("/appointments", getAppointmentReport);

// Doctor Report
router.get("/doctors", getDoctorReport);

// Prescription Report
router.get("/prescriptions", getPrescriptionReport);

// Revenue Report
router.get("/revenue", getRevenueReport);

module.exports = router;