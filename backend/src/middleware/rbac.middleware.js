const { PERMISSIONS } = require('../config/roles');

/**
 * Usage: router.post('/x', authenticate, authorize('prescription:approve'), handler)
 */
function authorize(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const userPermissions = PERMISSIONS[req.user.role] || [];
    const hasAll = requiredPermissions.every((p) => userPermissions.includes(p));

    if (!hasAll) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' lacks required permission(s): ${requiredPermissions.join(', ')}`,
      });
    }

    next();
  };
}

function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role.' });
    }
    next();
  };
}

module.exports = { authorize, restrictTo };
