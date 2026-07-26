const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hospital Management API',
      version: '2.0.0',
      description: `
        Enterprise-grade hospital management system with:
        - Role-based access (Patient, Doctor, Pharmacist, Receptionist, Admin)
        - AI-assisted clinical decision support
        - Drug database integration (OpenFDA, RxNorm, Drug Database API)
        - Real-time queue management via WebSockets
        - Immutable audit logging for compliance
        - Medicine composition recommendation engine
      `,
      contact: {
        name: 'MediFlow Hospital Systems',
        email: 'support@mediflow-hospital.com',
      },
    },
    servers: [
      { url: '/api', description: 'API base path' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from /api/auth/login or /api/auth/register',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Something went wrong' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            fullName: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['patient', 'doctor', 'pharmacist', 'receptionist', 'admin'] },
            mobileNumber: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        Medicine: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            brandName: { type: 'string' },
            genericName: { type: 'string' },
            composition: { type: 'string' },
            category: { type: 'string' },
            form: { type: 'string', enum: ['tablet', 'syrup', 'injection', 'capsule', 'ointment', 'other'] },
            stockQuantity: { type: 'integer' },
            lowStockThreshold: { type: 'integer' },
            isLowStock: { type: 'boolean' },
          },
        },
        Prescription: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            prescriptionNumber: { type: 'string' },
            appointmentId: { type: 'string' },
            patientId: { type: 'string' },
            doctorId: { type: 'string' },
            status: { type: 'string', enum: ['draft_created', 'under_review', 'doctor_approved', 'prescription_generated', 'shared_with_patient'] },
            diagnosis: { type: 'object' },
            finalMedicines: { type: 'array', items: { type: 'object' } },
            aiRecommendation: { type: 'object' },
          },
        },
        AuditLog: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            userEmail: { type: 'string' },
            userRole: { type: 'string' },
            action: { type: 'string' },
            resourceType: { type: 'string' },
            resourceId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication & user management' },
      { name: 'Appointments', description: 'Appointment booking and queue management' },
      { name: 'Prescriptions', description: 'AI-assisted prescription workflow' },
      { name: 'Medicines', description: 'Medicine catalogue, inventory & drug database' },
      { name: 'EMR', description: 'Electronic Medical Records' },
      { name: 'Admin', description: 'Administrative operations & audit logs' },
      { name: 'Reports', description: 'Reporting & analytics' },
      { name: 'Hospital', description: 'Branch & department management' },
    ],
    paths: {},
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

module.exports = swaggerJsdoc(options);

