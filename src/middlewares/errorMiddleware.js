import apiError from '../utils/apiError.js';

const errorMiddleware = (err, req, res, next) => {
  // Check if the error is an instance of apiError
  if (err instanceof apiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      error: err.error,
      data: err.data,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // For other errors, send a generic response
  return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Internal Server Error',
    error: [],
    data: null,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorMiddleware;
