// Helper Utilities - Common utility functions used throughout the application
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * Date and Time Utilities
 */
const dateHelpers = {
    /**
     * Format date to readable string
     * @param {Date} date - Date object
     * @param {string} format - Format type ('short', 'long', 'time')
     * @returns {string} Formatted date string
     */
    formatDate: (date, format = 'short') => {
        if (!date) return '';
        
        const d = new Date(date);
        
        switch (format) {
            case 'short':
                return d.toLocaleDateString();
            case 'long':
                return d.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            case 'time':
                return d.toLocaleTimeString();
            case 'datetime':
                return d.toLocaleString();
            default:
                return d.toLocaleDateString();
        }
    },

    /**
     * Check if date is in the past
     * @param {Date} date - Date to check
     * @returns {boolean} True if date is in the past
     */
    isPastDate: (date) => {
        return new Date(date) < new Date();
    },

    /**
     * Get days between two dates
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {number} Number of days between dates
     */
    daysBetween: (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * Add days to a date
     * @param {Date} date - Original date
     * @param {number} days - Number of days to add
     * @returns {Date} New date with added days
     */
    addDays: (date, days) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    },

    /**
     * Get start and end of academic semester
     * @param {string} semester - Semester type ('fall', 'spring', 'summer')
     * @param {number} year - Year
     * @returns {Object} Object with startDate and endDate
     */
    getSemesterDates: (semester, year) => {
        const dates = {
            fall: {
                startDate: new Date(year, 8, 1), // September 1
                endDate: new Date(year, 11, 15)  // December 15
            },
            spring: {
                startDate: new Date(year, 0, 15), // January 15
                endDate: new Date(year, 4, 15)    // May 15
            },
            summer: {
                startDate: new Date(year, 5, 1),  // June 1
                endDate: new Date(year, 7, 15)    // August 15
            }
        };
        
        return dates[semester.toLowerCase()] || dates.fall;
    }
};

/**
 * String Utilities
 */
const stringHelpers = {
    /**
     * Capitalize first letter of each word
     * @param {string} str - Input string
     * @returns {string} Capitalized string
     */
    capitalize: (str) => {
        if (!str) return '';
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    },

    /**
     * Generate random string
     * @param {number} length - Length of string
     * @param {string} charset - Character set to use
     * @returns {string} Random string
     */
    generateRandomString: (length = 10, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    },

    /**
     * Create URL-friendly slug from string
     * @param {string} str - Input string
     * @returns {string} URL slug
     */
    createSlug: (str) => {
        if (!str) return '';
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    /**
     * Truncate string to specified length
     * @param {string} str - Input string
     * @param {number} length - Maximum length
     * @param {string} suffix - Suffix to add if truncated
     * @returns {string} Truncated string
     */
    truncate: (str, length = 100, suffix = '...') => {
        if (!str || str.length <= length) return str;
        return str.substring(0, length - suffix.length) + suffix;
    },

    /**
     * Extract initials from full name
     * @param {string} firstName - First name
     * @param {string} lastName - Last name
     * @returns {string} Initials
     */
    getInitials: (firstName, lastName) => {
        const first = firstName ? firstName.charAt(0).toUpperCase() : '';
        const last = lastName ? lastName.charAt(0).toUpperCase() : '';
        return first + last;
    }
};

/**
 * Array and Object Utilities
 */
const dataHelpers = {
    /**
     * Remove duplicates from array
     * @param {Array} arr - Input array
     * @param {string} key - Key to check for duplicates (for object arrays)
     * @returns {Array} Array without duplicates
     */
    removeDuplicates: (arr, key = null) => {
        if (!Array.isArray(arr)) return [];
        
        if (key) {
            const seen = new Set();
            return arr.filter(item => {
                const value = item[key];
                if (seen.has(value)) return false;
                seen.add(value);
                return true;
            });
        }
        
        return [...new Set(arr)];
    },

    /**
     * Group array of objects by key
     * @param {Array} arr - Array of objects
     * @param {string} key - Key to group by
     * @returns {Object} Grouped object
     */
    groupBy: (arr, key) => {
        if (!Array.isArray(arr)) return {};
        
        return arr.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    },

    /**
     * Sort array of objects by key
     * @param {Array} arr - Array of objects
     * @param {string} key - Key to sort by
     * @param {string} order - Sort order ('asc' or 'desc')
     * @returns {Array} Sorted array
     */
    sortBy: (arr, key, order = 'asc') => {
        if (!Array.isArray(arr)) return [];
        
        return arr.sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            
            if (order === 'desc') {
                return bVal > aVal ? 1 : -1;
            }
            return aVal > bVal ? 1 : -1;
        });
    },

    /**
     * Deep clone object
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    deepClone: (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => dataHelpers.deepClone(item));
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = dataHelpers.deepClone(obj[key]);
            }
        }
        return cloned;
    },

    /**
     * Check if object is empty
     * @param {Object} obj - Object to check
     * @returns {boolean} True if object is empty
     */
    isEmpty: (obj) => {
        if (obj == null) return true;
        if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
        return Object.keys(obj).length === 0;
    }
};

