// Registration Routes - API endpoints for registration workflow and status checking
const express = require('express');
const { body } = require('express-validator');
const registrationController = require('../controllers/registrationController');
const authMiddleware = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * Validation rules for user registration
 */
const registerValidation = [
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('First name can only contain letters and spaces'),
    
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Last name can only contain letters and spaces'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    body('phone')
        .matches(/^[+]?[\d\s\-()]{10,15}$/)
        .withMessage('Please provide a valid phone number'),
    
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('registrationType')
        .isIn(['student', 'faculty'])
        .withMessage('Registration type must be student or faculty')
];

/**
 * Validation rules for email checking
 */
const emailValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address')
];

/**
 * Validation rules for approval/rejection
 */
const approvalValidation = [
    body('loginCredentials.loginId')
        .optional()
        .isLength({ min: 3, max: 50 })
        .withMessage('Login ID must be between 3 and 50 characters'),
    body('loginCredentials.password')
        .optional()
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
];

const rejectionValidation = [
    body('reason')
        .isLength({ min: 10, max: 500 })
        .withMessage('Rejection reason must be between 10 and 500 characters')
];

/**
 * POST /api/registration/register
 * Register a new user
 * Public endpoint - no authentication required
 */
router.post('/register',
    registerValidation,
    registrationController.registerUser
);

/**
 * PUT /api/registration/approve/:id
 * Approve a registration
 * Admin only endpoint
 */
router.put('/approve/:id',
    authMiddleware,
    adminOnly,
    approvalValidation,
    registrationController.approveRegistration
);

/**
 * PUT /api/registration/reject/:id
 * Reject a registration
 * Admin only endpoint
 */
router.put('/reject/:id',
    authMiddleware,
    adminOnly,
    rejectionValidation,
    registrationController.rejectRegistration
);

/**
 * POST /api/registration/check-status
 * Check registration status by email
 * Public endpoint - no authentication required
 */
router.post('/check-status', 
    emailValidation,
    registrationController.checkRegistrationStatus
);

/**
 * POST /api/registration/resend-confirmation
 * Resend registration confirmation email
 * Public endpoint - no authentication required
 */
router.post('/resend-confirmation',
    emailValidation,
    registrationController.resendConfirmation
);

/**
 * GET /api/registration/statistics
 * Get registration statistics for admin dashboard
 * Admin only endpoint
 */
router.get('/statistics',
    authMiddleware,
    adminOnly,
    registrationController.getRegistrationStatistics
);

/**
 * GET /api/registration/recent-activity
 * Get recent registration activity for admin dashboard
 * Admin only endpoint
 */
router.get('/recent-activity',
    authMiddleware,
    adminOnly,
    registrationController.getRecentActivity
);

module.exports = router;