// Attendance Routes - API endpoints for attendance management
const express = require('express');
const { body, param, query } = require('express-validator');
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/auth');
const { canUploadMarksAttendance } = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * Validation rules for marking attendance
 */
const markAttendanceValidation = [
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
    
    body('date')
        .isISO8601()
        .withMessage('Valid date is required in ISO format')
        .custom((value) => {
            const date = new Date(value);
            const today = new Date();
            today.setHours(23, 59, 59, 999); // End of today
            
            if (date > today) {
                throw new Error('Attendance date cannot be in the future');
            }
            return true;
        }),
    
    body('status')
        .isIn(['present', 'absent', 'late', 'excused'])
        .withMessage('Status must be one of: present, absent, late, excused'),
    
    body('academicYear')
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format YYYY-YYYY (e.g., 2024-2025)'),
    
    body('semester')
        .isInt({ min: 1, max: 8 })
        .withMessage('Semester must be between 1 and 8'),
    
    body('classType')
        .optional()
        .isIn(['lecture', 'lab', 'tutorial', 'seminar', 'practical'])
        .withMessage('Class type must be one of: lecture, lab, tutorial, seminar, practical'),
    
    body('duration')
        .optional()
        .isInt({ min: 15, max: 300 })
        .withMessage('Duration must be between 15 and 300 minutes'),
    
    body('remarks')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Remarks cannot exceed 500 characters')
];

/**
 * Validation rules for bulk attendance marking
 */
const bulkAttendanceValidation = [
    body('attendanceData')
        .isArray({ min: 1 })
        .withMessage('Attendance data array is required and must contain at least one entry'),
    
    body('attendanceData.*.studentId')
        .isMongoId()
        .withMessage('Valid student ID is required for each attendance entry'),
    
    body('attendanceData.*.courseId')
        .isMongoId()
        .withMessage('Valid course ID is required for each attendance entry'),
    
    body('attendanceData.*.subject')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Subject must be between 2 and 100 characters'),
    
    body('attendanceData.*.date')
        .isISO8601()
        .withMessage('Valid date is required in ISO format'),
    
    body('attendanceData.*.status')
        .isIn(['present', 'absent', 'late', 'excused'])
        .withMessage('Status must be one of: present, absent, late, excused'),
    
    body('attendanceData.*.academicYear')
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format YYYY-YYYY'),
    
    body('attendanceData.*.semester')
        .isInt({ min: 1, max: 8 })
        .withMessage('Semester must be between 1 and 8')
];

/**
 * Validation rules for updating attendance
 */
const updateAttendanceValidation = [
    body('status')
        .isIn(['present', 'absent', 'late', 'excused'])
        .withMessage('Status must be one of: present, absent, late, excused'),
    
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
        .withMessage('Invalid attendance ID format'),
    
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
    
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be in ISO format'),
    
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be in ISO format')
        .custom((endDate, { req }) => {
            if (req.query.startDate && endDate) {
                if (new Date(endDate) < new Date(req.query.startDate)) {
                    throw new Error('End date must be after start date');
                }
            }
            return true;
        }),
    
    query('status')
        .optional()
        .isIn(['present', 'absent', 'late', 'excused'])
        .withMessage('Status must be one of: present, absent, late, excused'),
    
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 200 })
        .withMessage('Limit must be between 1 and 200')
];

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/attendance
 * Mark attendance for a single student
 * Only faculty and admin can mark attendance
 */
router.post('/',
    canUploadMarksAttendance,
    markAttendanceValidation,
    attendanceController.markAttendance
);

/**
 * POST /api/attendance/bulk
 * Mark attendance for multiple students
 * Only faculty and admin can mark bulk attendance
 */
router.post('/bulk',
    canUploadMarksAttendance,
    bulkAttendanceValidation,
    attendanceController.markBulkAttendance
);

/**
 * GET /api/attendance/student/:studentId
 * Get attendance for a specific student
 * Students can only see their own attendance, faculty/admin can see any student's attendance
 */
router.get('/student/:studentId',
    mongoIdValidation,
    queryValidation,
    attendanceController.getStudentAttendance
);

/**
 * GET /api/attendance/course/:courseId
 * Get attendance for a specific course
 * Faculty can see attendance for courses they teach, admin can see all
 */
router.get('/course/:courseId',
    mongoIdValidation,
    queryValidation,
    attendanceController.getCourseAttendance
);

/**
 * GET /api/attendance/percentage/:studentId/:courseId
 * Get attendance percentage for a student in a specific course
 * Students can only see their own percentage, faculty can see for their courses
 */
