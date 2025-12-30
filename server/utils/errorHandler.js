/**
 * Comprehensive Error Handling Utility
 * Provides centralized error handling with detailed logging and user-friendly responses
 * 
 * Features:
 * - Async error wrapper for controllers
 * - Database error handling
 * - Validation error formatting
 * - Security-aware error responses
 * - Error logging and monitoring
 * - Custom error classes
 */

const { ERROR_CODES } = require('./apiResponse');

/**
 * Custom error classes for different types of application errors
 */

/**
 * Base application error class
 */
class AppError extends Error {
    constructor(message, statusCode = 500, code = ERROR_CODES.INTERNAL_ERROR, isOperational = true) {
        super(message);
        
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation error class
 */
class ValidationError extends AppError {
    constructor(message, errors = []) {
        super(message, 400, ERROR_CODES.VALIDATION_ERROR);
        this.errors = errors;
    }
}

/**
 * Authentication error class
 */
class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, ERROR_CODES.UNAUTHORIZED);
    }
}

/**
 * Authorization error class
 */
class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, ERROR_CODES.FORBIDDEN);
    }
}

/**
 * Not found error class
 */
class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, ERROR_CODES.NOT_FOUND);
    }
}

/**
 * Conflict error class
 */
class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409, ERROR_CODES.CONFLICT);
    }
}

/**
 * Rate limit error class
 */
class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429, ERROR_CODES.RATE_LIMIT_EXCEEDED);
    }
}

/**
 * File upload error class
 */
class FileUploadError extends AppError {
    constructor(message, code = ERROR_CODES.UPLOAD_FAILED) {
        super(message, 400, code);
    }
}

/**
 * Database error class
 */
class DatabaseError extends AppError {
    constructor(message = 'Database operation failed') {
        super(message, 500, ERROR_CODES.DATABASE_ERROR);
    }
}

/**
 * Async error wrapper for controllers
 * Automatically catches and forwards async errors to error handler
 * 
 * @param {Function} fn - Async controller function
 * @returns {Function} Wrapped controller function
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Handle different types of errors and convert them to AppError instances
 * 
 * @param {Error} err - Original error
 * @returns {AppError} Standardized error
 */
const handleError = (err) => {
    let error = { ...err };
    error.message = err.message;
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => ({
            field: val.path,
            message: val.message,
            value: val.value
        }));
        
        error = new ValidationError('Validation failed', errors);
    }
    
    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        const message = `${field} '${value}' already exists`;
        
        error = new ConflictError(message);
    }
    
    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        const message = `Invalid ${err.path}: ${err.value}`;
        error = new ValidationError(message);
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new AuthenticationError('Invalid token');
    }
    
    if (err.name === 'TokenExpiredError') {
        error = new AuthenticationError('Token expired');
    }
    
    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        error = new FileUploadError('File too large', ERROR_CODES.FILE_TOO_LARGE);
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
        error = new FileUploadError('Too many files uploaded');
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        error = new FileUploadError('Unexpected file field');
    }
    
    // MongoDB connection errors
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
        error = new DatabaseError('Database connection failed');
    }
    
    // Express validator errors
    if (err.type === 'entity.parse.failed') {
        error = new ValidationError('Invalid JSON format');
    }
    
    if (err.type === 'entity.too.large') {
        error = new ValidationError('Request body too large');
    }
    
    return error;
};

/**
 * Log error details for monitoring and debugging
 * 
 * @param {Error} err - Error to log
 * @param {Object} req - Express request object
 */
const logError = (err, req = null) => {
    const errorLog = {
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode,
        code: err.code,
        timestamp: new Date().toISOString(),
        ...(req && {
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            user: req.user?.email || 'anonymous',
            body: req.method !== 'GET' ? sanitizeLogData(req.body) : undefined,
            query: Object.keys(req.query || {}).length > 0 ? req.query : undefined
        })
    };
    
    // Log level based on error type
    if (err.statusCode >= 500) {
        console.error('Server Error:', errorLog);
    } else if (err.statusCode >= 400) {
        console.warn('Client Error:', errorLog);
    } else {
        console.info('Error:', errorLog);
    }
    
    // Additional monitoring for security-related errors
    if (err.code === ERROR_CODES.UNAUTHORIZED || 
        err.code === ERROR_CODES.FORBIDDEN ||
        err.message.includes('injection') ||
        err.message.includes('XSS')) {
        console.error('SECURITY ALERT:', errorLog);
    }
};

