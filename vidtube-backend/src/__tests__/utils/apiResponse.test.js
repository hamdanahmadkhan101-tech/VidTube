import apiResponse from '../../utils/apiResponse.js';

describe('apiResponse', () => {
  test('should create response with default values', () => {
    const response = new apiResponse();
    expect(response.statusCode).toBe(200);
    expect(response.message).toBe('Success');
    expect(response.success).toBe(true);
    expect(response.data).toBeNull();
  });

  test('should create response with custom values', () => {
    const data = { id: 1, name: 'Test' };
    const response = new apiResponse(201, 'Created', data);
    expect(response.statusCode).toBe(201);
    expect(response.message).toBe('Created');
    expect(response.data).toEqual(data);
    // requestId is set by middleware, not constructor
  });

  test('should set success to false for error status codes', () => {
    const response = new apiResponse(400, 'Bad Request');
    expect(response.success).toBe(false);
  });

  test('should set success to true for success status codes', () => {
    const response = new apiResponse(200, 'OK');
    expect(response.success).toBe(true);
  });
});
