const express = require('express');
const { body, param, query } = require('express-validator');
const noticeController = require('../controllers/noticeController');
const authMiddleware = require('../middleware/auth');
const { canUploadNotices } = require('../middleware/roleMiddleware');
const { noticeUpload } = require('../config/multer');

const router = express.Router();

/**
 * Validation rules for notice creation
 */
const createNoticeValidation = [
    body('title')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Title must be between 5 and 200 characters'),
    
    body('content')
        .trim()
        .isLength({ min: 10, max: 5000 })
        .withMessage('Content must be between 10 and 5000 characters'),
    
    body('priority')
        .optional()
        .isIn(['normal', 'important', 'urgent'])
        .withMessage('Priority must be normal, important, or urgent'),
    
    body('targetAudience')
        .optional()
        .isIn(['all', 'students', 'faculty', 'admin', 'specific_course', 'specific_year'])
        .withMessage('Target audience must be all, students, faculty, admin, specific_course, or specific_year'),
    
    body('expiryDate')
        .optional()
        .isISO8601()
        .withMessage('Expiry date must be in ISO format')
        .custom((value) => {
            if (value && new Date(value) <= new Date()) {
                throw new Error('Expiry date must be in the future');
            }
            return true;
        }),
    
    body('targetCourses')
        .optional()
        .isArray()
        .withMessage('Target courses must be an array'),
    
    body('targetCourses.*')
        .optional()
        .isMongoId()
        .withMessage('Each target course must be a valid course ID'),
    
    body('targetYears')
        .optional()
        .isArray()
        .withMessage('Target years must be an array'),
    
    body('targetYears.*')
        .optional()
        .isInt({ min: 1, max: 6 })
        .withMessage('Each target year must be between 1 and 6'),
    
    body('type')
        .optional()
        .isIn(['general', 'academic', 'exam', 'event', 'holiday', 'announcement'])
        .withMessage('Type must be general, academic, exam, event, holiday, or announcement')
];

/**
 * Validation rules for notice update
 */
const updateNoticeValidation = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Title must be between 5 and 200 characters'),
    
    body('content')
        .optional()
        .trim()
        .isLength({ min: 10, max: 5000 })
        .withMessage('Content must be between 10 and 5000 characters'),
    
    body('priority')
        .optional()
        .isIn(['normal', 'important', 'urgent'])
        .withMessage('Priority must be normal, important, or urgent'),
    
    body('targetAudience')
        .optional()
        .isIn(['all', 'students', 'faculty', 'admin', 'specific_course', 'specific_year'])
        .withMessage('Target audience must be all, students, faculty, admin, specific_course, or specific_year'),
    
    body('expiryDate')
        .optional()
        .isISO8601()
        .withMessage('Expiry date must be in ISO format')
        .custom((value) => {
            if (value && new Date(value) <= new Date()) {
                throw new Error('Expiry date must be in the future');
            }
            return true;
        })
];

/**
 * Validation for MongoDB ObjectId parameters
 */
const mongoIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid notice ID format')
];

/**
 * Validation for query parameters
 */
const queryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),
    
    query('priority')
        .optional()
        .isIn(['normal', 'important', 'urgent'])
        .withMessage('Priority filter must be normal, important, or urgent'),
    
    query('type')
        .optional()
        .isIn(['general', 'academic', 'exam', 'event', 'holiday', 'announcement'])
        .withMessage('Type filter must be valid'),
    
    query('search')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Search query must be between 2 and 100 characters')
];

// Public routes (no authentication required)

/**
 * GET /api/notices/students
 * Get notices specifically for students
 * Public endpoint that can be accessed without authentication
 */
router.get('/students',
    [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        
        query('limit')
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage('Limit must be between 1 and 50'),
        
        query('priority')
            .optional()
            .isIn(['normal', 'important', 'urgent'])
            .withMessage('Priority filter must be normal, important, or urgent'),
        
        query('year')
            .optional()
            .isInt({ min: 1, max: 6 })
            .withMessage('Year must be between 1 and 6'),
        
        query('courseId')
            .optional()
            .isMongoId()
            .withMessage('Course ID must be valid')
    ],
    noticeController.getNoticesForStudents
);

// Protected routes (authentication required)

/**
 * POST /api/notices
 * Create a new notice
 * Only faculty and admin can create notices
 */
router.post('/', 
    authMiddleware,
    canUploadNotices,
    noticeUpload.array('attachments', 5), // Allow up to 5 file attachments
    createNoticeValidation,
    noticeController.createNotice
);

/**
 * GET /api/notices
 * Get all notices based on user role and targeting
 * All authenticated users can view notices targeted to them
 */
router.get('/',
    authMiddleware,
    queryValidation,
    noticeController.getNotices
);

/**
 * GET /api/notices/:id
 * Get a specific notice by ID
 * Users can only view notices they have access to
 */
router.get('/:id',
    authMiddleware,
    mongoIdValidation,
    noticeController.getNoticeById
);

/**
 * PUT /api/notices/:id
 * Update a notice (Edit notice)
 * Only the creator or admin can update notices
 */
router.put('/:id',
    authMiddleware,
    mongoIdValidation,
    noticeUpload.array('attachments', 5), // Allow adding more attachments
    updateNoticeValidation,
    noticeController.updateNotice
);

/**
 * DELETE /api/notices/:id
 * Delete a notice (soft delete)
 * Only the creator or admin can delete notices
 */
router.delete('/:id',
    authMiddleware,
    mongoIdValidation,
    noticeController.deleteNotice
);

module.exports = router;