// Validation Utilities - Common validation functions and helpers
const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors middleware
 * Use this after validation rules to check for errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.param,
                message: error.msg,
                value: error.value
            }))
        });
    }
    
    next();
};

/**
 * Common validation rules that can be reused across routes
 */
const commonValidations = {
    // MongoDB ObjectId validation
    mongoId: (field = 'id') => 
        param(field)
            .isMongoId()
            .withMessage(`Invalid ${field} format`),

    // Email validation
    email: (field = 'email') =>
        body(field)
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address'),

    // Password validation
    password: (field = 'password', minLength = 6) =>
        body(field)
            .isLength({ min: minLength })
            .withMessage(`Password must be at least ${minLength} characters long`)
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

    // Name validation
    name: (field, minLength = 2, maxLength = 50) =>
        body(field)
            .trim()
            .isLength({ min: minLength, max: maxLength })
            .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`)
            .matches(/^[a-zA-Z\s]+$/)
            .withMessage(`${field} can only contain letters and spaces`),

    // Phone number validation
    phone: (field = 'phone') =>
        body(field)
            .optional()
            .matches(/^\d{10}$/)
            .withMessage('Phone number must be 10 digits'),

    // Date validation
    date: (field) =>
        body(field)
            .isISO8601()
            .withMessage(`${field} must be a valid date in ISO format`),

    // Pagination validation
    pagination: () => [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100')
    ],

    // Course code validation
    courseCode: (field = 'code') =>
        body(field)
            .trim()
            .matches(/^[A-Z]{2,4}\d{3,4}$/)
            .withMessage('Course code must be in format like CS101 or MATH1001'),

    // Grade validation
    grade: (field = 'grade', maxPoints = null) => {
        let validation = body(field)
            .isNumeric()
            .withMessage('Grade must be a number')
            .custom((value) => {
                if (value < 0) {
                    throw new Error('Grade cannot be negative');
                }
                return true;
            });

        if (maxPoints) {
            validation = validation.custom((value, { req }) => {
                const totalPoints = req.body.totalPoints || maxPoints;
                if (value > totalPoints) {
                    throw new Error(`Grade cannot exceed ${totalPoints} points`);
                }
                return true;
            });
        }

        return validation;
    },

    // File validation
    fileUpload: (allowedTypes = ['jpg', 'jpeg', 'png', 'pdf'], maxSize = 5242880) => {
        return (req, res, next) => {
            if (!req.file && !req.files) {
                return next();
            }

            const files = req.files || [req.file];
            
            for (const file of files) {
                // Check file size
                if (file.size > maxSize) {
                    return res.status(400).json({
                        success: false,
                        message: `File ${file.originalname} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`
                    });
                }

                // Check file type
                const fileExtension = file.originalname.split('.').pop().toLowerCase();
                if (!allowedTypes.includes(fileExtension)) {
                    return res.status(400).json({
                        success: false,
                        message: `File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
                    });
                }
            }

            next();
        };
    }
};

/**
 * Sanitize input data
 * Remove potentially harmful characters and normalize data
 */
const sanitizeInput = {
    // Remove HTML tags and scripts
    stripHtml: (text) => {
        if (typeof text !== 'string') return text;
        return text.replace(/<[^>]*>/g, '').trim();
    },

    // Normalize whitespace
    normalizeWhitespace: (text) => {
        if (typeof text !== 'string') return text;
        return text.replace(/\s+/g, ' ').trim();
    },

    // Escape special characters for database queries
    escapeSpecialChars: (text) => {
        if (typeof text !== 'string') return text;
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    // Clean object by removing empty values
    cleanObject: (obj) => {
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== null && value !== undefined && value !== '') {
                cleaned[key] = value;
            }
        }
        return cleaned;
    }
};

/**
 * Custom validation functions
 */
const customValidations = {
    // Check if end date is after start date
    dateRange: (startDateField, endDateField) => {
        return body(endDateField).custom((endDate, { req }) => {
            const startDate = req.body[startDateField];
            if (startDate && new Date(endDate) <= new Date(startDate)) {
                throw new Error(`${endDateField} must be after ${startDateField}`);
            }
            return true;
        });
    },

    // Check if user exists in database
    userExists: (field = 'userId') => {
        return body(field).custom(async (value) => {
            const User = require('../models/User');
            const user = await User.findById(value);
            if (!user) {
                throw new Error('User not found');
            }
            return true;
        });
    },

    // Check if course exists and user has access
    courseAccess: (field = 'courseId') => {
        return body(field).custom(async (value, { req }) => {
            const Course = require('../models/Course');
            const course = await Course.findById(value);
            
            if (!course) {
                throw new Error('Course not found');
            }

            // Check if user has access based on role
            if (req.user.role === 'student') {
                const isEnrolled = course.enrolledStudents.some(
                    enrollment => enrollment.student.toString() === req.user.userId
                );
                if (!isEnrolled) {
                    throw new Error('Not enrolled in this course');
                }
            } else if (req.user.role === 'teacher') {
                if (course.instructor.toString() !== req.user.userId) {
                    throw new Error('Not authorized to access this course');
                }
            }
            // Admin has access to all courses

            return true;
        });
    },

    // Check if assignment belongs to user's course
    assignmentAccess: (field = 'assignmentId') => {
        return body(field).custom(async (value, { req }) => {
            const Assignment = require('../models/Assignment');
            const Course = require('../models/Course');
            
            const assignment = await Assignment.findById(value).populate('course');
            
            if (!assignment) {
                throw new Error('Assignment not found');
            }

            // Check course access
            const course = assignment.course;
            
            if (req.user.role === 'student') {
                const isEnrolled = course.enrolledStudents.some(
                    enrollment => enrollment.student.toString() === req.user.userId
                );
                if (!isEnrolled) {
                    throw new Error('Not enrolled in assignment course');
                }
            } else if (req.user.role === 'teacher') {
                if (course.instructor.toString() !== req.user.userId) {
                    throw new Error('Not authorized to access this assignment');
                }
            }

            return true;
        });
    }
};

/**
 * Validation rule sets for common operations
 */
const validationSets = {
    // User registration
    userRegistration: [
        commonValidations.name('firstName'),
        commonValidations.name('lastName'),
        commonValidations.email(),
        commonValidations.password(),
        body('role')
            .optional()
            .isIn(['student', 'teacher', 'admin'])
            .withMessage('Role must be student, teacher, or admin'),
        body('studentId')
            .optional()
            .isLength({ min: 5, max: 15 })
            .withMessage('Student ID must be between 5 and 15 characters'),
        handleValidationErrors
    ],

    // User login
    userLogin: [
        commonValidations.email(),
        body('password')
            .notEmpty()
            .withMessage('Password is required'),
        handleValidationErrors
    ],

    // Course creation
    courseCreation: [
        body('title')
            .trim()
            .isLength({ min: 3, max: 100 })
            .withMessage('Course title must be between 3 and 100 characters'),
        commonValidations.courseCode(),
        body('description')
            .trim()
            .isLength({ min: 10, max: 1000 })
            .withMessage('Description must be between 10 and 1000 characters'),
        body('credits')
            .isInt({ min: 1, max: 6 })
            .withMessage('Credits must be between 1 and 6'),
        commonValidations.date('startDate'),
        commonValidations.date('endDate'),
        customValidations.dateRange('startDate', 'endDate'),
        handleValidationErrors
    ]
};

module.exports = {
    handleValidationErrors,
    commonValidations,
    sanitizeInput,
    customValidations,
    validationSets
};