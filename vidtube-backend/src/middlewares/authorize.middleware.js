import apiError from '../utils/apiError.js';

/**
 * Role-based authorization middleware.
 * Requires verifyJWT to run before this middleware.
 */
export const requireRole = (...allowedRoles) => {
  const normalizedRoles = allowedRoles.map((role) =>
    String(role).toLowerCase()
  );

  return (req, res, next) => {
    if (!req.user) {
      return next(new apiError(401, 'Authentication required'));
    }

    const userRole = String(req.user.role || 'user').toLowerCase();
    if (!normalizedRoles.includes(userRole)) {
      return next(new apiError(403, 'Insufficient permissions'));
    }

    next();
  };
};