router.get('/percentage/:studentId/:courseId',
    [
        param('studentId').isMongoId().withMessage('Invalid student ID format'),
        param('courseId').isMongoId().withMessage('Invalid course ID format')
    ],
    queryValidation,
    attendanceController.getAttendancePercentage
);

/**
 * PUT /api/attendance/:id
 * Update attendance record
 * Only faculty who teach the course or admin can update attendance
 */
router.put('/:id',
    mongoIdValidation,
    updateAttendanceValidation,
    attendanceController.updateAttendance
);

/**
 * DELETE /api/attendance/:id
 * Delete attendance record (soft delete)
 * Only faculty who teach the course or admin can delete attendance
 */
router.delete('/:id',
    mongoIdValidation,
    attendanceController.deleteAttendance
);

/**
 * GET /api/attendance/my-attendance
 * Get current student's attendance (convenience endpoint)
 * Only students can access this endpoint
 */
router.get('/my-attendance',
    queryValidation,
    attendanceController.getMyAttendance
);

/**
 * GET /api/attendance/course/:courseId/summary
 * Get attendance summary for a course with daily breakdown
 * Only faculty and admin can access course attendance summary
 */
router.get('/course/:courseId/summary',
    mongoIdValidation,
    queryValidation,
    canUploadMarksAttendance,
    async (req, res) => {
        try {
            const { courseId } = req.params;
            const { academicYear, semester, startDate, endDate } = req.query;
            
            const Course = require('../models/Course');
            const Attendance = require('../models/Attendance');

            // Verify course exists and check permissions
            const course = await Course.findById(courseId);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            // Check if faculty can access this course
            const userRole = req.user.role;
            const userId = req.user.userId;

            if (userRole === 'faculty' && course.instructor.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only view attendance for courses you teach.'
                });
            }

            // Get course statistics
            const statistics = await Attendance.getCourseAttendanceStatistics(courseId, {
                academicYear,
                semester,
                startDate,
                endDate
            });

            res.json({
                success: true,
                data: {
                    course: {
                        id: course._id,
                        title: course.title,
                        code: course.code,
                        credits: course.credits
                    },
                    summary: statistics
                }
            });

        } catch (error) {
            console.error('Get attendance summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching attendance summary'
            });
        }
    }
);

/**
 * GET /api/attendance/course/:courseId/defaulters
 * Get list of students with poor attendance (below threshold)
 * Only faculty and admin can access this endpoint
 */
router.get('/course/:courseId/defaulters',
    mongoIdValidation,
    canUploadMarksAttendance,
    [
        query('threshold')
            .optional()
            .isFloat({ min: 0, max: 100 })
            .withMessage('Threshold must be between 0 and 100'),
        ...queryValidation
    ],
    async (req, res) => {
        try {
            const { courseId } = req.params;
            const { 
                threshold = 75, 
                academicYear, 
                semester, 
                startDate, 
                endDate 
            } = req.query;
            
            const Course = require('../models/Course');
            const Attendance = require('../models/Attendance');

            // Verify course exists and check permissions
            const course = await Course.findById(courseId)
                .populate('enrolledStudents.student', 'firstName lastName rollNumber phone email');

            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            // Check if faculty can access this course
            const userRole = req.user.role;
            const userId = req.user.userId;

            if (userRole === 'faculty' && course.instructor.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only view attendance for courses you teach.'
                });
            }

            const activeStudents = course.enrolledStudents.filter(e => e.status === 'active');
            const defaulters = [];

            // Calculate attendance percentage for each student
            for (const enrollment of activeStudents) {
                const studentId = enrollment.student._id;
                const attendanceStats = await Attendance.calculateAttendancePercentage(studentId, courseId, {
                    academicYear,
                    semester,
                    startDate,
                    endDate
                });

                if (attendanceStats.percentage < threshold) {
                    defaulters.push({
                        studentId,
                        studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
                        rollNumber: enrollment.student.rollNumber,
                        phone: enrollment.student.phone,
                        email: enrollment.student.email,
                        attendanceStats
                    });
                }
            }

            // Sort by attendance percentage (lowest first)
            defaulters.sort((a, b) => a.attendanceStats.percentage - b.attendanceStats.percentage);

            res.json({
                success: true,
                data: {
                    course: {
                        id: course._id,
                        title: course.title,
                        code: course.code
                    },
                    threshold: parseFloat(threshold),
                    totalStudents: activeStudents.length,
                    defaultersCount: defaulters.length,
                    defaulters
                }
            });

        } catch (error) {
            console.error('Get attendance defaulters error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching attendance defaulters'
            });
        }
    }
);

module.exports = router;