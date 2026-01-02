const express = require('express');
const { auth, teacherAuth } = require('../middleware/auth');
const {
    getTeacherProfile,
    getAllStudents,
    updateAttendance,
    updateMarks,
    getLeaveApplications,
    reviewLeaveApplication,
    createNotice,
    getTeacherNotices,
    uploadResource,
    getTeacherResources,
    deleteResource,
    getStudentAttendance,
    getStudentMarks
} = require('../controllers/teacherController');

const router = express.Router();

// All teacher routes require authentication and teacher role
router.use(auth);
router.use(teacherAuth);

/**
 * GET /api/teacher/profile
 * Get teacher profile and assigned students
 */
router.get('/profile', getTeacherProfile);

/**
 * GET /api/teacher/students
 * Get all students for teacher view
 */
router.get('/students', getAllStudents);

/**
 * POST /api/teacher/attendance
 * Update student attendance
 */
router.post('/attendance', updateAttendance);

/**
 * POST /api/teacher/marks
 * Add/Update student marks
 */
router.post('/marks', updateMarks);

/**
 * GET /api/teacher/leaves
 * Get leave applications for review
 */
router.get('/leaves', getLeaveApplications);

/**
 * PATCH /api/teacher/leave/:id/review
 * Approve/Reject leave application
 */
router.patch('/leave/:id/review', reviewLeaveApplication);

/**
 * POST /api/teacher/notice
 * Create a new notice
 */
router.post('/notice', createNotice);

/**
 * GET /api/teacher/notices
 * Get teacher's notices
 */
router.get('/notices', getTeacherNotices);

/**
 * POST /api/teacher/resource
 * Upload a new resource
 */
router.post('/resource', uploadResource);

/**
 * GET /api/teacher/resources
 * Get teacher's uploaded resources
 */
router.get('/resources', getTeacherResources);

/**
 * DELETE /api/teacher/resource/:id
 * Delete a resource
 */
router.delete('/resource/:id', deleteResource);

/**
 * GET /api/teacher/attendance/:studentId
 * Get attendance records for a specific student
 */
router.get('/attendance/:studentId', getStudentAttendance);

/**
 * GET /api/teacher/marks/:studentId
 * Get marks records for a specific student
 */
router.get('/marks/:studentId', getStudentMarks);

module.exports = router;