const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const medicineRoutes = require('./routes/medicine.routes');
const emrRoutes = require('./routes/emr.routes');
const hospitalRoutes = require('./routes/hospital.routes');
const reportRoutes = require('./routes/report.routes');
const adminRoutes = require('./routes/admin.routes');

const { notFound, errorHandler } = require('./middleware/error.middleware');

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

// Logger
app.use(
  morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined')
);

// Rate Limiter
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Hospital Management API is running.',
    timestamp: new Date(),
  });
});

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