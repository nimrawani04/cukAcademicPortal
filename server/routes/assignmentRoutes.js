const express = require('express');
const { body, param, query } = require('express-validator');
const assignmentController = require('../controllers/assignmentController');
const authMiddleware = require('../middleware/auth');
const { canUploadMarksAttendance } = require('../middleware/roleMiddleware');
const { assignmentUpload } = require('../config/multer');

const router = express.Router();

/**
 * Validation rules for creating assignments
 */
const createAssignmentValidation = [
    body('title')
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    
    body('description')
        .trim()
        .isLength({ min: 10, max: 5000 })
        .withMessage('Description must be between 10 and 5000 characters'),
    
    body('subject')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Subject must be between 2 and 100 characters'),
    
    body('deadline')
        .isISO8601()
        .withMessage('Deadline must be in ISO format')
        .custom((value) => {
            if (new Date(value) <= new Date()) {
                throw new Error('Deadline must be in the future');
            }
            return true;
        }),
    
    body('courseId')
        .isMongoId()
        .withMessage('Valid course ID is required'),
    
    body('academicYear')
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format YYYY-YYYY (e.g., 2024-2025)'),
    
    body('semester')
        .isInt({ min: 1, max: 8 })
        .withMessage('Semester must be between 1 and 8'),
    
    body('totalPoints')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Total points must be between 1 and 1000'),
    
    body('type')
        .optional()
        .isIn(['homework', 'quiz', 'exam', 'project', 'lab', 'assignment', 'presentation'])
        .withMessage('Type must be homework, quiz, exam, project, lab, assignment, or presentation'),
    
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Priority must be low, medium, high, or urgent'),
    
    body('instructions')
        .optional()
        .isLength({ max: 5000 })
        .withMessage('Instructions cannot exceed 5000 characters'),
    
    body('allowLateSubmission')
        .optional()
        .isBoolean()
        .withMessage('Allow late submission must be a boolean'),
    
    body('latePenalty')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Late penalty must be between 0 and 100'),
    
    body('maxSubmissions')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Max submissions must be at least 1'),
    
    body('remarks')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Remarks cannot exceed 500 characters')
];

/**
 * Validation rules for updating assignments
 */
const updateAssignmentValidation = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ min: 10, max: 5000 })
        .withMessage('Description must be between 10 and 5000 characters'),
    
    body('subject')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Subject must be between 2 and 100 characters'),
    
    body('deadline')
        .optional()
        .isISO8601()
        .withMessage('Deadline must be in ISO format')
        .custom((value) => {
            if (new Date(value) <= new Date()) {
                throw new Error('Deadline must be in the future');
            }
            return true;
        }),
    
    body('totalPoints')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Total points must be between 1 and 1000'),
    
    body('type')
        .optional()
        .isIn(['homework', 'quiz', 'exam', 'project', 'lab', 'assignment', 'presentation'])
        .withMessage('Type must be homework, quiz, exam, project, lab, assignment, or presentation'),
    
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Priority must be low, medium, high, or urgent'),
    
    body('instructions')
        .optional()
        .isLength({ max: 5000 })
        .withMessage('Instructions cannot exceed 5000 characters'),
    
    body('allowLateSubmission')
        .optional()
        .isBoolean()
        .withMessage('Allow late submission must be a boolean'),
    
    body('latePenalty')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Late penalty must be between 0 and 100'),
    
    body('maxSubmissions')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Max submissions must be at least 1'),
    
    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('Is published must be a boolean'),
    
    body('remarks')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Remarks cannot exceed 500 characters')
];

/**
 * Validation for MongoDB ObjectId parameters
 */
const mongoIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid assignment ID format'),
    
    param('courseId')
        .isMongoId()
        .withMessage('Invalid course ID format')
];

/**
 * Query validation for filtering
 */
const queryValidation = [
    query('academicYear')
        .optional()
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format YYYY-YYYY'),
    
    query('semester')
        .optional()
        .isInt({ min: 1, max: 8 })
        .withMessage('Semester must be between 1 and 8'),
    
    query('type')
        .optional()
        .isIn(['homework', 'quiz', 'exam', 'project', 'lab', 'assignment', 'presentation'])
        .withMessage('Type must be valid'),
    
    query('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Priority must be valid'),
    
    query('status')
        .optional()
        .isIn(['pending', 'submitted', 'overdue'])
        .withMessage('Status must be pending, submitted, or overdue'),
    
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),
    
    query('days')
        .optional()
        .isInt({ min: 1, max: 30 })
        .withMessage('Days must be between 1 and 30')
];

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/assignments
 * Create/Upload assignment
 * Only faculty and admin can create assignments
 */
router.post('/',
    canUploadMarksAttendance,
    assignmentUpload.single('assignmentFile'), // Single file upload for main assignment
    createAssignmentValidation,
    assignmentController.createAssignment
);

/**
 * GET /api/assignments/course/:courseId
 * Get assignments for a specific course
 * Faculty can see all assignments, students can see published assignments
 */
router.get('/course/:courseId',
    [param('courseId').isMongoId().withMessage('Invalid course ID format')],
    queryValidation,
    assignmentController.getCourseAssignments
);

/**
 * GET /api/assignments/my-assignments
 * Get assignments for current student (convenience endpoint)
 * Only students can access this endpoint
 */
router.get('/my-assignments',
    queryValidation,
    assignmentController.getMyAssignments
);

/**
 * GET /api/assignments/upcoming-deadlines
 * Get upcoming assignment deadlines
 * All authenticated users can view upcoming deadlines for their courses
 */
router.get('/upcoming-deadlines',
    [
        query('courseId')
            .isMongoId()
            .withMessage('Valid course ID is required'),
        ...queryValidation
    ],
    assignmentController.getUpcomingDeadlines
);

/**
 * GET /api/assignments/:id
 * Get a specific assignment by ID
 * Users can only view assignments they have access to
 */
router.get('/:id',
    mongoIdValidation,
    assignmentController.getAssignmentById
);

/**
 * GET /api/assignments/:id/download
 * Download assignment file
 * Users can only download assignments they have access to
 */
router.get('/:id/download',
    mongoIdValidation,
    assignmentController.downloadAssignment
);

/**
 * PUT /api/assignments/:id
 * Update assignment
 * Only the creator (faculty) or admin can update assignments
 */
router.put('/:id',
    mongoIdValidation,
    assignmentUpload.single('assignmentFile'), // Allow updating the assignment file
    updateAssignmentValidation,
    assignmentController.updateAssignment
);

/**
 * DELETE /api/assignments/:id
 * Delete assignment (soft delete)
 * Only the creator (faculty) or admin can delete assignments
 */
router.delete('/:id',
    mongoIdValidation,
    assignmentController.deleteAssignment
);

/**
 * GET /api/assignments/:id/statistics
 * Get assignment statistics (submissions, grades, etc.)
 * Only faculty and admin can view assignment statistics
 */
router.get('/:id/statistics',
    mongoIdValidation,
    assignmentController.getAssignmentStatistics
);

module.exports = router;