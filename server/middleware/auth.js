const jwt = require('jsonwebtoken');

/**
 * Authentication middleware for all users
 * Verifies JWT token and adds user info to request
 */
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No valid token provided.'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
        const decoded = jwt.verify(token, jwtSecret);

        // Add user info to request
        req.user = decoded;
        next();

    } catch (error) {
        console.error('Auth middleware error:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
};

/**
 * Student role middleware
 * Ensures user is a student
 */
const studentAuth = async (req, res, next) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Student privileges required.'
        });
    }
    next();
};

/**
 * Teacher role middleware
 * Ensures user is a teacher or faculty
 */
const teacherAuth = async (req, res, next) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'faculty') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Teacher privileges required.'
        });
    }
    next();
};

module.exports = {
    auth,
    studentAuth,
    teacherAuth
};