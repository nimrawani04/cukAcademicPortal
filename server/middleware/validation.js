/**
 * Enhanced Input Validation Middleware
 * Provides comprehensive validation utilities and sanitization
 * 
 * Features:
 * - Request validation with detailed error messages
 * - Input sanitization to prevent XSS and injection attacks
 * - Rate limiting for validation-heavy endpoints
 * - Custom validation rules for academic portal specific data
 */

const { validationResult, body, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');
const DOMPurify = require('isomorphic-dompurify');

/**
 * Middleware to handle validation results
 * Formats validation errors in a consistent structure
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next middleware function
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        // Group errors by field for better UX
        const errorsByField = {};
        const errorMessages = [];
        
        errors.array().forEach(error => {
            if (!errorsByField[error.path]) {
                errorsByField[error.path] = [];
            }
            errorsByField[error.path].push(error.msg);
            errorMessages.push(`${error.path}: ${error.msg}`);
        });
        
        // Log validation failures for security monitoring
        console.warn(`Validation failed for ${req.method} ${req.path}:`, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            errors: errorsByField,
            body: req.body ? Object.keys(req.body) : 'no body'
        });
        
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            errors: errorsByField,
            details: errorMessages
        });
    }
    
    next();
};

/**
 * Input sanitization middleware
 * Sanitizes request body, query, and params to prevent XSS attacks
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const sanitizeInput = (req, res, next) => {
    try {
        // Sanitize request body
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body);
        }
        
        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeObject(req.query);
        }
        
        // Sanitize URL parameters
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeObject(req.params);
        }
        
        next();
    } catch (error) {
        console.error('Input sanitization error:', error);
        res.status(500).json({
            success: false,
            message: 'Input processing error',
            code: 'SANITIZATION_ERROR'
        });
    }
};

/**
 * Recursively sanitize object properties
 * 
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
const sanitizeObject = (obj) => {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            // Remove HTML tags and dangerous characters
            sanitized[key] = DOMPurify.sanitize(value, { 
                ALLOWED_TAGS: [],
                ALLOWED_ATTR: []
            }).trim();
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[key] = sanitizeObject(value);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => 
                typeof item === 'string' 
                    ? DOMPurify.sanitize(item, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()
                    : typeof item === 'object' && item !== null
                        ? sanitizeObject(item)
                        : item
            );
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
};

/**
 * Rate limiting for validation-heavy endpoints
 * Prevents brute force attacks on registration and login
 */
const validationRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per windowMs
    message: {
        success: false,
        message: 'Too many validation requests from this IP, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for authenticated admin users
        return req.user && req.user.role === 'admin';
    }
});

/**
 * Custom validation rules for academic portal
 */

/**
 * Validate academic year (1-6 for undergraduate, 1-2 for postgraduate)
 */
const validateAcademicYear = (value, { req }) => {
    const year = parseInt(value);
    const course = req.body.course;
    
    if (!course) {
        throw new Error('Course is required to validate year');
    }
    
    // Define year limits based on course type
    const courseYearLimits = {
        'undergraduate': { min: 1, max: 4 },
        'postgraduate': { min: 1, max: 2 },
        'phd': { min: 1, max: 6 }
    };
    
    // Default to undergraduate if course type not specified
    const limits = courseYearLimits['undergraduate'];
    
    if (year < limits.min || year > limits.max) {
        throw new Error(`Year must be between ${limits.min} and ${limits.max} for this course type`);
    }
    
    return true;
};

/**
 * Validate Indian phone number format
 */
const validateIndianPhone = (value) => {
    // Indian phone number patterns
    const patterns = [
        /^[+]91[\s\-]?[6-9]\d{9}$/, // +91 format
        /^91[\s\-]?[6-9]\d{9}$/, // 91 format
        /^[6-9]\d{9}$/ // 10 digit format
    ];
    
    const isValid = patterns.some(pattern => pattern.test(value.replace(/[\s\-()]/g, '')));
    
    if (!isValid) {
        throw new Error('Please provide a valid Indian phone number');
    }
    
    return true;
};

/**
 * Validate strong password with custom rules
 */
