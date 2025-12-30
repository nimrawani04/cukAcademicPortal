// Authentication Helper Utilities - Common functions for authentication system
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Token Management Utilities
 */
const tokenHelpers = {
    /**
     * Generate access and refresh tokens
     * @param {Object} user - User object
     * @returns {Object} Object containing access and refresh tokens
     */
    generateTokenPair: (user) => {
        const payload = {
            userId: user._id,
            email: user.email,
            role: user.role,
            userType: user.userType || user.role
        };

        // Access token (short-lived)
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
            issuer: 'academic-portal',
            audience: 'academic-portal-users'
        });

        // Refresh token (long-lived)
        const refreshToken = jwt.sign(
            { 
                userId: user._id, 
                tokenType: 'refresh',
                tokenVersion: user.tokenVersion || 1
            }, 
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, 
            { 
                expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
                issuer: 'academic-portal',
                audience: 'academic-portal-users'
            }
        );

        return { accessToken, refreshToken };
    },

    /**
     * Verify JWT token
     * @param {string} token - JWT token to verify
     * @param {string} type - Token type ('access' or 'refresh')
     * @returns {Object} Decoded token payload
     */
    verifyToken: (token, type = 'access') => {
        const secret = type === 'refresh' 
            ? (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)
            : process.env.JWT_SECRET;

        return jwt.verify(token, secret, {
            issuer: 'academic-portal',
            audience: 'academic-portal-users'
        });
    },

    /**
     * Generate secure random token
     * @param {number} length - Token length in bytes
     * @returns {string} Random token
     */
    generateSecureToken: (length = 32) => {
        return crypto.randomBytes(length).toString('hex');
    },

    /**
     * Generate email verification token
     * @param {string} email - User email
     * @returns {string} Verification token
     */
    generateEmailVerificationToken: (email) => {
        const payload = {
            email,
            type: 'email_verification',
            timestamp: Date.now()
        };
        
        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '24h',
            issuer: 'academic-portal'
        });
    },

    /**
     * Generate password reset token
     * @param {string} userId - User ID
     * @param {string} email - User email
     * @returns {string} Password reset token
     */
    generatePasswordResetToken: (userId, email) => {
        const payload = {
            userId,
            email,
            type: 'password_reset',
            timestamp: Date.now()
        };
        
        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1h',
            issuer: 'academic-portal'
        });
    }
};

/**
 * Password Management Utilities
 */
const passwordHelpers = {
    /**
     * Hash password with bcrypt
     * @param {string} password - Plain text password
     * @param {number} saltRounds - Number of salt rounds
     * @returns {Promise<string>} Hashed password
     */
    hashPassword: async (password, saltRounds = null) => {
        const rounds = saltRounds || parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        const salt = await bcrypt.genSalt(rounds);
        return await bcrypt.hash(password, salt);
    },

    /**
     * Compare password with hash
     * @param {string} password - Plain text password
     * @param {string} hash - Hashed password
     * @returns {Promise<boolean>} True if passwords match
     */
    comparePassword: async (password, hash) => {
        return await bcrypt.compare(password, hash);
    },

    /**
     * Generate secure random password
     * @param {number} length - Password length
     * @param {Object} options - Password generation options
     * @returns {string} Generated password
     */
    generateSecurePassword: (length = 12, options = {}) => {
        const {
            includeUppercase = true,
            includeLowercase = true,
            includeNumbers = true,
            includeSymbols = true,
            excludeSimilar = true
        } = options;

        let charset = '';
        
        if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (includeNumbers) charset += '0123456789';
        if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        if (excludeSimilar) {
            charset = charset.replace(/[0O1lI]/g, '');
        }

        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        return password;
    },

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {Object} Validation result with score and feedback
     */
    validatePasswordStrength: (password) => {
        const result = {
            score: 0,
            strength: 'Very Weak',
            feedback: [],
            isValid: false
        };

        if (!password) {
            result.feedback.push('Password is required');
            return result;
        }

        // Length check
        if (password.length >= 8) result.score += 1;
        else result.feedback.push('Password must be at least 8 characters long');

        if (password.length >= 12) result.score += 1;

        // Character variety checks
        if (/[a-z]/.test(password)) result.score += 1;
        else result.feedback.push('Password must contain lowercase letters');

        if (/[A-Z]/.test(password)) result.score += 1;
        else result.feedback.push('Password must contain uppercase letters');

        if (/\d/.test(password)) result.score += 1;
        else result.feedback.push('Password must contain numbers');

        if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) result.score += 1;
        else result.feedback.push('Password must contain special characters');

        // Common patterns check
        if (!/(.)\1{2,}/.test(password)) result.score += 1;
        else result.feedback.push('Password should not contain repeated characters');

        if (!/123|abc|qwe|password|admin/i.test(password)) result.score += 1;
        else result.feedback.push('Password should not contain common patterns');

        // Determine strength
        if (result.score >= 7) {
            result.strength = 'Very Strong';
            result.isValid = true;
        } else if (result.score >= 6) {
            result.strength = 'Strong';
            result.isValid = true;
        } else if (result.score >= 4) {
            result.strength = 'Medium';
            result.isValid = true;
        } else if (result.score >= 2) {
            result.strength = 'Weak';
        } else {
            result.strength = 'Very Weak';
        }

        return result;
    }
};

/**
 * Session Management Utilities
 */
