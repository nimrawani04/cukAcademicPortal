const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Admin Authentication Middleware
 * Verifies JWT token and checks for admin role
 */
const adminAuth = async (req, res, next) => {
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

        // Check if user exists and has admin role
        if (decoded.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Add user info to request (ensure compatibility)
        req.user = {
            userId: decoded.userId || decoded.id,
            id: decoded.userId || decoded.id,
            email: decoded.email,
            role: decoded.role
        };
        next();

    } catch (error) {
        console.error('Admin auth error:', error.message);
        
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

module.exports = adminAuth;