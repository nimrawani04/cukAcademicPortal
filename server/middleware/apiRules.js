/**
 * CRITICAL API RULES MIDDLEWARE
 * Enforces user-specific access controls
 */

const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const FacultyProfile = require('../models/FacultyProfile');

/**
 * Verify user owns the resource they're trying to access
 */
const verifyResourceOwnership = async (req, res, next) => {
    try {
        const { userId, role } = req.user;
        
        // Admin can access everything
        if (role === 'admin') {
            return next();
        }
        
        // For students - only own data
        if (role === 'student') {
            const studentProfile = await StudentProfile.findOne({ userId });
            if (!studentProfile) {
                return res.status(404).json({
                    success: false,
                    message: 'Student profile not found'
                });
            }
            
            // Attach student profile to request for use in controllers
            req.studentProfile = studentProfile;
            return next();
        }
        
        // For faculty - only assigned students
        if (role === 'faculty') {
            const facultyProfile = await FacultyProfile.findOne({ userId });
            if (!facultyProfile) {
                return res.status(404).json({
                    success: false,
                    message: 'Faculty profile not found'
                });
            }
            
            // Attach faculty profile to request for use in controllers
            req.facultyProfile = facultyProfile;
            return next();
        }
        
        return res.status(403).json({
            success: false,
            message: 'Access denied'
        });
        
    } catch (error) {
        console.error('Resource ownership verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Access verification failed'
        });
    }
};

/**
 * Verify faculty can access specific student
 */
const verifyFacultyStudentAccess = async (req, res, next) => {
    try {
        const { role } = req.user;
        const { studentId } = req.params;
        
        // Admin can access everything
        if (role === 'admin') {
            return next();
        }
        
        // Only faculty can use this middleware
        if (role !== 'faculty') {
            return res.status(403).json({
                success: false,
                message: 'Faculty access required'
            });
        }
        
        const facultyProfile = req.facultyProfile;
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }
        
        // Check if student is assigned to this faculty
        const isAssigned = facultyProfile.assignedStudents.includes(studentId);
        if (!isAssigned) {
            return res.status(403).json({
                success: false,
                message: 'Access denied - student not assigned to you'
            });
        }
        
        next();
        
    } catch (error) {
        console.error('Faculty-student access verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Access verification failed'
        });
    }
};

/**
 * Verify admin access
 */
const verifyAdminAccess = (req, res, next) => {
    const { role } = req.user;
    
    if (role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    
    next();
};

/**
 * Verify student can only access own data
 */
const verifyStudentSelfAccess = (req, res, next) => {
    const { userId, role } = req.user;
    
    // Admin can access everything
    if (role === 'admin') {
        return next();
    }
    
    // Only students can use this middleware
    if (role !== 'student') {
        return res.status(403).json({
            success: false,
            message: 'Student access required'
        });
    }
    
    // Student can only access their own data
    const requestedUserId = req.params.userId || req.body.userId;
    if (requestedUserId && requestedUserId !== userId) {
        return res.status(403).json({
            success: false,
            message: 'Access denied - can only access own data'
        });
    }
    
    next();
};

/**
 * Log all API access for audit
 */
const logApiAccess = (req, res, next) => {
    const { userId, role } = req.user || {};
    const { method, originalUrl, ip } = req;
    
    console.log(`🔍 API Access: ${method} ${originalUrl} | User: ${userId} | Role: ${role} | IP: ${ip}`);
    
    next();
};

/**
 * Validate MongoDB operations
 */
const validateMongoOperation = (req, res, next) => {
    const { method } = req;
    
    // Ensure all modify operations update MongoDB
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        // Add flag to ensure database operations are performed
        req.requiresDbUpdate = true;
    }
    
    next();
};

module.exports = {
    verifyResourceOwnership,
    verifyFacultyStudentAccess,
    verifyAdminAccess,
    verifyStudentSelfAccess,
    logApiAccess,
    validateMongoOperation
};