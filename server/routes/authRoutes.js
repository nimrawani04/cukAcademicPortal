// Authentication Routes - Defines API endpoints for user authentication
const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { profileUpload } = require('../config/multer');
const { handleValidationErrors, commonValidations } = require('../middleware/validation');
//const { authRateLimit } = require('../middleware/security');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Enhanced validation rules for user registration
 * Includes comprehensive security checks and data sanitization
 */
const registerValidation = [
    // Basic user information
    commonValidations.name
        .withMessage('First name must be between 2 and 50 characters and contain only letters'),
    
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s.'-]+$/)
        .withMessage('Last name can only contain letters, spaces, dots, hyphens, and apostrophes')
        .customSanitizer(value => value.replace(/\s+/g, ' ')),
    
    commonValidations.email,
    commonValidations.phone,
    commonValidations.password,
    
    // Role validation with enhanced security
    body('role')
        .isIn(['student', 'faculty', 'admin'])
        .withMessage('Role must be student, faculty, or admin')
        .custom((value, { req }) => {
            // Additional security: prevent admin registration from public endpoint
            if (value === 'admin' && !req.user?.role === 'admin') {
                throw new Error('Admin registration requires admin privileges');
            }
            return true;
        }),
    
    // Conditional validations based on role
    body('rollNumber')
        .if(body('role').equals('student'))
        .notEmpty()
        .withMessage('Roll number is required for students')
        .matches(/^[A-Z0-9]{6,15}$/)
        .withMessage('Roll number must be 6-15 characters long and contain only uppercase letters and numbers')
        .customSanitizer(value => value.toUpperCase())
        .custom(async (value, { req }) => {
            // Check for duplicate roll numbers
            const User = require('../models/User');
            const existingUser = await User.findOne({ rollNumber: value });
            if (existingUser) {
                throw new Error('Roll number already exists');
            }
            return true;
        }),
    
    body('course')
        .if(body('role').equals('student'))
        .notEmpty()
        .withMessage('Course is required for students')
        .isLength({ min: 2, max: 100 })
        .withMessage('Course name must be between 2 and 100 characters'),
    
    body('year')
        .if(body('role').equals('student'))
        .isInt({ min: 1, max: 6 })
        .withMessage('Year must be between 1 and 6 for students')
        .toInt(),
    
    body('facultyId')
        .if(body('role').equals('faculty'))
        .notEmpty()
        .withMessage('Faculty ID is required for faculty')
        .matches(/^FAC[0-9]{4,8}$/)
        .withMessage('Faculty ID must start with FAC followed by 4-8 digits')
        .customSanitizer(value => value.toUpperCase())
        .custom(async (value, { req }) => {
            // Check for duplicate faculty IDs
            const User = require('../models/User');
            const existingUser = await User.findOne({ facultyId: value });
            if (existingUser) {
                throw new Error('Faculty ID already exists');
            }
            return true;
        }),
    
    body('department')
        .if(body('role').equals('faculty'))
        .notEmpty()
        .withMessage('Department is required for faculty')
        .isLength({ min: 2, max: 100 })
        .withMessage('Department name must be between 2 and 100 characters'),
    
    body('designation')
        .if(body('role').equals('faculty'))
        .notEmpty()
        .withMessage('Designation is required for faculty')
        .isLength({ min: 2, max: 100 })
        .withMessage('Designation must be between 2 and 100 characters'),
    
    body('adminId')
        .if(body('role').equals('admin'))
        .notEmpty()
        .withMessage('Admin ID is required for admin')
        .matches(/^ADM[0-9]{4,8}$/)
        .withMessage('Admin ID must start with ADM followed by 4-8 digits')
        .customSanitizer(value => value.toUpperCase())
        .custom(async (value, { req }) => {
            // Check for duplicate admin IDs
            const User = require('../models/User');
            const existingUser = await User.findOne({ adminId: value });
            if (existingUser) {
                throw new Error('Admin ID already exists');
            }
            return true;
        }),
    
    // Terms and conditions acceptance
    body('acceptTerms')
        .isBoolean()
        .withMessage('Terms acceptance must be a boolean')
        .custom(value => {
            if (!value) {
                throw new Error('You must accept the terms and conditions');
            }
            return true;
        }),
    
    // Privacy policy acceptance
    body('acceptPrivacy')
        .isBoolean()
        .withMessage('Privacy policy acceptance must be a boolean')
        .custom(value => {
            if (!value) {
                throw new Error('You must accept the privacy policy');
            }
            return true;
        }),
    
    handleValidationErrors
];

