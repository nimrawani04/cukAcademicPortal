const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const {
    adminLogin,
    getDashboardStats,
    getAllStudents,
    getAllTeachers,
    createTeacher,
    deleteUser,
    approveStudent
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
 * GET /api/admin/students
 * Get all students (admin auth required)
 */
router.get('/students', adminAuth, getAllStudents);

/**
 * GET /api/admin/teachers
 * Get all teachers (admin auth required)
 */
router.get('/teachers', adminAuth, getAllTeachers);

/**
 * POST /api/admin/create-teacher
 * Create a new teacher account (admin auth required)
 */
router.post('/create-teacher', adminAuth, createTeacher);

/**
 * DELETE /api/admin/user/:id
 * Delete a user (student or teacher) (admin auth required)
 */
router.delete('/user/:id', adminAuth, deleteUser);

/**
 * PATCH /api/admin/approve-student/:id
 * Approve a student registration (admin auth required)
 */
router.patch('/approve-student/:id', adminAuth, approveStudent);

module.exports = router;