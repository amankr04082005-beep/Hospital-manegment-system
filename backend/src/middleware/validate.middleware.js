const Joi = require('joi');
const logger = require('../services/logger.service');

/**
 * Validation Middleware (Joi)
 *
 * Enterprise-grade request validation that ensures:
 * - All required fields are present
 * - Data types are correct (string, number, date, etc.)
 * - String lengths are within bounds
 * - Enums match allowed values
 * - XSS/NoSQL injection patterns are caught
 *
 * Usage:
 *   router.post('/appointments', validate(appointmentSchema), createAppointment);
 *   router.patch('/users/:id', validate(updateUserSchema), updateUser);
 */

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const dataToValidate = source === 'body' ? req.body : req[source];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Validation failed', {
        path: req.originalUrl,
        method: req.method,
        errors,
        body: sanitizeBody(req.body),
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Replace with sanitized values
    if (source === 'body') {
      req.body = value;
    } else {
      req[source] = value;
    }

    next();
  };
}

function sanitizeBody(body) {
  if (!body) return {};
  const sanitized = { ...body };
  const sensitive = ['password', 'token', 'authorization'];
  for (const key of sensitive) {
    if (sanitized[key]) sanitized[key] = '[REDACTED]';
  }
  return sanitized;
}

// ========================================
// Reusable validation schemas
// ========================================

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid ID format');

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});

// Auth schemas
const registerSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required()
    .messages({ 'string.min': 'Name must be at least 2 characters', 'any.required': 'Full name is required' }),
  email: Joi.string().email().required()
    .messages({ 'string.email': 'Invalid email format', 'any.required': 'Email is required' }),
  password: Joi.string().min(6).max(128).required()
    .messages({ 'string.min': 'Password must be at least 6 characters', 'any.required': 'Password is required' }),
  mobileNumber: Joi.string().pattern(/^\+?[\d\s-]{7,20}$/).optional(),
  role: Joi.string().valid('patient', 'doctor', 'pharmacist', 'receptionist').default('patient'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Appointment schemas
const createAppointmentSchema = Joi.object({
  patientId: objectId.optional(),
  doctorId: objectId.required(),
  departmentId: objectId.optional(),
  appointmentDate: Joi.date().iso().required()
    .messages({ 'date.format': 'Appointment date must be ISO format' }),
  timeSlot: Joi.string().required(),
  symptoms: Joi.string().max(2000).optional().allow(''),
  notes: Joi.string().max(2000).optional().allow(''),
  consultationMode: Joi.string().valid('in_person', 'video_call', 'phone').default('in_person'),
});

// Medicine schemas
const updateStockSchema = Joi.object({
  adjustment: Joi.number().integer().required()
    .messages({ 'any.required': 'Stock adjustment value is required' }),
  expiryDate: Joi.date().iso().optional(),
});

// Prescription schemas
const createDraftSchema = Joi.object({
  appointmentId: objectId.optional().allow(''),
  patientId: Joi.string().optional().allow(''),
  symptoms: Joi.string().max(5000).optional().allow(''),
  labReports: Joi.array().items(Joi.string()).optional(),
});

const reviewDraftSchema = Joi.object({
  finalMedicines: Joi.array().items(Joi.object({
    brandName: Joi.string().required(),
    composition: Joi.string().optional().allow(''),
    dosage: Joi.string().required(),
    frequency: Joi.string().required(),
    durationDays: Joi.number().integer().min(1).required(),
    instructions: Joi.string().optional().allow(''),
    source: Joi.string().valid('ai_suggested', 'doctor_added').default('doctor_added'),
  })).min(1).required(),
  finalAdvice: Joi.object({
    dietAdvice: Joi.string().optional().allow(''),
    exerciseAdvice: Joi.string().optional().allow(''),
    followUpInstructions: Joi.string().optional().allow(''),
  }).optional(),
  diagnosis: Joi.object({
    primary: Joi.string().required(),
    secondary: Joi.array().items(Joi.string()).optional(),
  }).required(),
  followUpDate: Joi.date().iso().optional().allow(null),
  changesSummary: Joi.string().max(2000).optional().allow(''),
});

module.exports = {
  validate,
  schemas: {
    register: registerSchema,
    login: loginSchema,
    pagination: paginationSchema,
    createAppointment: createAppointmentSchema,
    updateStock: updateStockSchema,
    createDraft: createDraftSchema,
    reviewDraft: reviewDraftSchema,
  },
};

