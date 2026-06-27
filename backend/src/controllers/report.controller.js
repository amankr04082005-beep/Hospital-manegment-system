const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const User = require("../models/User");

/**
 * ==========================================
 * Appointment Report
 * ==========================================
 */
exports.getAppointmentReport = async (req, res) => {
  try {
    const { filter } = req.query;

    let match = {};

    if (filter) {
      const today = new Date();
      let startDate = new Date();

      if (filter === "daily") {
        startDate.setHours(0, 0, 0, 0);
      } else if (filter === "weekly") {
        startDate.setDate(today.getDate() - 7);
      } else if (filter === "monthly") {
        startDate.setMonth(today.getMonth() - 1);
      }

      match.appointmentDate = {
        $gte: startDate,
        $lte: today,
      };
    }

    const appointments = await Appointment.find(match)
      .populate({
        path: "patient",
        populate: {
          path: "user",
          model: "User",
          select: "fullName email mobileNumber",
        },
      })
      .populate({
        path: "doctor",
      });

    const totalAppointments = appointments.length;

    const booked = appointments.filter(
      (a) => a.status === "booked"
    ).length;

    const confirmed = appointments.filter(
      (a) => a.status === "confirmed"
    ).length;

    const inProgress = appointments.filter(
      (a) => a.status === "in_progress"
    ).length;

    const completed = appointments.filter(
      (a) => a.status === "completed"
    ).length;

    const cancelled = appointments.filter(
      (a) => a.status === "cancelled"
    ).length;

    res.status(200).json({
      success: true,
      data: {
        totalAppointments,
        booked,
        confirmed,
        inProgress,
        completed,
        cancelled,
        appointments,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to generate appointment report",
    });
  }
};

/**
 * ==========================================
 * Doctor Report
 * ==========================================
 */

exports.getDoctorReport = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate(
      "user",
      "fullName email"
    );

    const report = [];

    for (const doctor of doctors) {
      const totalPatients = await Appointment.countDocuments({
        doctor: doctor._id,
        status: "completed",
      });

      report.push({
        doctorId: doctor._id,
        doctorName: doctor.user?.fullName,
        email: doctor.user?.email,
        qualification: doctor.qualification,
        specialization: doctor.specialization,
        registrationNumber: doctor.registrationNumber,
        consultationFee: doctor.consultationFee,
        patientsConsulted: totalPatients,
      });
    }

    res.status(200).json({
      success: true,
      totalDoctors: report.length,
      data: report,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to generate doctor report",
    });
  }
};/**
 * ==========================================
 * Prescription Report
 * ==========================================
 */

exports.getPrescriptionReport = async (req, res) => {
  try {
    const totalPrescriptions = await Prescription.countDocuments();

    const draftCreated = await Prescription.countDocuments({
      status: "draft_created",
    });

    const underReview = await Prescription.countDocuments({
      status: "under_review",
    });

    const doctorApproved = await Prescription.countDocuments({
      status: "doctor_approved",
    });

    const prescriptionGenerated = await Prescription.countDocuments({
      status: "prescription_generated",
    });

    const sharedWithPatient = await Prescription.countDocuments({
      status: "shared_with_patient",
    });

    // Most Prescribed Medicines
    const medicines = await Prescription.aggregate([
      {
        $unwind: "$finalMedicines",
      },
      {
        $group: {
          _id: "$finalMedicines.brandName",
          total: { $sum: 1 },
        },
      },
      {
        $sort: {
          total: -1,
        },
      },
      {
        $limit: 10,
      },
    ]);

    // Disease Trends
    const diseaseTrends = await Prescription.aggregate([
      {
        $group: {
          _id: "$diagnosis.primary",
          total: { $sum: 1 },
        },
      },
      {
        $sort: {
          total: -1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPrescriptions,
        draftCreated,
        underReview,
        doctorApproved,
        prescriptionGenerated,
        sharedWithPatient,
        medicines,
        diseaseTrends,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to generate prescription report",
    });
  }
};

/**
 * ==========================================
 * Revenue Report
 * ==========================================
 */

exports.getRevenueReport = async (req, res) => {
  try {
    const completedAppointments = await Appointment.find({
      status: "completed",
    }).populate("doctor");

    let totalRevenue = 0;

    completedAppointments.forEach((appointment) => {
      if (appointment.doctor) {
        totalRevenue += appointment.doctor.consultationFee || 0;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        completedAppointments: completedAppointments.length,
        totalRevenue,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to generate revenue report",
    });
  }
};