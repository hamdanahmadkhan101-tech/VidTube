import toast from 'react-hot-toast';

/**
 * Centralized API Error Handler
 * Provides consistent error handling across the application
 */

/**
 * Handle API errors and show appropriate toast messages
 * @param {Error} error - Error object from API call
 * @param {Object} options - { showToast, defaultMessage, logError }
 * @returns {Object} { message, statusCode, errors }
 */
export const handleApiError = (error, options = {}) => {
  const {
    showToast = true,
    defaultMessage = 'An error occurred. Please try again.',
    logError = true,
  } = options;

  let message = defaultMessage;
  let statusCode = null;
  let errors = [];

  // Extract error information
  if (error.response) {
    // API responded with error
    const response = error.response;
    statusCode = response.status;
    const data = response.data;

    if (data?.message) {
      message = data.message;
    }

    if (data?.error && Array.isArray(data.error)) {
      errors = data.error;
    } else if (data?.error && typeof data.error === 'object') {
      errors = [data.error];
    }

    // Handle specific status codes
    switch (statusCode) {
      case 400:
        message = message || 'Invalid request. Please check your input.';
        break;
      case 401:
        message = message || 'You are not authorized. Please log in.';
        // Could trigger logout here if needed
        break;
      case 403:
        message = message || 'You do not have permission to perform this action.';
        break;
      case 404:
        message = message || 'The requested resource was not found.';
        break;
      case 409:
        message = message || 'This resource already exists.';
        break;
      case 429:
        message = message || 'Too many requests. Please try again later.';
        break;
      case 500:
        message = message || 'Server error. Please try again later.';
        break;
      default:
        message = message || defaultMessage;
    }
  } else if (error.request) {
    // Request was made but no response received
    message = 'Network error. Please check your connection.';
    if (logError) {
      console.error('Network error:', error.request);
    }
  } else {
    // Something else happened
    message = error.message || defaultMessage;
    if (logError) {
      console.error('Error:', error);
    }
  }

  // Show toast notification
  if (showToast) {
    if (statusCode === 429) {
      toast.error(message, { duration: 5000 });
    } else if (statusCode >= 500) {
      toast.error(message, { duration: 4000 });
    } else {
      toast.error(message);
    }
  }

  return {
    message,
    statusCode,
    errors,
    originalError: error,
  };
};

/**
 * Handle API success messages
 * @param {string} message - Success message
 * @param {Object} options - Toast options
 */
export const handleApiSuccess = (message, options = {}) => {
  toast.success(message, {
    duration: 3000,
    ...options,
  });
};

/**
 * Format validation errors for display
 * @param {Array} errors - Array of error objects from API
 * @returns {string} Formatted error message
 */
export const formatValidationErrors = (errors) => {
  if (!Array.isArray(errors) || errors.length === 0) {
    return '';
  }

  if (errors.length === 1) {
    return errors[0].message || 'Validation failed';
  }

  return errors.map((err) => err.message || err.field).join(', ');
};
