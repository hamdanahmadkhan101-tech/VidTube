import apiError from '../utils/apiError.js';

/**
 * Forbidden Error - 403 Forbidden
 * Used when user is authenticated but lacks permission
 */
class ForbiddenError extends apiError {
  constructor(message = 'You do not have permission to perform this action') {
    super(403, message, []);
    this.name = 'ForbiddenError';
  }
}

export default ForbiddenError;
