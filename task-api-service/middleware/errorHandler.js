// Custom error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Centralized error handler
export function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  // Log error with more details
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  // PostgreSQL foreign key constraint violation
  if (err.code === '23503') {
    const message = 'Invalid reference to related resource';
    error = new AppError(message, 400);
  }

  // PostgreSQL not null constraint violation
  if (err.code === '23502') {
    const message = 'Missing required field';
    error = new AppError(message, 400);
  }

  // Express validator errors
  if (err.type === 'validation') {
    const message = err.details || 'Validation error';
    error = new AppError(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Internal Server Error",
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  });
}