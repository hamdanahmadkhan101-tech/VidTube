import apiError from '../utils/apiError.js';

/**
 * Unauthorized Error - 401 Unauthorized
 * Used when authentication is required or invalid
 */
class UnauthorizedError extends apiError {
  constructor(message = 'Unauthorized access') {
    super(401, message, []);
    this.name = 'UnauthorizedError';
  }
}

export default UnauthorizedError;