const validateStrongPassword = (value) => {
    const minLength = 8;
    const maxLength = 128;
    
    if (value.length < minLength || value.length > maxLength) {
        throw new Error(`Password must be between ${minLength} and ${maxLength} characters`);
    }
    
    // Check for required character types
    const hasLowercase = /[a-z]/.test(value);
    const hasUppercase = /[A-Z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[@$!%*?&]/.test(value);
    
    if (!hasLowercase) {
        throw new Error('Password must contain at least one lowercase letter');
    }
    
    if (!hasUppercase) {
        throw new Error('Password must contain at least one uppercase letter');
    }
    
    if (!hasNumbers) {
        throw new Error('Password must contain at least one number');
    }
    
    if (!hasSpecialChar) {
        throw new Error('Password must contain at least one special character (@$!%*?&)');
    }
    
    // Check for common weak patterns
    const weakPatterns = [
        /123456/,
        /password/i,
        /qwerty/i,
        /admin/i,
        /letmein/i
    ];
    
    const hasWeakPattern = weakPatterns.some(pattern => pattern.test(value));
    if (hasWeakPattern) {
        throw new Error('Password contains common weak patterns');
    }
    
    return true;
};

/**
 * Validate email domain for academic institutions
 */
const validateAcademicEmail = (value) => {
    // Allow common academic domains and the institution domain
    const allowedDomains = [
        'gmail.com',
        'yahoo.com',
        'outlook.com',
        'hotmail.com',
        'cukashmir.ac.in', // Institution domain
        'edu',
        'ac.in'
    ];
    
    const domain = value.split('@')[1];
    
    // Check if it's an academic domain (.edu, .ac.in) or allowed domain
    const isAcademicDomain = domain.endsWith('.edu') || domain.endsWith('.ac.in');
    const isAllowedDomain = allowedDomains.includes(domain);
    
    if (!isAcademicDomain && !isAllowedDomain) {
        console.warn(`Non-academic email registration attempt: ${value}`);
        // Don't throw error, just log for monitoring
    }
    
    return true;
};

/**
 * Common validation chains for reuse across routes
 */
const commonValidations = {
    // User identification validations
    name: body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s.'-]+$/)
        .withMessage('Name can only contain letters, spaces, dots, hyphens, and apostrophes')
        .customSanitizer(value => value.replace(/\\s+/g, ' ')), // Normalize spaces
    
    email: body('email')
        .isEmail()
        .normalizeEmail({ gmail_remove_dots: false })
        .withMessage('Please provide a valid email address')
        .custom(validateAcademicEmail),
    
    phone: body('phone')
        .custom(validateIndianPhone),
    
    password: body('password')
        .custom(validateStrongPassword),
    
    // Academic specific validations
    rollNumber: body('rollNumber')
        .matches(/^[A-Z0-9]{6,15}$/)
        .withMessage('Roll number must be 6-15 characters long and contain only uppercase letters and numbers')
        .customSanitizer(value => value.toUpperCase()),
    
    facultyId: body('facultyId')
        .matches(/^FAC[0-9]{4,8}$/)
        .withMessage('Faculty ID must start with FAC followed by 4-8 digits')
        .customSanitizer(value => value.toUpperCase()),
    
    adminId: body('adminId')
        .matches(/^ADM[0-9]{4,8}$/)
        .withMessage('Admin ID must start with ADM followed by 4-8 digits')
        .customSanitizer(value => value.toUpperCase()),
    
    // MongoDB ObjectId validation
    mongoId: param('id')
        .isMongoId()
        .withMessage('Invalid ID format'),
    
    // Query parameter validations
    pageNumber: query('page')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Page number must be between 1 and 1000')
        .toInt(),
    
    pageSize: query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Page size must be between 1 and 100')
        .toInt(),
    
    sortOrder: query('sort')
        .optional()
        .isIn(['asc', 'desc', '1', '-1'])
        .withMessage('Sort order must be asc, desc, 1, or -1')
};

/**
 * Security headers middleware
 * Adds security-related headers to responses
 */
const securityHeaders = (req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
};

/**
 * Request size validation middleware
 * Prevents oversized requests that could cause DoS
 */
const validateRequestSize = (req, res, next) => {
    const maxBodySize = 10 * 1024 * 1024; // 10MB
    const maxUrlLength = 2048; // 2KB
    
    // Check URL length
    if (req.url.length > maxUrlLength) {
        return res.status(414).json({
            success: false,
            message: 'Request URL too long',
            code: 'URL_TOO_LONG'
        });
    }
    
    // Check if body size exceeds limit (this is also handled by express.json limit)
    if (req.get('content-length') && parseInt(req.get('content-length')) > maxBodySize) {
        return res.status(413).json({
            success: false,
            message: 'Request body too large',
            code: 'BODY_TOO_LARGE'
        });
    }
    
    next();
};

module.exports = {
    handleValidationErrors,
    sanitizeInput,
    validationRateLimit,
    securityHeaders,
    validateRequestSize,
    commonValidations,
    
    // Custom validators
    validateAcademicYear,
    validateIndianPhone,
    validateStrongPassword,
    validateAcademicEmail
};