/**
 * Base API Error Class
 * Extended by specific error types for better error handling
 */
class apiError extends Error {
  constructor(
    statusCode = 500,
    message = 'API Error',
    errors = null,
    stack = null
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.error = errors;
    this.data = null;
    this.name = this.constructor.name;

    // Capture stack trace
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON format for API response
   * @returns {Object}
   */
  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      error: this.error,
      data: this.data,
    };
  }
}

export default apiError;
