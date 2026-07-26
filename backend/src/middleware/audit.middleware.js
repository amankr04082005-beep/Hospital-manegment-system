 const AuditLog = require('../models/AuditLog');
const logger = require('../services/logger.service');

/**
 * Audit Middleware
 *
 * Logs critical user actions to the immutable AuditLog collection.
 * Healthcare compliance requires tracking: WHO did WHAT, WHEN, and on WHICH resource.
 *
 * Usage:
 *   In a controller after a successful operation:
 *     req.audit = { action: 'APPROVE_PRESCRIPTION', resourceType: 'Prescription', resourceId: doc._id, details: { ... } };
 *
 *   Or use the helper:
 *     await auditLog(req.user, 'CREATE_APPOINTMENT', 'Appointment', appointment._id, { ... });
 */

async function auditLog(user, action, resourceType, resourceId, details = {}) {
  if (!user || !user._id) {
    logger.warn('Audit log skipped: no user provided', { action, resourceType });
    return;
  }

  try {
    await AuditLog.create({
      userId: user._id,
      userEmail: user.email || 'unknown',
      userRole: user.role || 'unknown',
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: user._ipAddress || null,
      userAgent: user._userAgent || null,
    });
  } catch (err) {
    // Audit logging must never break the main operation
    logger.error('Failed to write audit log', {
      error: err.message,
      action,
      resourceType,
      userId: user._id,
    });
  }
}

/**
 * Express middleware that attaches IP and user-agent to req.user
 * and provides req.audit() helper.
 */
function auditMiddleware(req, res, next) {
  if (req.user) {
    req.user._ipAddress = req.ip || req.connection?.remoteAddress;
    req.user._userAgent = req.headers['user-agent'] || null;
  }

  // Convenience method for controllers
  req.audit = async (action, resourceType, resourceId, details = {}) => {
    await auditLog(req.user, action, resourceType, resourceId, details);
  };

  next();
}

/**
 * Endpoint to retrieve audit logs (admin only).
 */
async function getAuditLogs(req, res, next) {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      resourceType,
      startDate,
      endDate,
    } = req.query;

    const filter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (resourceType) filter.resourceType = resourceType;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name email role')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  auditLog,
  auditMiddleware,
  getAuditLogs,
};

