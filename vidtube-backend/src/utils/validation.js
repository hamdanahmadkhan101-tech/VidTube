import mongoose from 'mongoose';
import { ValidationError, NotFoundError } from '../errors/index.js';

/**
 * Validation Utilities
 * Centralized validation functions
 */

/**
 * Validate MongoDB ObjectId
 * @param {string} id - The id string to validate
 * @param {string} fieldName - Field name for error messages
 * @throws {ValidationError}
 */
export const validateObjectId = (id, fieldName = 'ID') => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError(`Invalid ${fieldName}`, [
      { field: fieldName.toLowerCase(), message: `Invalid ${fieldName} format` },
    ]);
  }
};

/**
 * Validate required fields
 * @param {Object} data - Object to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @throws {ValidationError}
 */
export const validateRequired = (data, requiredFields) => {
  const missingFields = requiredFields.filter((field) => !data[field]);

  if (missingFields.length > 0) {
    throw new ValidationError(
      'Required fields are missing',
      missingFields.map((field) => ({
        field,
        message: `${field} is required`,
      }))
    );
  }
};

/**
 * Validate string length
 * @param {string} value - Value to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @param {string} fieldName - Field name for error messages
 * @throws {ValidationError}
 */
export const validateStringLength = (value, min, max, fieldName) => {
  if (typeof value !== 'string') {
    throw new ValidationError(`Invalid ${fieldName}`, [
      { field: fieldName, message: `${fieldName} must be a string` },
    ]);
  }

  const trimmed = value.trim();

  if (trimmed.length < min) {
    throw new ValidationError(`Invalid ${fieldName}`, [
      {
        field: fieldName,
        message: `${fieldName} must be at least ${min} characters`,
      },
    ]);
  }

  if (trimmed.length > max) {
    throw new ValidationError(`Invalid ${fieldName}`, [
      {
        field: fieldName,
        message: `${fieldName} must be at most ${max} characters`,
      },
    ]);
  }

  return trimmed;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @throws {ValidationError}
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', [
      { field: 'email', message: 'Please provide a valid email address' },
    ]);
  }
};

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @throws {ValidationError}
 */
export const validateUsername = (username) => {
  // Username: 3-20 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    throw new ValidationError('Invalid username format', [
      {
        field: 'username',
        message:
          'Username must be 3-20 characters, containing only letters, numbers, and underscores',
      },
    ]);
  }
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @throws {ValidationError}
 */
export const validatePassword = (password) => {
  if (password.length < 8) {
    throw new ValidationError('Password is too weak', [
      {
        field: 'password',
        message: 'Password must be at least 8 characters long',
      },
    ]);
  }

  if (password.length > 128) {
    throw new ValidationError('Password is too long', [
      {
        field: 'password',
        message: 'Password must be at most 128 characters long',
      },
    ]);
  }
};

/**
 * Validate numeric range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} fieldName - Field name for error messages
 * @throws {ValidationError}
 */
export const validateNumericRange = (value, min, max, fieldName) => {
  const num = Number(value);
  if (Number.isNaN(num)) {
    throw new ValidationError(`Invalid ${fieldName}`, [
      { field: fieldName, message: `${fieldName} must be a number` },
    ]);
  }

  if (num < min || num > max) {
    throw new ValidationError(`Invalid ${fieldName}`, [
      {
        field: fieldName,
        message: `${fieldName} must be between ${min} and ${max}`,
      },
    ]);
  }

  return num;
};
