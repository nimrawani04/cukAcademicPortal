// Marks Routes - API endpoints for marks and grades management
const express = require('express');
const { body, param, query } = require('express-validator');
const marksController = require('../controllers/marksController');
const authMiddleware = require('../middleware/auth');
const { canUploadMarksAttendance } = require('../middleware/roleMiddleware');
const { excelUpload } = require('../config/multer');

const router = express.Router();

/**
 * Validation rules for creating marks manually
 */
const createMarksValidation = [
    body('studentId')
        .isMongoId()
        .withMessage('Valid student ID is required'),
    
    body('courseId')
        .isMongoId()
        .withMessage('Valid course ID is required'),
    
    body('subject')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Subject must be between 2 and 100 characters'),
    
    body('academicYear')
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format YYYY-YYYY (e.g., 2024-2025)'),
    
    body('semester')
        .isInt({ min: 1, max: 8 })
        .withMessage('Semester must be between 1 and 8'),
    
    body('test1')
        .optional()
        .isFloat({ min: 0, max: 25 })
        .withMessage('Test 1 marks must be between 0 and 25'),
    
    body('test2')
        .optional()
        .isFloat({ min: 0, max: 25 })
        .withMessage('Test 2 marks must be between 0 and 25'),
    
    body('assignment')
        .optional()
        .isFloat({ min: 0, max: 20 })
        .withMessage('Assignment marks must be between 0 and 20'),
    
    body('presentation')
        .optional()
        .isFloat({ min: 0, max: 15 })
        .withMessage('Presentation marks must be between 0 and 15'),
    
    body('attendanceMarks')
        .optional()
        .isFloat({ min: 0, max: 15 })
        .withMessage('Attendance marks must be between 0 and 15'),
    
    body('remarks')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Remarks cannot exceed 500 characters')
];

/**
 * Validation rules for updating marks
 */
const updateMarksValidation = [
    body('test1')
        .optional()
        .isFloat({ min: 0, max: 25 })
        .withMessage('Test 1 marks must be between 0 and 25'),
    
    body('test2')
        .optional()
        .isFloat({ min: 0, max: 25 })
        .withMessage('Test 2 marks must be between 0 and 25'),
    
    body('assignment')
        .optional()
        .isFloat({ min: 0, max: 20 })
        .withMessage('Assignment marks must be between 0 and 20'),
    
    body('presentation')
        .optional()
        .isFloat({ min: 0, max: 15 })
        .withMessage('Presentation marks must be between 0 and 15'),
    
    body('attendanceMarks')
        .optional()
        .isFloat({ min: 0, max: 15 })
        .withMessage('Attendance marks must be between 0 and 15'),
    
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
        .withMessage('Invalid marks ID format'),
    
    param('studentId')
        .isMongoId()
        .withMessage('Invalid student ID format'),
    
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
    
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
];

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/marks/template
 * Download Excel template for marks upload
 * Public endpoint for faculty and admin
 */
router.get('/template', 
    canUploadMarksAttendance,
    marksController.getExcelTemplate
);

/**
 * POST /api/marks/upload
 * Upload marks via Excel file
 * Only faculty and admin can upload marks
 */
router.post('/upload',
    canUploadMarksAttendance,
    excelUpload.single('excelFile'), // Single Excel file upload
    marksController.uploadMarksExcel
);

/**
 * POST /api/marks
 * Create marks manually
 * Only faculty and admin can create marks
 */
router.post('/',
    canUploadMarksAttendance,
    createMarksValidation,
    marksController.createMarks
);

/**
 * GET /api/marks/student/:studentId
 * Get marks for a specific student
 * Students can only see their own marks, faculty/admin can see any student's marks
 */
router.get('/student/:studentId',
    mongoIdValidation,
    queryValidation,
    marksController.getMarksByStudent
);

/**
 * GET /api/marks/course/:courseId
 * Get marks for a specific course
 * Faculty can see marks for courses they teach, admin can see all
 */
router.get('/course/:courseId',
    mongoIdValidation,
    queryValidation,
    marksController.getMarksByCourse
);

/**
 * PUT /api/marks/:id
 * Update marks for a specific record
 * Only faculty who teach the course or admin can update marks
 */
router.put('/:id',
    mongoIdValidation,
    updateMarksValidation,
    marksController.updateMarks
);

/**
 * DELETE /api/marks/:id
 * Delete marks (soft delete)
 * Only faculty who teach the course or admin can delete marks
 */
router.delete('/:id',
    mongoIdValidation,
    marksController.deleteMarks
);

/**
 * GET /api/marks/statistics
 * Get marks statistics for a course
 * Only faculty and admin can access statistics
 */
router.get('/statistics',
    canUploadMarksAttendance,
    [
        query('courseId')
            .isMongoId()
            .withMessage('Valid course ID is required'),
        query('academicYear')
            .matches(/^\d{4}-\d{4}$/)
            .withMessage('Academic year is required in format YYYY-YYYY'),
        query('semester')
            .isInt({ min: 1, max: 8 })
            .withMessage('Semester is required and must be between 1 and 8')
    ],
    marksController.getMarksStatistics
);

/**
 * GET /api/marks/my-marks
 * Get current student's marks (convenience endpoint)
 * Only students can access this endpoint
 */
router.get('/my-marks', 
    queryValidation,
    async (req, res) => {
        try {
            if (req.user.role !== 'student') {
                return res.status(403).json({
                    success: false,
                    message: 'This endpoint is only for students'
                });
            }

            // Redirect to student marks endpoint with current user's ID
            req.params.studentId = req.user.userId;
            return marksController.getMarksByStudent(req, res);

        } catch (error) {
            console.error('Get my marks error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching marks'
            });
        }
    }
);

module.exports = router;