const sessionHelpers = {
    /**
     * Generate session ID
     * @returns {string} Unique session ID
     */
    generateSessionId: () => {
        return crypto.randomBytes(32).toString('hex');
    },

    /**
     * Create session data
     * @param {Object} user - User object
     * @param {Object} req - Express request object
     * @returns {Object} Session data
     */
    createSessionData: (user, req) => {
        return {
            userId: user._id,
            email: user.email,
            role: user.role,
            loginTime: new Date(),
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            isActive: true
        };
    },

    /**
     * Extract device info from user agent
     * @param {string} userAgent - User agent string
     * @returns {Object} Device information
     */
    parseUserAgent: (userAgent) => {
        if (!userAgent) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };

        const result = {
            browser: 'Unknown',
            os: 'Unknown',
            device: 'Desktop'
        };

        // Browser detection
        if (userAgent.includes('Chrome')) result.browser = 'Chrome';
        else if (userAgent.includes('Firefox')) result.browser = 'Firefox';
        else if (userAgent.includes('Safari')) result.browser = 'Safari';
        else if (userAgent.includes('Edge')) result.browser = 'Edge';
        else if (userAgent.includes('Opera')) result.browser = 'Opera';

        // OS detection
        if (userAgent.includes('Windows')) result.os = 'Windows';
        else if (userAgent.includes('Mac OS')) result.os = 'macOS';
        else if (userAgent.includes('Linux')) result.os = 'Linux';
        else if (userAgent.includes('Android')) result.os = 'Android';
        else if (userAgent.includes('iOS')) result.os = 'iOS';

        // Device detection
        if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
            result.device = 'Mobile';
        } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
            result.device = 'Tablet';
        }

        return result;
    }
};

/**
 * Security Utilities
 */
const securityHelpers = {
    /**
     * Generate CSRF token
     * @returns {string} CSRF token
     */
    generateCSRFToken: () => {
        return crypto.randomBytes(32).toString('base64');
    },

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if email is valid
     */
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Check if IP is in whitelist
     * @param {string} ip - IP address to check
     * @param {Array} whitelist - Array of allowed IPs
     * @returns {boolean} True if IP is allowed
     */
    isIPWhitelisted: (ip, whitelist = []) => {
        if (whitelist.length === 0) return true;
        return whitelist.includes(ip);
    },

    /**
     * Generate API key
     * @param {string} prefix - Key prefix
     * @returns {string} API key
     */
    generateAPIKey: (prefix = 'ak') => {
        const randomPart = crypto.randomBytes(32).toString('hex');
        return `${prefix}_${randomPart}`;
    },

    /**
     * Hash API key for storage
     * @param {string} apiKey - API key to hash
     * @returns {string} Hashed API key
     */
    hashAPIKey: (apiKey) => {
        return crypto.createHash('sha256').update(apiKey).digest('hex');
    },

    /**
     * Rate limiting helper
     * @param {string} key - Rate limit key
     * @param {number} maxAttempts - Maximum attempts
     * @param {number} windowMs - Time window in milliseconds
     * @param {Map} store - In-memory store
     * @returns {Object} Rate limit result
     */
    checkRateLimit: (key, maxAttempts, windowMs, store) => {
        const now = Date.now();
        const record = store.get(key);

        if (!record) {
            store.set(key, { count: 1, resetTime: now + windowMs });
            return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs };
        }

        if (now > record.resetTime) {
            store.set(key, { count: 1, resetTime: now + windowMs });
            return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs };
        }

        if (record.count >= maxAttempts) {
            return { 
                allowed: false, 
                remaining: 0, 
                resetTime: record.resetTime,
                retryAfter: Math.ceil((record.resetTime - now) / 1000)
            };
        }

        record.count++;
        return { 
            allowed: true, 
            remaining: maxAttempts - record.count, 
            resetTime: record.resetTime 
        };
    }
};

/**
 * Validation Utilities
 */
const validationHelpers = {
    /**
     * Validate user registration data
     * @param {Object} userData - User data to validate
     * @returns {Object} Validation result
     */
    validateRegistrationData: (userData) => {
        const errors = [];
        const { firstName, lastName, email, password, phone, role } = userData;

        // Name validation
        if (!firstName || firstName.trim().length < 2) {
            errors.push('First name must be at least 2 characters long');
        }
        if (!lastName || lastName.trim().length < 2) {
            errors.push('Last name must be at least 2 characters long');
        }

        // Email validation
        if (!email || !securityHelpers.isValidEmail(email)) {
            errors.push('Please provide a valid email address');
        }

        // Password validation
        const passwordValidation = passwordHelpers.validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            errors.push(...passwordValidation.feedback);
        }

        // Phone validation
        if (!phone || !/^[+]?[\d\s\-()]{10,15}$/.test(phone)) {
            errors.push('Please provide a valid phone number');
        }

        // Role validation
        if (!role || !['student', 'faculty', 'admin'].includes(role)) {
            errors.push('Please select a valid role');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Sanitize user input
     * @param {string} input - Input to sanitize
     * @returns {string} Sanitized input
     */
    sanitizeInput: (input) => {
        if (typeof input !== 'string') return input;
        
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, ''); // Remove event handlers
    }
};

module.exports = {
    tokenHelpers,
    passwordHelpers,
    sessionHelpers,
    securityHelpers,
    validationHelpers
};