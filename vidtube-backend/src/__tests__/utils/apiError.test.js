import apiError from '../../utils/apiError.js';

describe('apiError', () => {
  test('should create error with default values', () => {
    const error = new apiError();
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('API Error');
    expect(error.success).toBe(false);
    expect(error.error).toBeNull(); // Default is null, not empty array
  });

  test('should create error with custom values', () => {
    const error = new apiError(400, 'Bad Request', ['field error']);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Bad Request');
    expect(error.error).toEqual(['field error']);
    // requestId is set by middleware, not constructor
  });

  test('should extend Error class', () => {
    const error = new apiError(404, 'Not Found');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('apiError');
  });
});
