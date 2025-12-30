// Admin Routes - API endpoints for administrative operations
const express = require('express');
const { body, param, query } = require('express-validator');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const { canApproveRegistrations, adminOnly } = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * Validation rules for registration approval
 */
const approvalValidation = [
    body('comments')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Comments cannot exceed 500 characters')
];

/**
 * Validation rules for registration rejection
 */
const rejectionValidation = [
    body('reason')
        .notEmpty()
        .withMessage('Rejection reason is required')
        .isLength({ min: 10, max: 500 })
        .withMessage('Rejection reason must be between 10 and 500 characters')
];

/**
 * Validation rules for bulk approval
 */
const bulkApprovalValidation = [
    body('userIds')
        .isArray({ min: 1 })
        .withMessage('User IDs array is required and must contain at least one ID'),
    
    body('userIds.*')
        .isMongoId()
        .withMessage('Each user ID must be a valid MongoDB ObjectId'),
    
    body('comments')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Comments cannot exceed 500 characters')
];

/**
 * Validation for MongoDB ObjectId parameters
 */
const mongoIdValidation = [
    param('userId')
        .isMongoId()
        .withMessage('Invalid user ID format')
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
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    query('role')
        .optional()
        .isIn(['student', 'faculty', 'admin'])
        .withMessage('Role filter must be valid'),
    
    query('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive filter must be a boolean'),
    
    query('search')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Search query must be between 2 and 100 characters'),
    
    query('sortBy')
        .optional()
        .isIn(['createdAt', 'firstName', 'lastName', 'email', 'role'])
        .withMessage('Sort field must be valid'),
    
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc')
];

/**
 * Validation for user deactivation
 */
const deactivationValidation = [
    body('reason')
        .notEmpty()
        .withMessage('Deactivation reason is required')
        .isLength({ min: 10, max: 500 })
        .withMessage('Deactivation reason must be between 10 and 500 characters')
];

// All routes require authentication and admin role
router.use(authMiddleware);

// Registration Management Routes

/**
 * GET /api/admin/registrations/pending
 * Get pending user registrations for approval
 * Only admin can view pending registrations
 */
router.get('/registrations/pending',
    canApproveRegistrations,
    queryValidation,
    adminController.getPendingRegistrations
);

/**
 * POST /api/admin/registrations/:userId/approve
 * Approve a user registration
 * Only admin can approve registrations
 */
router.post('/registrations/:userId/approve',
    canApproveRegistrations,
    mongoIdValidation,
    approvalValidation,
    adminController.approveRegistration
);

/**
 * POST /api/admin/registrations/:userId/reject
 * Reject a user registration
 * Only admin can reject registrations
 */
router.post('/registrations/:userId/reject',
    canApproveRegistrations,
    mongoIdValidation,
    rejectionValidation,
    adminController.rejectRegistration
);

/**
 * POST /api/admin/registrations/bulk-approve
 * Bulk approve multiple registrations
 * Only admin can bulk approve registrations
 */
router.post('/registrations/bulk-approve',
    canApproveRegistrations,
    bulkApprovalValidation,
    adminController.bulkApproveRegistrations
);

// User Management Routes

/**
 * GET /api/admin/users
 * Get all users with filtering and pagination
 * Only admin can view all users
 */
router.get('/users',
    adminOnly,
    queryValidation,
    adminController.getAllUsers
);

/**
 * POST /api/admin/users/:userId/deactivate
 * Deactivate a user account
 * Only admin can deactivate users
 */
router.post('/users/:userId/deactivate',
    adminOnly,
    mongoIdValidation,
    deactivationValidation,
    adminController.deactivateUser
);

/**
 * POST /api/admin/users/:userId/reactivate
 * Reactivate a user account
 * Only admin can reactivate users
 */
router.post('/users/:userId/reactivate',
    adminOnly,
    mongoIdValidation,
    adminController.reactivateUser
);

/**
 * GET /api/admin/users/:userId
 * Get detailed information about a specific user
 * Only admin can view detailed user information
 */
