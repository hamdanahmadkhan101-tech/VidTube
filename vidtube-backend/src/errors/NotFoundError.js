import apiError from '../utils/apiError.js';

/**
 * Not Found Error - 404 Not Found
 * Used when a requested resource doesn't exist
 */
class NotFoundError extends apiError {
  constructor(resource = 'Resource', id = null) {
    const message = id
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    super(404, message, []);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.id = id;
  }
}

export default NotFoundError;
