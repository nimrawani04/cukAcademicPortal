const express = require('express');
const { auth, studentAuth } = require('../middleware/auth');
const {
    getStudentProfile,
    getStudentAttendance,
    getStudentMarks,
    getStudentDashboard
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

module.exports = router;