router.get('/users/:userId',
    adminOnly,
    mongoIdValidation,
    async (req, res) => {
        try {
            const { userId } = req.params;

            const User = require('../models/User');
            const Student = require('../models/Student');
            const Faculty = require('../models/Faculty');
            const Admin = require('../models/Admin');

            // Get basic user information
            const user = await User.findById(userId).select('-password');
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Get role-specific information
            let roleSpecificData = {};
            let Model;

            switch (user.role) {
                case 'student':
                    Model = Student;
                    break;
                case 'faculty':
                    Model = Faculty;
                    break;
                case 'admin':
                    Model = Admin;
                    break;
                default:
                    Model = User;
            }

            if (Model !== User) {
                const roleUser = await Model.findById(userId);
                if (roleUser) {
                    roleSpecificData = roleUser.toObject();
                    delete roleSpecificData.password;
                }
            }

            res.json({
                success: true,
                data: {
                    user: {
                        ...user.toObject(),
                        ...roleSpecificData
                    }
                }
            });

        } catch (error) {
            console.error('Get user details error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching user details'
            });
        }
    }
);

/**
 * GET /api/admin/dashboard/statistics
 * Get admin dashboard statistics
 * Only admin can view dashboard statistics
 */
router.get('/dashboard/statistics',
    adminOnly,
    async (req, res) => {
        try {
            const User = require('../models/User');
            const Course = require('../models/Course');
            const { Notice } = require('../controllers/noticeController');

            // Get various statistics
            const [
                totalUsers,
                activeUsers,
                pendingRegistrations,
                usersByRole,
                totalCourses,
                activeCourses,
                totalNotices,
                recentRegistrations
            ] = await Promise.all([
                // Total users
                User.countDocuments(),
                
                // Active users
                User.countDocuments({ isActive: true }),
                
                // Pending registrations
                User.countDocuments({ isActive: false, isEmailVerified: false }),
                
                // Users by role
                User.aggregate([
                    { $group: { _id: '$role', count: { $sum: 1 } } }
                ]),
                
                // Total courses
                Course.countDocuments(),
                
                // Active courses
                Course.countDocuments({ isActive: true }),
                
                // Total notices
                Notice.countDocuments({ isActive: true }),
                
                // Recent registrations (last 7 days)
                User.countDocuments({
                    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                })
            ]);

            // Format user role statistics
            const roleStats = usersByRole.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, { student: 0, faculty: 0, admin: 0 });

            res.json({
                success: true,
                data: {
                    users: {
                        total: totalUsers,
                        active: activeUsers,
                        inactive: totalUsers - activeUsers,
                        pending: pendingRegistrations,
                        byRole: roleStats
                    },
                    courses: {
                        total: totalCourses,
                        active: activeCourses,
                        inactive: totalCourses - activeCourses
                    },
                    notices: {
                        total: totalNotices
                    },
                    recent: {
                        registrations: recentRegistrations
                    }
                }
            });

        } catch (error) {
            console.error('Get admin statistics error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching admin statistics'
            });
        }
    }
);

/**
 * GET /api/admin/system/health
 * Get system health information
 * Only admin can view system health
 */
router.get('/system/health',
    adminOnly,
    async (req, res) => {
        try {
            const mongoose = require('mongoose');
            const { getConnectionInfo } = require('../config/database');

            // Get database connection info
            const dbInfo = getConnectionInfo();

            // Get system information
            const systemInfo = {
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                nodeVersion: process.version,
                platform: process.platform,
                architecture: process.arch,
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                    external: Math.round(process.memoryUsage().external / 1024 / 1024)
                },
                database: {
                    connected: dbInfo.isConnected,
                    status: dbInfo.readyStateText,
                    host: dbInfo.host,
                    name: dbInfo.name
                },
                environment: process.env.NODE_ENV || 'development'
            };

            res.json({
                success: true,
                data: systemInfo
            });

        } catch (error) {
            console.error('Get system health error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching system health'
            });
        }
    }
);

/**
 * POST /api/admin/system/backup
 * Trigger system backup (placeholder)
 * Only admin can trigger backups
 */
router.post('/system/backup',
    adminOnly,
    async (req, res) => {
        try {
            // This is a placeholder for backup functionality
            // In a real implementation, you would trigger your backup process here
            
            const backupId = `backup_${Date.now()}`;
            const timestamp = new Date().toISOString();

            // Log the backup request
            console.log(`🔄 Backup requested by admin ${req.user.userId} at ${timestamp}`);

            res.json({
                success: true,
                message: 'Backup process initiated',
                data: {
                    backupId,
                    timestamp,
                    status: 'initiated',
                    note: 'This is a placeholder. Implement actual backup logic here.'
                }
            });

        } catch (error) {
            console.error('System backup error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while initiating backup'
            });
        }
    }
);

module.exports = router;