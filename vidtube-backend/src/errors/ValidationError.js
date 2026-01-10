import apiError from '../utils/apiError.js';

/**
 * Validation Error - 400 Bad Request
 * Used for input validation failures
 */
class ValidationError extends apiError {
  constructor(message = 'Validation failed', errors = []) {
    super(400, message, errors);
    this.name = 'ValidationError';
  }
}

export default ValidationError;