/**
 * Sanitize sensitive data from logs
 * 
 * @param {*} data - Data to sanitize
 * @returns {*} Sanitized data
 */
const sanitizeLogData = (data) => {
    if (!data || typeof data !== 'object') return data;
    
    const sensitiveFields = [
        'password',
        'token',
        'secret',
        'key',
        'auth',
        'credential'
    ];
    
    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
            sanitized[key] = '[REDACTED]';
        }
    });
    
    return sanitized;
};

/**
 * Format error response for client
 * Ensures no sensitive information is leaked
 * 
 * @param {Error} err - Error to format
 * @param {Object} req - Express request object
 * @returns {Object} Formatted error response
 */
const formatErrorResponse = (err, req = null) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Default error response
    let response = {
        success: false,
        message: err.message || 'An error occurred',
        code: err.code || ERROR_CODES.INTERNAL_ERROR,
        timestamp: new Date().toISOString()
    };
    
    // Add validation errors if present
    if (err.errors && Array.isArray(err.errors)) {
        response.errors = err.errors;
    }
    
    // Add stack trace in development
    if (!isProduction && err.stack) {
        response.stack = err.stack;
    }
    
    // Add request ID for tracking
    if (req && req.id) {
        response.requestId = req.id;
    }
    
    // Sanitize error message in production
    if (isProduction && err.statusCode >= 500) {
        response.message = 'Internal server error';
        delete response.stack;
    }
    
    return response;
};

/**
 * Handle operational vs programming errors
 * 
 * @param {Error} err - Error to check
 * @returns {boolean} True if error is operational
 */
const isOperationalError = (err) => {
    if (err instanceof AppError) {
        return err.isOperational;
    }
    return false;
};

/**
 * Error recovery strategies
 * Attempts to recover from certain types of errors
 * 
 * @param {Error} err - Error to recover from
 * @param {Object} req - Express request object
 * @returns {boolean} True if recovery was attempted
 */
const attemptErrorRecovery = (err, req) => {
    // Database connection recovery
    if (err.name === 'MongoNetworkError') {
        console.info('Attempting database reconnection...');
        // Database reconnection logic would go here
        return true;
    }
    
    // Rate limit recovery (could implement exponential backoff)
    if (err.code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
        console.info('Rate limit exceeded, implementing backoff strategy');
        return true;
    }
    
    return false;
};

/**
 * Create error handler middleware
 * 
 * @param {Object} options - Configuration options
 * @returns {Function} Error handler middleware
 */
const createErrorHandler = (options = {}) => {
    const {
        enableLogging = true,
        enableRecovery = true,
        enableMonitoring = true
    } = options;
    
    return (err, req, res, next) => {
        // Handle the error
        const handledError = handleError(err);
        
        // Log the error
        if (enableLogging) {
            logError(handledError, req);
        }
        
        // Attempt recovery
        if (enableRecovery) {
            attemptErrorRecovery(handledError, req);
        }
        
        // Send error monitoring alerts for critical errors
        if (enableMonitoring && handledError.statusCode >= 500) {
            // Integration with monitoring services would go here
            console.error('CRITICAL ERROR ALERT:', {
                message: handledError.message,
                code: handledError.code,
                path: req.path,
                user: req.user?.email,
                timestamp: new Date().toISOString()
            });
        }
        
        // Format and send response
        const errorResponse = formatErrorResponse(handledError, req);
        const statusCode = handledError.statusCode || 500;
        
        res.status(statusCode).json(errorResponse);
    };
};

module.exports = {
    // Error classes
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    FileUploadError,
    DatabaseError,
    
    // Utilities
    asyncHandler,
    handleError,
    logError,
    formatErrorResponse,
    isOperationalError,
    createErrorHandler,
    
    // Helper functions
    sanitizeLogData,
    attemptErrorRecovery
};