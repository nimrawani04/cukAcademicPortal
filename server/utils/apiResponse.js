/**
 * Standardized API Response Utility
 * Provides consistent response formatting across all endpoints
 * 
 * Features:
 * - Consistent response structure
 * - Error code standardization
 * - Response time tracking
 * - Automatic logging
 * - Pagination support
 * - Data transformation utilities
 */

/**
 * Standard API response structure
 * @typedef {Object} APIResponse
 * @property {boolean} success - Indicates if the request was successful
 * @property {string} message - Human-readable message
 * @property {string} [code] - Machine-readable error/success code
 * @property {*} [data] - Response data
 * @property {Object} [meta] - Metadata (pagination, timing, etc.)
 * @property {Array} [errors] - Detailed error information
 */

/**
 * Success response helper
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {Object} meta - Additional metadata
 */
const success = (res, data = null, message = 'Success', statusCode = 200, meta = {}) => {
    const response = {
        success: true,
        message,
        timestamp: new Date().toISOString(),
        ...(data !== null && { data }),
        ...(Object.keys(meta).length > 0 && { meta })
    };
    
    // Add request timing if available
    if (res.locals.startTime) {
        response.meta = {
            ...response.meta,
            responseTime: Date.now() - res.locals.startTime
        };
    }
    
    // Log successful responses for important operations
    if (statusCode === 201 || res.req.method !== 'GET') {
        console.info('API Success:', {
            method: res.req.method,
            path: res.req.path,
            statusCode,
            user: res.req.user?.email || 'anonymous',
            ip: res.req.ip,
            responseTime: response.meta?.responseTime
        });
    }
    
    return res.status(statusCode).json(response);
};

/**
 * Error response helper
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {string} code - Error code
 * @param {Array|Object} errors - Detailed error information
 * @param {*} data - Additional error data
 */
const error = (res, message = 'An error occurred', statusCode = 400, code = null, errors = null, data = null) => {
    const response = {
        success: false,
        message,
        timestamp: new Date().toISOString(),
        ...(code && { code }),
        ...(errors && { errors }),
        ...(data && { data })
    };
    
    // Add request timing if available
    if (res.locals.startTime) {
        response.meta = {
            responseTime: Date.now() - res.locals.startTime
        };
    }
    
    // Log error responses
    console.error('API Error:', {
        method: res.req.method,
        path: res.req.path,
        statusCode,
        message,
        code,
        user: res.req.user?.email || 'anonymous',
        ip: res.req.ip,
        userAgent: res.req.get('User-Agent'),
        responseTime: response.meta?.responseTime,
        ...(errors && { errors })
    });
    
    return res.status(statusCode).json(response);
};

/**
 * Validation error response helper
 * @param {Object} res - Express response object
 * @param {Array|Object} validationErrors - Validation error details
 * @param {string} message - Custom error message
 */
const validationError = (res, validationErrors, message = 'Validation failed') => {
    return error(res, message, 400, 'VALIDATION_ERROR', validationErrors);
};

/**
 * Not found response helper
 * @param {Object} res - Express response object
 * @param {string} resource - Resource that was not found
 */
const notFound = (res, resource = 'Resource') => {
    return error(res, `${resource} not found`, 404, 'NOT_FOUND');
};

/**
 * Unauthorized response helper
 * @param {Object} res - Express response object
 * @param {string} message - Custom unauthorized message
 */
const unauthorized = (res, message = 'Authentication required') => {
    return error(res, message, 401, 'UNAUTHORIZED');
};

/**
 * Forbidden response helper
 * @param {Object} res - Express response object
 * @param {string} message - Custom forbidden message
 */
const forbidden = (res, message = 'Access denied') => {
    return error(res, message, 403, 'FORBIDDEN');
};

/**
 * Conflict response helper
 * @param {Object} res - Express response object
 * @param {string} message - Conflict message
 * @param {*} data - Conflicting data
 */
const conflict = (res, message = 'Resource already exists', data = null) => {
    return error(res, message, 409, 'CONFLICT', null, data);
};

/**
 * Server error response helper
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Error} err - Original error object (for logging)
 */