/**
 * Validation Utilities
 */
const validationHelpers = {
    /**
     * Check if email is valid
     * @param {string} email - Email to validate
     * @returns {boolean} True if email is valid
     */
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Check if phone number is valid
     * @param {string} phone - Phone number to validate
     * @returns {boolean} True if phone is valid
     */
    isValidPhone: (phone) => {
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(phone);
    },

    /**
     * Check if password meets requirements
     * @param {string} password - Password to validate
     * @returns {Object} Validation result with isValid and errors
     */
    validatePassword: (password) => {
        const errors = [];
        
        if (!password || password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Check if string is a valid MongoDB ObjectId
     * @param {string} id - ID to validate
     * @returns {boolean} True if valid ObjectId
     */
    isValidObjectId: (id) => {
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        return objectIdRegex.test(id);
    }
};

/**
 * Security Utilities
 */
const securityHelpers = {
    /**
     * Generate secure random token
     * @param {number} length - Token length in bytes
     * @returns {string} Random token
     */
    generateToken: (length = 32) => {
        return crypto.randomBytes(length).toString('hex');
    },

    /**
     * Hash password
     * @param {string} password - Plain text password
     * @param {number} saltRounds - Number of salt rounds
     * @returns {Promise<string>} Hashed password
     */
    hashPassword: async (password, saltRounds = 12) => {
        const salt = await bcrypt.genSalt(saltRounds);
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
     * Generate JWT token
     * @param {Object} payload - Token payload
     * @param {string} expiresIn - Token expiration
     * @returns {string} JWT token
     */
    generateJWT: (payload, expiresIn = '7d') => {
        return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
    },

    /**
     * Verify JWT token
     * @param {string} token - JWT token
     * @returns {Object} Decoded token payload
     */
    verifyJWT: (token) => {
        return jwt.verify(token, process.env.JWT_SECRET);
    }
};

/**
 * File Utilities
 */
const fileHelpers = {
    /**
     * Get file extension from filename
     * @param {string} filename - File name
     * @returns {string} File extension
     */
    getFileExtension: (filename) => {
        if (!filename) return '';
        return filename.split('.').pop().toLowerCase();
    },

    /**
     * Check if file type is allowed
     * @param {string} filename - File name
     * @param {Array} allowedTypes - Array of allowed extensions
     * @returns {boolean} True if file type is allowed
     */
    isAllowedFileType: (filename, allowedTypes = ['jpg', 'jpeg', 'png', 'pdf']) => {
        const extension = fileHelpers.getFileExtension(filename);
        return allowedTypes.includes(extension);
    },

    /**
     * Format file size to human readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Generate unique filename
     * @param {string} originalName - Original filename
     * @returns {string} Unique filename
     */
    generateUniqueFilename: (originalName) => {
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1E9);
        const extension = fileHelpers.getFileExtension(originalName);
        const baseName = originalName.replace(/\.[^/.]+$/, '');
        
        return `${baseName}-${timestamp}-${random}.${extension}`;
    }
};

module.exports = {
    dateHelpers,
    stringHelpers,
    dataHelpers,
    validationHelpers,
    securityHelpers,
    fileHelpers
};