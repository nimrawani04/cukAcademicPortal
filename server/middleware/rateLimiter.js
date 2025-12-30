// Rate Limiting Middleware - Prevents abuse and brute force attacks
const rateLimit = require('express-rate-limit');
const { securityLogger } = require('./logger');

/**
 * General API rate limiter
 * Applies to all API endpoints
 */
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMITED'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        securityLogger('RATE_LIMIT_EXCEEDED', req, {
            ip: req.ip,
            endpoint: req.originalUrl,
            method: req.method
        });
        
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again later.',
            code: 'RATE_LIMITED',
            retryAfter: Math.round(req.rateLimit.resetTime / 1000)
        });
    }
});

/**
 * Strict rate limiter for authentication endpoints
 * More restrictive to prevent brute force attacks
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.',
        code: 'AUTH_RATE_LIMITED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    handler: (req, res) => {
        securityLogger('AUTH_RATE_LIMIT_EXCEEDED', req, {
            ip: req.ip,
            endpoint: req.originalUrl,
            method: req.method,
            email: req.body.email || 'unknown'
        });
        
        res.status(429).json({
            success: false,
            message: 'Too many authentication attempts from this IP. Please try again in 15 minutes.',
            code: 'AUTH_RATE_LIMITED',
            retryAfter: Math.round(req.rateLimit.resetTime / 1000)
        });
    }
});

/**
 * Registration rate limiter
 * Prevents spam registrations
 */
const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 registration attempts per hour
    message: {
        success: false,
        message: 'Too many registration attempts, please try again later.',
        code: 'REGISTRATION_RATE_LIMITED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        securityLogger('REGISTRATION_RATE_LIMIT_EXCEEDED', req, {
            ip: req.ip,
            email: req.body.email || 'unknown'
        });
        
        res.status(429).json({
            success: false,
            message: 'Too many registration attempts from this IP. Please try again in 1 hour.',
            code: 'REGISTRATION_RATE_LIMITED',
            retryAfter: Math.round(req.rateLimit.resetTime / 1000)
        });
    }
});

/**
 * Password reset rate limiter
 * Prevents abuse of password reset functionality
 */
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset attempts per hour
    message: {
        success: false,
        message: 'Too many password reset attempts, please try again later.',
        code: 'PASSWORD_RESET_RATE_LIMITED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        securityLogger('PASSWORD_RESET_RATE_LIMIT_EXCEEDED', req, {
            ip: req.ip,
            email: req.body.email || 'unknown'
        });
        
        res.status(429).json({
            success: false,
            message: 'Too many password reset attempts from this IP. Please try again in 1 hour.',
            code: 'PASSWORD_RESET_RATE_LIMITED',
            retryAfter: Math.round(req.rateLimit.resetTime / 1000)
        });
    }
});

/**
 * File upload rate limiter
 * Prevents abuse of file upload endpoints
 */
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 uploads per 15 minutes
    message: {
        success: false,
        message: 'Too many file uploads, please try again later.',
        code: 'UPLOAD_RATE_LIMITED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        securityLogger('UPLOAD_RATE_LIMIT_EXCEEDED', req, {
            ip: req.ip,
            endpoint: req.originalUrl
        });
        
        res.status(429).json({
            success: false,
            message: 'Too many file uploads from this IP. Please try again later.',
            code: 'UPLOAD_RATE_LIMITED',
            retryAfter: Math.round(req.rateLimit.resetTime / 1000)
        });
    }
});

/**
 * Email verification rate limiter
 * Prevents spam of verification emails
 */
const emailVerificationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 verification email requests per hour
    message: {
        success: false,
        message: 'Too many email verification requests, please try again later.',
        code: 'EMAIL_VERIFICATION_RATE_LIMITED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        securityLogger('EMAIL_VERIFICATION_RATE_LIMIT_EXCEEDED', req, {
            ip: req.ip
        });
        
        res.status(429).json({
            success: false,
            message: 'Too many email verification requests from this IP. Please try again in 1 hour.',
            code: 'EMAIL_VERIFICATION_RATE_LIMITED',
            retryAfter: Math.round(req.rateLimit.resetTime / 1000)
        });
    }
});