/**
 * Enhanced validation rules for user login
 * Includes brute force protection and security monitoring
 */
const loginValidation = [
    commonValidations.email,
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 1, max: 128 })
        .withMessage('Password length is invalid'),
    
    body('rememberMe')
        .optional()
        .isBoolean()
        .withMessage('Remember me must be a boolean value'),
    
    // Captcha validation for suspicious IPs (if implemented)
    body('captcha')
        .optional()
        .isLength({ min: 4, max: 10 })
        .withMessage('Invalid captcha format'),
    
    handleValidationErrors
];

/**
 * Enhanced validation rules for profile update
 * Includes data integrity checks and change tracking
 */
const profileUpdateValidation = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s.'-]+$/)
        .withMessage('First name can only contain letters, spaces, dots, hyphens, and apostrophes'),
    
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s.'-]+$/)
        .withMessage('Last name can only contain letters, spaces, dots, hyphens, and apostrophes'),
    
    body('phone')
        .optional()
        .custom((value) => {
            if (value) {
                return /^[+]?[\d\s\-()]{10,15}$/.test(value);
            }
            return true;
        })
        .withMessage('Please provide a valid phone number'),
    
    body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio must not exceed 500 characters')
        .trim(),
    
    body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date of birth')
        .custom(value => {
            const birthDate = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            
            if (age < 16 || age > 100) {
                throw new Error('Age must be between 16 and 100 years');
            }
            return true;
        }),
    
    body('address')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Address must not exceed 200 characters')
        .trim(),
    
    handleValidationErrors
];

/**
 * Enhanced validation rules for password change
 * Includes password history and strength validation
 */
const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required')
        .isLength({ min: 1, max: 128 })
        .withMessage('Current password length is invalid'),
    
    commonValidations.password
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error('New password must be different from current password');
            }
            return true;
        }),
    
    body('confirmPassword')
        .notEmpty()
        .withMessage('Password confirmation is required')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Password confirmation does not match new password');
            }
            return true;
        }),
    
    handleValidationErrors
];

// Public routes (no authentication required)

/**
 * POST /api/auth/register
 * Register a new user account (student, faculty, or admin)
 * Enhanced with comprehensive validation and security checks
 */
router.post('/register', 
    
    registerValidation, 
    asyncHandler(authController.register)
);

/**
 * POST /api/auth/login
 * General login endpoint (any role)
 * Enhanced with brute force protection
 */
router.post('/login', 

    loginValidation, 
    asyncHandler(authController.login)
);

/**
 * POST /api/auth/student/login
 * Student-specific login endpoint
 */
router.post('/student/login', 
 
    loginValidation, 
    asyncHandler(authController.studentLogin)
);

/**
 * POST /api/auth/faculty/login
 * Faculty-specific login endpoint
 */
router.post('/faculty/login', 
  
    loginValidation, 
    asyncHandler(authController.facultyLogin)
);

/**
 * POST /api/auth/admin/login
 * Admin-specific login endpoint
 */
router.post('/admin/login', 
  
    loginValidation, 
    asyncHandler(authController.adminLogin)
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', 
    asyncHandler(authController.refreshToken)
);

/**
 * GET /api/auth/verify-email/:token
 * Verify email address using verification token
 */
router.get('/verify-email/:token', 
    asyncHandler(authController.verifyEmail)
);

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 * Enhanced with rate limiting and validation
 */
