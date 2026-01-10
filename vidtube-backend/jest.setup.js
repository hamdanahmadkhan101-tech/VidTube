/**
 * Jest Setup File
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret-minimum-32-characters-long-for-testing';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret-different-from-access-token-secret';
process.env.ACCESS_TOKEN_EXPIRY = '15m';
process.env.REFRESH_TOKEN_EXPIRY = '7d';
process.env.JWT_SECRET = process.env.ACCESS_TOKEN_SECRET; // For compatibility
process.env.JWT_REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET; // For compatibility
process.env.FRONTEND_URL = 'http://localhost:5173';

// Suppress console logs during tests (optional - uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
