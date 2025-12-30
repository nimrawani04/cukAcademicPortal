/**
 * Enhanced Error Handling Middleware
 * Provides comprehensive error handling with security awareness and detailed logging
 * 
 * Features:
 * - Standardized error responses
 * - Security-aware error sanitization
 * - Detailed error logging
 * - Error monitoring and alerting
 * - Recovery mechanisms
 */

const { createErrorHandler } = require('../utils/errorHandler');
const { ERROR_CODES } = require('../utils/apiResponse');

/**
 * Main error handling middleware
 * Uses the comprehensive error handler with academic portal specific configuration
 */
const errorHandler = createErrorHandler({
    enableLogging: true,
    enableRecovery: true,
    enableMonitoring: process.env.NODE_ENV === 'production'
});

/**
 * 404 Not Found handler
 * Handles requests to non-existent routes
 */
const notFoundHandler = (req, res, next) => {
    const error = {
        success: false,
        message: `Route ${req.originalUrl} not found`,
        code: ERROR_CODES.NOT_FOUND,
        timestamp: new Date().toISOString()
    };
    
    // Log 404 attempts for security monitoring
    console.warn('404 Not Found:', {
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        timestamp: new Date().toISOString()
    });
    
    res.status(404).json(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass them to error middleware
 * 
 * Usage: router.get('/route', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom error class for application-specific errors
 * @deprecated Use error classes from utils/errorHandler.js instead
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Unhandled promise rejection handler
 * Global handler for unhandled promise rejections
 */
const handleUnhandledRejection = () => {
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Promise Rejection:', {
            reason: reason.message || reason,
            stack: reason.stack,
            promise: promise,
            timestamp: new Date().toISOString()
        });
        
        // In production, we might want to gracefully shutdown
        if (process.env.NODE_ENV === 'production') {
            console.error('Shutting down due to unhandled promise rejection');
            process.exit(1);
        }
    });
};

/**
 * Uncaught exception handler
 * Global handler for uncaught exceptions
 */
const handleUncaughtException = () => {
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        // Uncaught exceptions are serious - always exit
        console.error('Shutting down due to uncaught exception');
        process.exit(1);
    });
};

/**
 * Initialize global error handlers
 */
const initializeGlobalErrorHandlers = () => {
    handleUnhandledRejection();
    handleUncaughtException();
    
    console.info('Global error handlers initialized');
};

module.exports = errorHandler;
module.exports.notFoundHandler = notFoundHandler;
module.exports.asyncHandler = asyncHandler;
module.exports.AppError = AppError;
module.exports.initializeGlobalErrorHandlers = initializeGlobalErrorHandlers;