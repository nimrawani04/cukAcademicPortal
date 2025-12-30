// Role-based Authorization Middleware - Restricts access based on user roles and permissions
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const { securityLogger } = require('./logger');

/**
 * Role-based authorization middleware
 * Restricts access to routes based on user roles
 * 
 * @param {Array} allowedRoles - Array of roles that can access the route
 * @returns {Function} Express middleware function
 * 
 * Usage: 
 * - Single role: roleMiddleware(['admin'])
 * - Multiple roles: roleMiddleware(['admin', 'faculty'])
 * 
 * Note: This middleware should be used AFTER authMiddleware
 * Example: router.get('/admin-only', authMiddleware, roleMiddleware(['admin']), controller.method);
 */
const roleMiddleware = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // Check if user is authenticated (should be set by authMiddleware)
            if (!req.user || !req.user.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required. Please login first.',
                    code: 'AUTH_REQUIRED'
                });
            }

            // Validate allowedRoles parameter
            if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
                console.error('roleMiddleware: allowedRoles must be a non-empty array');
                return res.status(500).json({
                    success: false,
                    message: 'Server configuration error.',
                    code: 'CONFIG_ERROR'
                });
            }

            // Get user's current role (should be available from authMiddleware)
            const userRole = req.user.role;

            if (!userRole) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. User role not found.',
                    code: 'ROLE_NOT_FOUND'
                });
            }

            // Check if user's role is in the allowed roles
            if (!allowedRoles.includes(userRole)) {
                securityLogger('UNAUTHORIZED_ACCESS_ATTEMPT', req, {
                    userId: req.user.userId,
                    userRole,
                    requiredRoles: allowedRoles,
                    endpoint: req.originalUrl,
                    method: req.method
                });

                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${userRole}`,
                    code: 'INSUFFICIENT_PERMISSIONS'
                });
            }

            // User has required role, continue to next middleware
            next();

        } catch (error) {
            console.error('Role middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during authorization check.',
                code: 'AUTH_SERVER_ERROR'
            });
        }
    };
};

/**
 * Faculty-only middleware for academic operations
 * Allows faculty to upload marks, attendance, notices
 */
const facultyOnly = roleMiddleware(['faculty']);

/**
 * Admin-only middleware for administrative operations
 * Allows admin to approve registrations, manage users
 */
const adminOnly = roleMiddleware(['admin']);

/**
 * Faculty or Admin middleware
 * Allows both faculty and admins to access the route
 */
const facultyOrAdmin = roleMiddleware(['faculty', 'admin']);

/**
 * Student-only middleware
 * Restricts access to students only
 */
const studentOnly = roleMiddleware(['student']);

/**
 * Student data protection middleware
 * Ensures students can only access their own data
 */
const protectStudentData = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
                code: 'AUTH_REQUIRED'
            });
        }

        const userRole = req.user.role;
        const userId = req.user.userId;

        // Admin and faculty can access any student data
        if (['admin', 'faculty'].includes(userRole)) {
            return next();
        }

        // Students can only access their own data
        if (userRole === 'student') {
            // Check if the requested resource belongs to the current student
            const requestedUserId = req.params.userId || req.params.studentId || req.params.id;
            
            if (requestedUserId && requestedUserId !== userId.toString()) {
                securityLogger('STUDENT_DATA_ACCESS_VIOLATION', req, {
                    studentId: userId,
                    requestedUserId,
                    endpoint: req.originalUrl
                });

                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Students can only access their own data.',
                    code: 'DATA_ACCESS_VIOLATION'
                });
            }

            // If no specific user ID in params, ensure student can only see their own data
            req.studentFilter = { _id: userId };
        }

        next();

    } catch (error) {
        console.error('Student data protection error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during data protection check.',
            code: 'PROTECTION_ERROR'
        });
    }
};

/**
 * Course enrollment verification middleware
 * Ensures students can only access data for courses they're enrolled in
 */
const verifyCourseEnrollment = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
                code: 'AUTH_REQUIRED'
            });
        }

        const userRole = req.user.role;
        const userId = req.user.userId;

        // Admin and faculty can access any course data
        if (['admin', 'faculty'].includes(userRole)) {
            return next();
        }

        // For students, verify enrollment
        if (userRole === 'student') {
            const courseId = req.params.courseId || req.body.courseId || req.query.courseId;
            
            if (!courseId) {
                return res.status(400).json({
                    success: false,
                    message: 'Course ID is required.',
                    code: 'COURSE_ID_REQUIRED'
                });
            }

            const Course = require('../models/Course');
            const course = await Course.findById(courseId);
            
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found.',
                    code: 'COURSE_NOT_FOUND'
                });
            }

            // Check if student is enrolled in the course
            const isEnrolled = course.enrolledStudents.some(
                enrollment => enrollment.student.toString() === userId.toString() && 
                             enrollment.status === 'active'
            );

            if (!isEnrolled) {
                securityLogger('COURSE_ACCESS_VIOLATION', req, {
                    studentId: userId,
                    courseId,
                    endpoint: req.originalUrl
                });

                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You must be enrolled in this course.',
                    code: 'COURSE_ACCESS_DENIED'
                });
            }
        }

        next();

    } catch (error) {
        console.error('Course enrollment verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during course enrollment verification.',
            code: 'ENROLLMENT_CHECK_ERROR'
        });
    }
};

/**
 * Faculty course ownership verification middleware
 * Ensures faculty can only modify courses they teach
 */
const verifyFacultyCourseOwnership = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
                code: 'AUTH_REQUIRED'
            });
        }

        const userRole = req.user.role;
        const userId = req.user.userId;

        // Admin can access any course
        if (userRole === 'admin') {
            return next();
        }

        // For faculty, verify course ownership
        if (userRole === 'faculty') {
            const courseId = req.params.courseId || req.body.courseId || req.query.courseId;
            
            if (!courseId) {
                return res.status(400).json({
                    success: false,
                    message: 'Course ID is required.',
                    code: 'COURSE_ID_REQUIRED'
                });
            }

            const Course = require('../models/Course');
            const course = await Course.findById(courseId);
            
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found.',
                    code: 'COURSE_NOT_FOUND'
                });
            }

            // Check if faculty is the instructor of this course
            if (course.instructor.toString() !== userId.toString()) {
                securityLogger('FACULTY_COURSE_ACCESS_VIOLATION', req, {
                    facultyId: userId,
                    courseId,
                    actualInstructor: course.instructor,
                    endpoint: req.originalUrl
                });

                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only modify courses you teach.',
                    code: 'COURSE_OWNERSHIP_DENIED'
                });
            }
        } else {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only faculty and admin can access this resource.',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();

    } catch (error) {
        console.error('Faculty course ownership verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during course ownership verification.',
            code: 'OWNERSHIP_CHECK_ERROR'
        });
    }
};

/**
 * Registration approval middleware
 * Only admin can approve user registrations
 */
const canApproveRegistrations = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
                code: 'AUTH_REQUIRED'
            });
        }

        if (req.user.role !== 'admin') {
            securityLogger('REGISTRATION_APPROVAL_ACCESS_DENIED', req, {
                userId: req.user.userId,
                userRole: req.user.role,
                endpoint: req.originalUrl
            });

            return res.status(403).json({
                success: false,
                message: 'Access denied. Only administrators can approve registrations.',
                code: 'ADMIN_REQUIRED'
            });
        }

        next();

    } catch (error) {
        console.error('Registration approval middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration approval check.',
            code: 'APPROVAL_CHECK_ERROR'
        });
    }
};

/**
 * Marks and attendance upload middleware
 * Only faculty can upload marks and attendance for their courses
 */
const canUploadMarksAttendance = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
                code: 'AUTH_REQUIRED'
            });
        }

        const userRole = req.user.role;

        // Admin can upload marks/attendance for any course
        if (userRole === 'admin') {
            return next();
        }

        // Only faculty can upload marks/attendance
        if (userRole !== 'faculty') {
            securityLogger('MARKS_ATTENDANCE_UPLOAD_ACCESS_DENIED', req, {
                userId: req.user.userId,
                userRole: req.user.role,
                endpoint: req.originalUrl
            });

            return res.status(403).json({
                success: false,
                message: 'Access denied. Only faculty can upload marks and attendance.',
                code: 'FACULTY_REQUIRED'
            });
        }

        // For faculty, verify they teach the course (if courseId is provided)
        const courseId = req.params.courseId || req.body.courseId || req.query.courseId;
        
        if (courseId) {
            const Course = require('../models/Course');
            const course = await Course.findById(courseId);
            
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found.',
                    code: 'COURSE_NOT_FOUND'
                });
            }

            if (course.instructor.toString() !== req.user.userId.toString()) {
                securityLogger('MARKS_ATTENDANCE_COURSE_ACCESS_DENIED', req, {
                    facultyId: req.user.userId,
                    courseId,
                    actualInstructor: course.instructor,
                    endpoint: req.originalUrl
                });

                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only upload marks/attendance for courses you teach.',
                    code: 'COURSE_INSTRUCTOR_REQUIRED'
                });
            }
        }

        next();

    } catch (error) {
        console.error('Marks/attendance upload middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during marks/attendance upload check.',
            code: 'UPLOAD_CHECK_ERROR'
        });
    }
};

/**
 * Notice upload middleware
 * Only faculty and admin can upload notices
 */
const canUploadNotices = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
                code: 'AUTH_REQUIRED'
            });
        }

        const userRole = req.user.role;

        // Only faculty and admin can upload notices
        if (!['faculty', 'admin'].includes(userRole)) {
            securityLogger('NOTICE_UPLOAD_ACCESS_DENIED', req, {
                userId: req.user.userId,
                userRole: req.user.role,
                endpoint: req.originalUrl
            });

            return res.status(403).json({
                success: false,
                message: 'Access denied. Only faculty and administrators can upload notices.',
                code: 'FACULTY_OR_ADMIN_REQUIRED'
            });
        }

        next();

    } catch (error) {
        console.error('Notice upload middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during notice upload check.',
            code: 'NOTICE_CHECK_ERROR'
        });
    }
};

/**
 * Resource ownership middleware
 * Checks if the user owns the resource or has admin privileges
 * 
 * @param {String} resourceIdParam - Name of the route parameter containing resource ID
 * @param {String} resourceModel - Name of the Mongoose model
 * @param {String} ownerField - Field name in the model that contains the owner's ID
 * 
 * Usage: resourceOwnership('id', 'Assignment', 'createdBy')
 */
const resourceOwnership = (resourceIdParam, resourceModel, ownerField) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required.',
                    code: 'AUTH_REQUIRED'
                });
            }

            // Admin users can access any resource
            if (req.user.role === 'admin') {
                return next();
            }

            const resourceId = req.params[resourceIdParam];
            
            if (!resourceId) {
                return res.status(400).json({
                    success: false,
                    message: `Resource ID parameter '${resourceIdParam}' is required.`,
                    code: 'RESOURCE_ID_REQUIRED'
                });
            }

            // Dynamically require the model
            const Model = require(`../models/${resourceModel}`);
            
            // Find the resource
            const resource = await Model.findById(resourceId);
            
            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: `${resourceModel} not found.`,
                    code: 'RESOURCE_NOT_FOUND'
                });
            }

            // Check ownership
            const ownerId = resource[ownerField];
            
            if (!ownerId || ownerId.toString() !== req.user.userId.toString()) {
                securityLogger('RESOURCE_OWNERSHIP_VIOLATION', req, {
                    userId: req.user.userId,
                    resourceId,
                    resourceModel,
                    ownerId,
                    endpoint: req.originalUrl
                });

                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only access your own resources.',
                    code: 'OWNERSHIP_REQUIRED'
                });
            }

            // User owns the resource, continue
            next();

        } catch (error) {
            console.error('Resource ownership middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during ownership check.',
                code: 'OWNERSHIP_CHECK_ERROR'
            });
        }
    };
};

/**
 * Permission-based middleware
 * Checks specific permissions for admin users
 */
const requirePermission = (module, action) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required.',
                    code: 'AUTH_REQUIRED'
                });
            }

            // Non-admin users don't have granular permissions
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.',
                    code: 'ADMIN_REQUIRED'
                });
            }

            // Get full admin user data to check permissions
            const admin = await Admin.findById(req.user.userId);
            
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin user not found.',
                    code: 'ADMIN_NOT_FOUND'
                });
            }

            // Check if admin has the required permission
            if (!admin.hasPermission(module, action)) {
                securityLogger('PERMISSION_DENIED', req, {
                    adminId: req.user.userId,
                    requiredModule: module,
                    requiredAction: action,
                    endpoint: req.originalUrl
                });

                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required permission: ${action} on ${module}`,
                    code: 'PERMISSION_DENIED'
                });
            }

            next();

        } catch (error) {
            console.error('Permission middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during permission check.',
                code: 'PERMISSION_CHECK_ERROR'
            });
        }
    };
};

module.exports = roleMiddleware;
module.exports.facultyOnly = facultyOnly;
module.exports.adminOnly = adminOnly;
module.exports.facultyOrAdmin = facultyOrAdmin;
module.exports.studentOnly = studentOnly;
module.exports.protectStudentData = protectStudentData;
module.exports.verifyCourseEnrollment = verifyCourseEnrollment;
module.exports.verifyFacultyCourseOwnership = verifyFacultyCourseOwnership;
module.exports.canApproveRegistrations = canApproveRegistrations;
module.exports.canUploadMarksAttendance = canUploadMarksAttendance;
module.exports.canUploadNotices = canUploadNotices;
module.exports.resourceOwnership = resourceOwnership;
module.exports.requirePermission = requirePermission;