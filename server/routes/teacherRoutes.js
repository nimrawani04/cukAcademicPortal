const express = require('express');
const { auth, teacherAuth } = require('../middleware/auth');
const {
    getAllStudents,
    updateAttendance,
    getStudentAttendance,
    getStudentMarks,
    updateMarks,
    getSubjectMarks
} = require('../controllers/teacherController');

const router = express.Router();

// All teacher routes require authentication and teacher role
router.use(auth);
router.use(teacherAuth);

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
 * GET /api/teacher/attendance/:studentId
 * Get specific student's attendance
 */
router.get('/attendance/:studentId', getStudentAttendance);

/**
 * GET /api/teacher/marks/:studentId/:subject
 * Get specific student's marks for a subject
 */
router.get('/marks/:studentId/:subject', getStudentMarks);

/**
 * POST /api/teacher/marks
 * Update student marks
 */
router.post('/marks', updateMarks);

/**
 * GET /api/teacher/marks/subject/:subject
 * Get all students' marks for a specific subject
 */
router.get('/marks/subject/:subject', getSubjectMarks);

module.exports = router;