import apiError from '../utils/apiError.js';

/**
 * Conflict Error - 409 Conflict
 * Used when request conflicts with current state (e.g., duplicate resource)
 */
class ConflictError extends apiError {
  constructor(message = 'Resource conflict', field = null) {
    super(409, message, field ? [{ field, message }] : []);
    this.name = 'ConflictError';
    this.field = field;
  }
}

export default ConflictError;
