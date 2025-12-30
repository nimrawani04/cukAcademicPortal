// Course Routes - Defines API endpoints for course management
const express = require('express');
const { body, param, query } = require('express-validator');
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * Validation rules for course creation
 */
const createCourseValidation = [
    body('title')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Course title must be between 3 and 100 characters'),
    
    body('code')
        .trim()
        .matches(/^[A-Z]{2,4}\d{3,4}$/)
        .withMessage('Course code must be in format like CS101 or MATH1001'),
    
    body('description')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),
    
    body('credits')
        .isInt({ min: 1, max: 6 })
        .withMessage('Credits must be between 1 and 6'),
    
    body('department')
        .isIn(['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History'])
        .withMessage('Invalid department'),
    
    body('instructor')
        .isMongoId()
        .withMessage('Invalid instructor ID'),
    
    body('startDate')
        .isISO8601()
        .withMessage('Invalid start date format'),
    
    body('endDate')
        .isISO8601()
        .withMessage('Invalid end date format')
        .custom((endDate, { req }) => {
            if (new Date(endDate) <= new Date(req.body.startDate)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),
    
    body('maxEnrollment')
        .optional()
        .isInt({ min: 1, max: 200 })
        .withMessage('Max enrollment must be between 1 and 200'),
    
    body('schedule.days')
        .isArray({ min: 1 })
        .withMessage('At least one day must be selected'),
    
    body('schedule.days.*')
        .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])
        .withMessage('Invalid day selected'),
    
    body('schedule.startTime')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Start time must be in HH:MM format'),
    
    body('schedule.endTime')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('End time must be in HH:MM format'),
    
    body('schedule.room')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('Room number cannot exceed 20 characters')
];

/**
 * Validation for MongoDB ObjectId parameters
 */
const mongoIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid course ID format')
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
    
    query('department')
        .optional()
        .isIn(['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History'])
        .withMessage('Invalid department filter')
];

// Public routes (authentication required but no specific role)

/**
 * GET /api/courses
 * Get all courses with pagination and filtering
 * Query parameters: page, limit, department, search
 */
router.get('/', authMiddleware, queryValidation, courseController.getAllCourses);

/**
 * GET /api/courses/:id
 * Get single course by ID with detailed information
 */
router.get('/:id', authMiddleware, mongoIdValidation, courseController.getCourseById);

// Student routes

/**
 * POST /api/courses/:id/enroll
 * Enroll current user (student) in a course
 */
router.post('/:id/enroll', 
    authMiddleware, 
    roleMiddleware(['student']), 
    mongoIdValidation, 
    courseController.enrollStudent
);

// Teacher/Admin routes

/**
 * POST /api/courses
 * Create a new course (Admin only)
 */
router.post('/', 
    authMiddleware, 
    roleMiddleware(['admin']), 
    createCourseValidation, 
    courseController.createCourse
);

/**
 * PUT /api/courses/:id
 * Update course information (Admin or course instructor only)
 */
router.put('/:id', 
    authMiddleware, 
    roleMiddleware(['admin', 'teacher']), 
    mongoIdValidation,
    [
        // Validation for update (similar to create but all fields optional)
        body('title')
            .optional()
            .trim()
            .isLength({ min: 3, max: 100 })
            .withMessage('Course title must be between 3 and 100 characters'),
        
        body('description')
            .optional()
            .trim()
            .isLength({ min: 10, max: 1000 })
            .withMessage('Description must be between 10 and 1000 characters'),
        
        body('credits')
            .optional()
            .isInt({ min: 1, max: 6 })
            .withMessage('Credits must be between 1 and 6'),
        
        body('maxEnrollment')
            .optional()
            .isInt({ min: 1, max: 200 })
            .withMessage('Max enrollment must be between 1 and 200')
    ],
    courseController.updateCourse
);

/**
 * DELETE /api/courses/:id
 * Soft delete a course (Admin only)
 */
router.delete('/:id', 
    authMiddleware, 
    roleMiddleware(['admin']), 
    mongoIdValidation,
    async (req, res) => {
        try {
            const Course = require('../models/Course');
            const course = await Course.findById(req.params.id);
            
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            // Soft delete by setting isActive to false
            course.isActive = false;
            await course.save();

            res.json({
                success: true,
                message: 'Course deleted successfully'
            });

        } catch (error) {
            console.error('Delete course error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while deleting course'
            });
        }
    }
);

/**
 * GET /api/courses/:id/students
 * Get list of enrolled students for a course (Instructor or Admin only)
 */
router.get('/:id/students', 
    authMiddleware, 
    roleMiddleware(['admin', 'teacher']), 
    mongoIdValidation,
    async (req, res) => {
        try {
            const Course = require('../models/Course');
            const course = await Course.findById(req.params.id)
                .populate('enrolledStudents.student', 'firstName lastName email studentId phone')
                .populate('instructor', 'firstName lastName');

            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            // Check if user is authorized (admin or course instructor)
            const User = require('../models/User');
            const user = await User.findById(req.user.userId);
            
            if (user.role !== 'admin' && course.instructor._id.toString() !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view course students'
                });
            }

            res.json({
                success: true,
                data: {
                    course: {
                        id: course._id,
                        title: course.title,
                        code: course.code
                    },
                    students: course.enrolledStudents
                }
            });

        } catch (error) {
            console.error('Get course students error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching course students'
            });
        }
    }
);

module.exports = router;