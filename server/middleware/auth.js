// Authentication Middleware - Verifies JWT tokens and protects routes
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user information to request object
 * 
 * Usage: Add this middleware to any route that requires authentication
 * Example: router.get('/protected', authMiddleware, controller.method);
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
                code: 'NO_TOKEN'
            });
        }

        // Check if token starts with 'Bearer '
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Invalid token format. Use: Bearer <token>',
                code: 'INVALID_TOKEN_FORMAT'
            });
        }

        // Extract token (remove 'Bearer ' prefix)
        const token = authHeader.substring(7);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
                code: 'NO_TOKEN'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database (excluding password)
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. User not found.',
                code: 'USER_NOT_FOUND'
            });
        }

        // Check if user account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Account is deactivated.',
                code: 'ACCOUNT_DEACTIVATED'
            });
        }

        // Check if account is locked
        if (user.isLocked()) {
            return res.status(423).json({
                success: false,
                message: 'Access denied. Account is temporarily locked.',
                code: 'ACCOUNT_LOCKED'
            });
        }

        // Attach user information to request object
        req.user = {
            userId: user._id,
            email: user.email,
            role: user.role,
            userType: user.userType || user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            isEmailVerified: user.isEmailVerified
        };

        // Continue to next middleware or route handler
        next();

    } catch (error) {
        console.error('Auth middleware error:', error);

        // Handle specific JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Invalid token.',
                code: 'INVALID_TOKEN'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Token has expired.',
                code: 'TOKEN_EXPIRED'
            });
        }

        if (error.name === 'NotBeforeError') {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Token not active yet.',
                code: 'TOKEN_NOT_ACTIVE'
            });
        }

        // Generic server error
        res.status(500).json({
            success: false,
            message: 'Server error during authentication.',
            code: 'AUTH_SERVER_ERROR'
        });
    }
};

/**
 * Optional authentication middleware
 * Similar to authMiddleware but doesn't fail if no token is provided
 * Useful for routes that work differently for authenticated vs anonymous users
 */
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        // If no token provided, continue without user info
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.substring(7);
        
        if (!token) {
            req.user = null;
            return next();
        }

        // Try to verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive && !user.isLocked()) {
            req.user = {
                userId: user._id,
                email: user.email,
                role: user.role,
                userType: user.userType || user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                isEmailVerified: user.isEmailVerified
            };
        } else {
            req.user = null;
        }

        next();

    } catch (error) {
        // If token is invalid, continue without user info
        req.user = null;
        next();
    }
};

/**
 * Email verification middleware
 * Checks if user's email is verified
 */
const requireEmailVerification = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.',
            code: 'AUTH_REQUIRED'
        });
    }

    if (!req.user.isEmailVerified) {
        return res.status(403).json({
            success: false,
            message: 'Email verification required. Please verify your email address.',
            code: 'EMAIL_NOT_VERIFIED'
        });
    }

    next();
};

/**
 * Rate limiting middleware for authentication endpoints
 * Prevents brute force attacks
 */
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    const attempts = new Map();

    return (req, res, next) => {
        const key = req.ip + ':' + (req.body.email || 'unknown');
        const now = Date.now();
        
        // Clean old entries
        for (const [k, v] of attempts.entries()) {
            if (now - v.firstAttempt > windowMs) {
                attempts.delete(k);
            }
        }

        const userAttempts = attempts.get(key);
        
        if (!userAttempts) {
            attempts.set(key, { count: 1, firstAttempt: now });
            return next();
        }

        if (userAttempts.count >= maxAttempts) {
            const timeLeft = Math.ceil((windowMs - (now - userAttempts.firstAttempt)) / 1000 / 60);
            return res.status(429).json({
                success: false,
                message: `Too many authentication attempts. Please try again in ${timeLeft} minutes.`,
                code: 'RATE_LIMITED',
                retryAfter: timeLeft * 60
            });
        }

        userAttempts.count++;
        next();
    };
};

/**
 * Middleware to extract user info from refresh token
 */
const refreshTokenMiddleware = async (req, res, next) => {
    try {
        const { refreshToken: tokenFromBody } = req.body;
        const tokenFromCookie = req.cookies.refreshToken;
        
        const refreshToken = tokenFromBody || tokenFromCookie;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token not provided',
                code: 'NO_REFRESH_TOKEN'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(
            refreshToken, 
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        );

        if (decoded.tokenType !== 'refresh') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token type',
                code: 'INVALID_TOKEN_TYPE'
            });
        }

        // Find user
        const user = await User.findById(decoded.userId).select('-password');
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive',
                code: 'USER_NOT_FOUND'
            });
        }

        req.user = {
            userId: user._id,
            email: user.email,
            role: user.role,
            userType: user.userType || user.role
        };

        next();

    } catch (error) {
        console.error('Refresh token middleware error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token',
                code: 'INVALID_REFRESH_TOKEN'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during token refresh',
            code: 'REFRESH_SERVER_ERROR'
        });
    }
};

module.exports = authMiddleware;
module.exports.optionalAuth = optionalAuthMiddleware;
module.exports.requireEmailVerification = requireEmailVerification;
module.exports.authRateLimit = authRateLimit;
module.exports.refreshTokenMiddleware = refreshTokenMiddleware;