const express = require('express');
const { auth, studentAuth } = require('../middleware/auth');
const {
    getStudentProfile,
    getStudentAttendance,
    getStudentMarks,
    getStudentDashboard,
    getStudentLeaves,
    applyLeave,
    getStudentNotices,
    getStudentResources,
    downloadResource
} = require('../controllers/studentController');

const router = express.Router();

// All student routes require authentication and student role
router.use(auth);
router.use(studentAuth);

/**
 * GET /api/student/profile
 * Get logged-in student's profile
 */
router.get('/profile', getStudentProfile);

/**
 * GET /api/student/attendance
 * Get logged-in student's attendance records
 */
router.get('/attendance', getStudentAttendance);

/**
 * GET /api/student/marks
 * Get logged-in student's marks/grades
 */
router.get('/marks', getStudentMarks);

/**
 * GET /api/student/dashboard
 * Get logged-in student's dashboard summary
 */
router.get('/dashboard', getStudentDashboard);

/**
 * GET /api/student/leaves
 * Get logged-in student's leave applications
 */
router.get('/leaves', getStudentLeaves);

/**
 * POST /api/student/leave
 * Apply for leave
 */
router.post('/leave', applyLeave);

/**
 * GET /api/student/notices
 * Get notices for logged-in student
 */
router.get('/notices', getStudentNotices);

/**
 * GET /api/student/resources
 * Get resources for logged-in student
 */
router.get('/resources', getStudentResources);

/**
 * GET /api/student/resource/:id/download
 * Download a specific resource
 */
router.get('/resource/:id/download', downloadResource);

module.exports = router;