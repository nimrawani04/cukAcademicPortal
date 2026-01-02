const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const {
    adminLogin,
    getDashboardStats,
    getPendingRegistrations,
    updateUserStatus,
    getAllUsers,
    deleteUser,
    createUser,
    getAllLeaves,
    reviewLeave,
    getAllFaculty,
    updateFacultyProfile,
    getAllStudents,
    updateStudentProfile,
    getAllAttendance,
    getAllMarks,
    getAllNotices,
    deleteNotice,
    getAllResources,
    deleteResource
} = require('../controllers/adminController');

const router = express.Router();

/**
 * POST /api/admin/login
 * Admin login (no auth required)
 */
router.post('/login', adminLogin);

/**
 * GET /api/admin/stats
 * Get dashboard statistics (admin auth required)
 */
router.get('/stats', adminAuth, getDashboardStats);

/**
 * GET /api/admin/pending-registrations
 * Get pending user registrations (admin auth required)
 */
router.get('/pending-registrations', adminAuth, getPendingRegistrations);

/**
 * PATCH /api/admin/user/:id/status
 * Approve/Reject user registration (admin auth required)
 */
router.patch('/user/:id/status', adminAuth, updateUserStatus);

/**
 * GET /api/admin/users
 * Get all users with filtering (admin auth required)
 */
router.get('/users', adminAuth, getAllUsers);

/**
 * DELETE /api/admin/user/:id
 * Delete a user (admin auth required)
 */
router.delete('/user/:id', adminAuth, deleteUser);

/**
 * POST /api/admin/create-user
 * Create user manually (admin auth required)
 */
router.post('/create-user', adminAuth, createUser);

/**
 * GET /api/admin/leaves
 * Get all leave applications (admin auth required)
 */
router.get('/leaves', adminAuth, getAllLeaves);

/**
 * PATCH /api/admin/leave/:id/review
 * Review leave application (admin auth required)
 */
router.patch('/leave/:id/review', adminAuth, reviewLeave);

/**
 * GET /api/admin/faculty
 * Get all faculty with profiles (admin auth required)
 */
router.get('/faculty', adminAuth, getAllFaculty);

/**
 * PATCH /api/admin/faculty/:id
 * Update faculty profile (admin auth required)
 */
router.patch('/faculty/:id', adminAuth, updateFacultyProfile);

/**
 * GET /api/admin/students
 * Get all students with profiles (admin auth required)
 */
router.get('/students', adminAuth, getAllStudents);

/**
 * PATCH /api/admin/student/:id
 * Update student profile (admin auth required)
 */
router.patch('/student/:id', adminAuth, updateStudentProfile);

/**
 * GET /api/admin/attendance
 * Get all attendance records (admin auth required)
 */
router.get('/attendance', adminAuth, getAllAttendance);

/**
 * GET /api/admin/marks
 * Get all marks records (admin auth required)
 */
router.get('/marks', adminAuth, getAllMarks);

/**
 * GET /api/admin/notices
 * Get all notices (admin auth required)
 */
router.get('/notices', adminAuth, getAllNotices);

/**
 * DELETE /api/admin/notice/:id
 * Delete notice (admin auth required)
 */
router.delete('/notice/:id', adminAuth, deleteNotice);

/**
 * GET /api/admin/resources
 * Get all resources (admin auth required)
 */
router.get('/resources', adminAuth, getAllResources);

/**
 * DELETE /api/admin/resource/:id
 * Delete resource (admin auth required)
 */
router.delete('/resource/:id', adminAuth, deleteResource);

module.exports = router;