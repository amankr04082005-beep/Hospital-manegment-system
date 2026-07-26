const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const authRoutes = require('./routes/auth.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const medicineRoutes = require('./routes/medicine.routes');
const emrRoutes = require('./routes/emr.routes');
const hospitalRoutes = require('./routes/hospital.routes');
const reportRoutes = require('./routes/report.routes');
const adminRoutes = require('./routes/admin.routes');

const { notFound, errorHandler } = require('./middleware/error.middleware');
const { auditMiddleware } = require('./middleware/audit.middleware');
const logger = require('./services/logger.service');
const swaggerSpec = require('./config/swagger');

const app = express();

// Security
app.use(helmet());

// CORS
const allowedOrigins = new Set(
  [
    process.env.CLIENT_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ].filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Structured HTTP request logging via Winston
app.use(
  morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined', {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  })
);

// Audit middleware — attaches req.audit helper and captures IP/user-agent
app.use(auditMiddleware);

// Rate Limiter — global
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

app.use('/api', limiter);

// Stricter rate limiter for auth routes specifically (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20, // 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again later.' },
});

app.use('/api/auth/login', authLimiter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Hospital Management API is running.',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// ======================
// API Documentation
// ======================

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Hospital Management API Docs',
}));

// ======================
// Routes
// ======================

app.use('/api/auth', authRoutes);

app.use('/api/appointments', appointmentRoutes);

app.use('/api/prescriptions', prescriptionRoutes);

app.use('/api/medicines', medicineRoutes);

app.use('/api/emr', emrRoutes);

app.use('/api/hospital', hospitalRoutes);

// Reporting & Analytics
app.use('/api/reports', reportRoutes);

// Hospital Administrator: User/Doctor/Department Management
app.use('/api/admin', adminRoutes);

// ======================
// Error Handling
// ======================

app.use(notFound);

app.use(errorHandler);

module.exports = app;