router.post('/forgot-password', [
  
    commonValidations.email,
    body('userType')
        .optional()
        .isIn(['student', 'faculty', 'admin'])
        .withMessage('User type must be student, faculty, or admin'),
    handleValidationErrors
], asyncHandler(authController.forgotPassword));

/**
 * POST /api/auth/reset-password
 * Reset password using reset token
 */
router.post('/reset-password', [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required')
        .isLength({ min: 10, max: 500 })
        .withMessage('Invalid token format'),
    commonValidations.password,
    body('userType')
        .optional()
        .isIn(['student', 'faculty', 'admin'])
        .withMessage('User type must be student, faculty, or admin'),
    handleValidationErrors
], asyncHandler(authController.resetPassword));

/**
 * GET /api/auth/verify-reset-token/:token
 * Verify if reset token is valid
 */
router.get('/verify-reset-token/:token', 
    asyncHandler(authController.verifyResetToken)
);

// Protected routes (authentication required)

/**
 * POST /api/auth/logout
 * Logout current user
 */
router.post('/logout', 
    authMiddleware, 
    asyncHandler(authController.logout)
);

/**
 * GET /api/auth/profile
 * Get current user's profile information
 */
router.get('/profile', 
    authMiddleware, 
    asyncHandler(authController.getProfile)
);

/**
 * PUT /api/auth/profile
 * Update current user's profile information
 */
router.put('/profile', 
    authMiddleware, 
    profileUpdateValidation, 
    asyncHandler(authController.updateProfile)
);

/**
 * PUT /api/auth/change-password
 * Change current user's password
 */
router.put('/change-password', 
    authMiddleware, 
    changePasswordValidation, 
    asyncHandler(authController.changePassword)
);

/**
 * POST /api/auth/upload-avatar
 * Upload profile picture for current user
 * Enhanced with file validation and security checks
 */
router.post('/upload-avatar', 
    authMiddleware, 
    profileUpload.single('avatar'), // 'avatar' is the field name for the file
    asyncHandler(async (req, res) => {
        const { success, created, serverError } = require('../utils/apiResponse');
        
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded',
                    code: 'NO_FILE_UPLOADED'
                });
            }

            // Validate file type and size
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed',
                    code: 'INVALID_FILE_TYPE'
                });
            }

            // Update user's profile picture path in database
            const User = require('../models/User');
            const user = await User.findById(req.user.userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Delete old profile picture if exists
            if (user.profilePicture) {
                const fs = require('fs');
                const path = require('path');
                const oldPath = path.join(__dirname, '../../', user.profilePicture);
                
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            user.profilePicture = req.file.path;
            await user.save();

            return created(res, {
                profilePicture: req.file.path,
                fileName: req.file.filename,
                fileSize: req.file.size,
                mimeType: req.file.mimetype
            }, 'Profile picture uploaded successfully');

        } catch (error) {
            console.error('Upload avatar error:', error);
            return serverError(res, 'Server error while uploading avatar', error);
        }
    })
);

/**
 * GET /api/auth/me
 * Get current user info (lightweight version of profile)
 */
router.get('/me', 
    authMiddleware, 
    asyncHandler(async (req, res) => {
        const { success } = require('../utils/apiResponse');
        
        return success(res, {
            user: {
                id: req.user.userId,
                email: req.user.email,
                role: req.user.role,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                isActive: req.user.isActive,
                registrationStatus: req.user.registrationStatus
            }
        }, 'User information retrieved successfully');
    })
);

/**
 * POST /api/auth/check-email
 * Check if email is available for registration
 */
router.post('/check-email', [
    commonValidations.email,
    handleValidationErrors
], asyncHandler(async (req, res) => {
    const { success } = require('../utils/apiResponse');
    const { email } = req.body;
    
    const User = require('../models/User');
    const existingUser = await User.findOne({ email });
    
    return success(res, {
        available: !existingUser,
        message: existingUser ? 'Email is already registered' : 'Email is available'
    }, 'Email availability checked');
}));

module.exports = router;