const serverError = (res, message = 'Internal server error', err = null) => {
    // Log the actual error for debugging
    if (err) {
        console.error('Server Error Details:', {
            message: err.message,
            stack: err.stack,
            path: res.req.path,
            method: res.req.method,
            user: res.req.user?.email || 'anonymous',
            ip: res.req.ip,
            timestamp: new Date().toISOString()
        });
    }
    
    // Don't expose internal error details in production
    const publicMessage = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : message;
    
    return error(res, publicMessage, 500, 'INTERNAL_ERROR');
};

/**
 * Paginated response helper
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 */
const paginated = (res, data, pagination, message = 'Data retrieved successfully') => {
    const meta = {
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            pages: Math.ceil(pagination.total / pagination.limit),
            hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
            hasPrev: pagination.page > 1
        }
    };
    
    return success(res, data, message, 200, meta);
};

/**
 * Created response helper
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 */
const created = (res, data, message = 'Resource created successfully') => {
    return success(res, data, message, 201);
};

/**
 * Updated response helper
 * @param {Object} res - Express response object
 * @param {*} data - Updated resource data
 * @param {string} message - Success message
 */
const updated = (res, data, message = 'Resource updated successfully') => {
    return success(res, data, message, 200);
};

/**
 * Deleted response helper
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 */
const deleted = (res, message = 'Resource deleted successfully') => {
    return success(res, null, message, 200);
};

/**
 * No content response helper
 * @param {Object} res - Express response object
 */
const noContent = (res) => {
    return res.status(204).send();
};

/**
 * Middleware to add response timing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const addResponseTiming = (req, res, next) => {
    res.locals.startTime = Date.now();
    next();
};

/**
 * Transform data for API response
 * Removes sensitive fields and formats data consistently
 * @param {*} data - Data to transform
 * @param {Array} excludeFields - Fields to exclude from response
 * @returns {*} Transformed data
 */
const transformData = (data, excludeFields = []) => {
    if (!data) return data;
    
    // Default fields to exclude for security
    const defaultExcludeFields = [
        'password',
        'passwordHash',
        'resetToken',
        'resetTokenExpiry',
        'verificationToken',
        '__v'
    ];
    
    const fieldsToExclude = [...defaultExcludeFields, ...excludeFields];
    
    if (Array.isArray(data)) {
        return data.map(item => transformSingleItem(item, fieldsToExclude));
    }
    
    return transformSingleItem(data, fieldsToExclude);
};

/**
 * Transform a single item
 * @param {*} item - Item to transform
 * @param {Array} excludeFields - Fields to exclude
 * @returns {*} Transformed item
 */
const transformSingleItem = (item, excludeFields) => {
    if (!item || typeof item !== 'object') return item;
    
    // Handle Mongoose documents
    const plainItem = item.toObject ? item.toObject() : item;
    
    // Remove excluded fields
    const transformed = { ...plainItem };
    excludeFields.forEach(field => {
        delete transformed[field];
    });
    
    // Format dates consistently
    Object.keys(transformed).forEach(key => {
        if (transformed[key] instanceof Date) {
            transformed[key] = transformed[key].toISOString();
        }
    });
    
    return transformed;
};

/**
 * Error code constants for consistency
 */
const ERROR_CODES = {
    // Authentication & Authorization
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    
    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    
    // Resource Management
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    CONFLICT: 'CONFLICT',
    
    // Business Logic
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
    QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
    
    // System
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    
    // File Operations
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    UPLOAD_FAILED: 'UPLOAD_FAILED',
    
    // Database
    DATABASE_ERROR: 'DATABASE_ERROR',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    
    // Email
    EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
    INVALID_EMAIL: 'INVALID_EMAIL'
};

/**
 * Success code constants
 */
const SUCCESS_CODES = {
    CREATED: 'CREATED',
    UPDATED: 'UPDATED',
    DELETED: 'DELETED',
    RETRIEVED: 'RETRIEVED',
    PROCESSED: 'PROCESSED'
};

module.exports = {
    // Response helpers
    success,
    error,
    validationError,
    notFound,
    unauthorized,
    forbidden,
    conflict,
    serverError,
    paginated,
    created,
    updated,
    deleted,
    noContent,
    
    // Middleware
    addResponseTiming,
    
    // Utilities
    transformData,
    
    // Constants
    ERROR_CODES,
    SUCCESS_CODES
};