/**
 * Create custom rate limiter
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
const createCustomLimiter = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000,
        max = 100,
        message = 'Too many requests',
        code = 'RATE_LIMITED',
        skipSuccessfulRequests = false,
        skipFailedRequests = false
    } = options;

    return rateLimit({
        windowMs,
        max,
        skipSuccessfulRequests,
        skipFailedRequests,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            securityLogger('CUSTOM_RATE_LIMIT_EXCEEDED', req, {
                ip: req.ip,
                endpoint: req.originalUrl,
                method: req.method,
                limiterType: code
            });
            
            res.status(429).json({
                success: false,
                message,
                code,
                retryAfter: Math.round(req.rateLimit.resetTime / 1000)
            });
        }
    });
};

/**
 * Dynamic rate limiter based on user role
 * Different limits for different user types
 */
const dynamicRateLimiter = (req, res, next) => {
    const user = req.user;
    let maxRequests = 100; // Default for unauthenticated users
    
    if (user) {
        switch (user.role) {
            case 'admin':
                maxRequests = 1000; // Higher limit for admins
                break;
            case 'faculty':
                maxRequests = 500; // Medium limit for faculty
                break;
            case 'student':
                maxRequests = 200; // Standard limit for students
                break;
            default:
                maxRequests = 100;
        }
    }

    // Create dynamic limiter
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: maxRequests,
        keyGenerator: (req) => {
            // Use user ID if authenticated, otherwise use IP
            return req.user ? `user:${req.user.userId}` : `ip:${req.ip}`;
        },
        handler: (req, res) => {
            securityLogger('DYNAMIC_RATE_LIMIT_EXCEEDED', req, {
                userId: req.user?.userId,
                role: req.user?.role,
                ip: req.ip,
                limit: maxRequests
            });
            
            res.status(429).json({
                success: false,
                message: `Rate limit exceeded for ${user?.role || 'anonymous'} users.`,
                code: 'DYNAMIC_RATE_LIMITED',
                retryAfter: Math.round(req.rateLimit.resetTime / 1000)
            });
        }
    });

    return limiter(req, res, next);
};

/**
 * Sliding window rate limiter using Redis (for production)
 * This is a more sophisticated rate limiter for high-traffic applications
 */
const createSlidingWindowLimiter = (redisClient) => {
    return (windowMs, maxRequests) => {
        return async (req, res, next) => {
            if (!redisClient) {
                // Fallback to memory-based limiter if Redis is not available
                return generalLimiter(req, res, next);
            }

            const key = `rate_limit:${req.ip}`;
            const now = Date.now();
            const window = Math.floor(now / windowMs);

            try {
                const pipeline = redisClient.pipeline();
                pipeline.zremrangebyscore(key, 0, now - windowMs);
                pipeline.zadd(key, now, `${now}-${Math.random()}`);
                pipeline.zcard(key);
                pipeline.expire(key, Math.ceil(windowMs / 1000));

                const results = await pipeline.exec();
                const requestCount = results[2][1];

                if (requestCount > maxRequests) {
                    securityLogger('SLIDING_WINDOW_RATE_LIMIT_EXCEEDED', req, {
                        ip: req.ip,
                        requestCount,
                        maxRequests
                    });

                    return res.status(429).json({
                        success: false,
                        message: 'Rate limit exceeded',
                        code: 'RATE_LIMITED',
                        retryAfter: Math.ceil(windowMs / 1000)
                    });
                }

                next();
            } catch (error) {
                console.error('Redis rate limiter error:', error);
                // Fallback to allowing the request if Redis fails
                next();
            }
        };
    };
};

module.exports = {
    generalLimiter,
    authLimiter,
    registrationLimiter,
    passwordResetLimiter,
    uploadLimiter,
    emailVerificationLimiter,
    createCustomLimiter,
    dynamicRateLimiter,
    createSlidingWindowLimiter
};