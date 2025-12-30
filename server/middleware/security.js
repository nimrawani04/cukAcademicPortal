module.exports = {};

// /**
//  * Advanced Security Middleware
//  * Implements comprehensive security measures for the Academic Portal
//  * 
//  * Features:
//  * - SQL injection prevention
//  * - XSS attack prevention  
//  * - CSRF protection
//  * - Request fingerprinting for anomaly detection
//  * - Suspicious activity monitoring
//  * - IP-based security controls
//  */

// const rateLimit = require('express-rate-limit');
// const slowDown = require('express-slow-down');
// const crypto = require('crypto');

// /**
//  * Advanced rate limiting with progressive delays
//  * Implements exponential backoff for repeated violations
//  */
// const createAdvancedRateLimit = (options = {}) => {
//     const {
//         windowMs = 15 * 60 * 1000, // 15 minutes
//         max = 100,
//         delayAfter = 50,
//         delayMs = 500,
//         skipSuccessfulRequests = true,
//         skipFailedRequests = false,
//         keyGenerator = (req) => req.ip
//     } = options;
    
//     return [
//         // Rate limiting
//         rateLimit({
//             windowMs,
//             max,
//             message: {
//                 success: false,
//                 message: 'Too many requests from this IP, please try again later',
//                 code: 'RATE_LIMIT_EXCEEDED',
//                 retryAfter: Math.ceil(windowMs / 1000)
//             },
//             standardHeaders: true,
//             legacyHeaders: false,
//             keyGenerator,
//             skipSuccessfulRequests,
//             skipFailedRequests,
//             onLimitReached: (req, res, options) => {
//                 console.warn(`Rate limit exceeded for IP: ${req.ip}`, {
//                     ip: req.ip,
//                     userAgent: req.get('User-Agent'),
//                     path: req.path,
//                     method: req.method,
//                     timestamp: new Date().toISOString()
//                 });
//             }
//         }),
        
//         // Progressive delay
//         slowDown({
//             windowMs,
//             delayAfter,
//             delayMs,
//             maxDelayMs: 20000, // Maximum 20 second delay
//             keyGenerator,
//             skipSuccessfulRequests,
//             skipFailedRequests
//         })
//     ];
// };

// /**
//  * Authentication-specific rate limiting
//  * Stricter limits for login attempts to prevent brute force attacks
//  */
// const authRateLimit = createAdvancedRateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 5, // 5 attempts per window
//     delayAfter: 2, // Start delaying after 2 attempts
//     delayMs: 1000, // 1 second delay
//     skipSuccessfulRequests: true,
//     skipFailedRequests: false
// });

// /**
//  * Registration rate limiting
//  * Prevents spam registrations
//  */
// const registrationRateLimit = createAdvancedRateLimit({
//     windowMs: 60 * 60 * 1000, // 1 hour
//     max: 3, // 3 registration attempts per hour
//     delayAfter: 1,
//     delayMs: 2000
// });

// /**
//  * File upload rate limiting
//  * Prevents abuse of file upload endpoints
//  */
// const uploadRateLimit = createAdvancedRateLimit({
//     windowMs: 10 * 60 * 1000, // 10 minutes
//     max: 20, // 20 uploads per 10 minutes
//     delayAfter: 10,
//     delayMs: 3000
// });

// /**
//  * Request fingerprinting for anomaly detection
//  * Creates unique fingerprints to detect suspicious patterns
//  */
// const requestFingerprinting = (req, res, next) => {
//     try {
//         // Create request fingerprint
//         const fingerprint = {
//             ip: req.ip,
//             userAgent: req.get('User-Agent') || '',
//             acceptLanguage: req.get('Accept-Language') || '',
//             acceptEncoding: req.get('Accept-Encoding') || '',
//             connection: req.get('Connection') || '',
//             timestamp: Date.now(),
//             path: req.path,
//             method: req.method
//         };
        
//         // Generate hash of fingerprint
//         const fingerprintHash = crypto
//             .createHash('sha256')
//             .update(JSON.stringify(fingerprint))
//             .digest('hex');
        
//         // Attach to request for later use
//         req.fingerprint = fingerprintHash;
//         req.fingerprintData = fingerprint;
        
//         // Log suspicious patterns
//         detectSuspiciousActivity(req);
        
//         next();
//     } catch (error) {
//         console.error('Request fingerprinting error:', error);
//         next(); // Continue even if fingerprinting fails
//     }
// };


// const detectSuspiciousActivity = (req) => {
//     const suspicious = [];

//     // 1. Suspicious user agents
//     const userAgent = req.get('User-Agent') || '';
//     const suspiciousUAPatterns = [
//         /bot/i,
//         /crawler/i,
//         /spider/i,
//         /curl/i,
//         /wget/i
//     ];

//     if (suspiciousUAPatterns.some(p => p.test(userAgent))) {
//         suspicious.push('suspicious_user_agent');
//     }

//     // 2. Missing common headers
//     if (!req.get('Accept')) suspicious.push('missing_accept_header');
//     if (!req.get('Accept-Language')) suspicious.push('missing_language_header');

//     // 3. SAFE suspicious patterns (Node.js compatible)
//     const suspiciousPatterns = [
//         /\.\.\//,
//         /\/etc\/passwd/,
//         /\/proc\//,
//         /\x00/,
//         /<script/i,
//         /union.*select/i,
//         /drop.*table/i,
//         /exec.*\(/i
//     ];

//     // 4. Check request path
//     if (req.path && suspiciousPatterns.some(p => p.test(req.path))) {
//         suspicious.push('suspicious_path');
//     }

//     // 5. Check request body
//     if (req.body && typeof req.body === 'object') {
//         const bodyString = JSON.stringify(req.body);
//         if (suspiciousPatterns.some(p => p.test(bodyString))) {
//             suspicious.push('suspicious_body_content');
//         }
//     }

//     // 6. Log suspicious activity
//     if (suspicious.length > 0) {
//         console.warn('⚠️ Suspicious activity detected:', {
//             ip: req.ip,
//             path: req.path,
//             method: req.method,
//             flags: suspicious,
//             timestamp: new Date().toISOString()
//         });

//         req.suspiciousActivity = suspicious;
//     }
// };

// /**
//  * SQL injection prevention middleware
//  * Scans request data for SQL injection patterns
//  */
// /**
//  * SQL Injection prevention middleware
//  * JavaScript-safe implementation
//  */
// const preventSQLInjection = (req, res, next) => {
//     const sqlPatterns = [
//         /('|;|--|\bOR\b|\bAND\b)/i,
//         /(union|select|insert|delete|update|drop|create|alter|exec)/i
//     ];

//     const check = (data) => {
//         if (typeof data === 'string') {
//             return sqlPatterns.some(p => p.test(data));
//         }

//         if (typeof data === 'object' && data !== null) {
//             return Object.values(data).some(v => check(v));
//         }

//         return false;
//     };

//     const hasSQLi = [req.body, req.query, req.params]
//         .some(data => data && check(data));

//     if (hasSQLi) {
//         return res.status(400).json({
//             success: false,
//             message: 'Invalid request',
//             code: 'SQL_INJECTION_DETECTED'
//         });
//     }

//     next();
// };

// /**
//  * XSS prevention middleware
//  * JavaScript-safe implementation
//  */
// const preventXSS = (req, res, next) => {
//     const xssPatterns = [
//         /<script/i,
//         /<iframe/i,
//         /<object/i,
//         /<embed/i,
//         /javascript:/i,
//         /vbscript:/i,
//         /onerror/i,
//         /onload/i
//     ];

//     const checkForXSS = (data) => {
//         if (typeof data === 'string') {
//             return xssPatterns.some(p => p.test(data));
//         }

//         if (typeof data === 'object' && data !== null) {
//             return Object.values(data).some(value => checkForXSS(value));
//         }

//         return false;
//     };

//     const hasXSS = [req.body, req.query, req.params]
//         .some(data => data && checkForXSS(data));

//     if (hasXSS) {
//         console.error('XSS attempt detected:', {
//             ip: req.ip,
//             path: req.path,
//             method: req.method,
//             timestamp: new Date().toISOString()
//         });

//         return res.status(400).json({
//             success: false,
//             message: 'Invalid input detected',
//             code: 'XSS_DETECTED'
//         });
//     }

//     next();
// };

// /**
//  * CSRF protection middleware
//  * Validates CSRF tokens for state-changing operations
//  */
// const csrfProtection = (req, res, next) => {
//     // Skip CSRF for GET, HEAD, OPTIONS requests
//     if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
//         return next();
//     }
    
//     // Skip CSRF for API endpoints with proper authentication
//     if (req.path.startsWith('/api/') && req.user) {
//         return next();
//     }
    
//     const token = req.get('X-CSRF-Token') || req.body._csrf;
//     const sessionToken = req.session?.csrfToken;
    
//     if (!token || !sessionToken || token !== sessionToken) {
//         console.warn('CSRF token validation failed:', {
//             ip: req.ip,
//             path: req.path,
//             method: req.method,
//             hasToken: !!token,
//             hasSessionToken: !!sessionToken,
//             timestamp: new Date().toISOString()
//         });
        
//         return res.status(403).json({
//             success: false,
//             message: 'Invalid or missing CSRF token',
//             code: 'CSRF_TOKEN_INVALID'
//         });
//     }
    
//     next();
// };

// /**
//  * IP-based security controls
//  * Implements IP whitelisting/blacklisting
//  */
// const ipSecurityControls = (req, res, next) => {
//     const clientIP = req.ip;
    
//     // Blacklisted IPs (could be loaded from database)
//     const blacklistedIPs = process.env.BLACKLISTED_IPS 
//         ? process.env.BLACKLISTED_IPS.split(',')
//         : [];
    
//     // Check if IP is blacklisted
//     if (blacklistedIPs.includes(clientIP)) {
//         console.error('Blacklisted IP access attempt:', {
//             ip: clientIP,
//             userAgent: req.get('User-Agent'),
//             path: req.path,
//             timestamp: new Date().toISOString()
//         });
        
//         return res.status(403).json({
//             success: false,
//             message: 'Access denied',
//             code: 'IP_BLOCKED'
//         });
//     }
    
//     // Whitelist for admin endpoints (if configured)
//     if (req.path.startsWith('/api/admin/')) {
//         const whitelistedIPs = process.env.ADMIN_WHITELISTED_IPS 
//             ? process.env.ADMIN_WHITELISTED_IPS.split(',')
//             : [];
        
//         if (whitelistedIPs.length > 0 && !whitelistedIPs.includes(clientIP)) {
//             console.warn('Non-whitelisted IP accessing admin endpoint:', {
//                 ip: clientIP,
//                 path: req.path,
//                 timestamp: new Date().toISOString()
//             });
            
//             return res.status(403).json({
//                 success: false,
//                 message: 'Admin access restricted to whitelisted IPs',
//                 code: 'IP_NOT_WHITELISTED'
//             });
//         }
//     }
    
//     next();
// };

// /**
//  * Security monitoring middleware
//  * Logs security events for analysis
//  */
// const securityMonitoring = (req, res, next) => {
//     // Log all authentication attempts
//     if (req.path.includes('/login') || req.path.includes('/auth')) {
//         console.info('Authentication attempt:', {
//             ip: req.ip,
//             userAgent: req.get('User-Agent'),
//             path: req.path,
//             method: req.method,
//             timestamp: new Date().toISOString()
//         });
//     }
    
//     // Log admin endpoint access
//     if (req.path.startsWith('/api/admin/')) {
//         console.info('Admin endpoint access:', {
//             ip: req.ip,
//             user: req.user?.email || 'unauthenticated',
//             path: req.path,
//             method: req.method,
//             timestamp: new Date().toISOString()
//         });
//     }
    
//     // Log file upload attempts
//     if (req.path.includes('/upload')) {
//         console.info('File upload attempt:', {
//             ip: req.ip,
//             user: req.user?.email || 'unauthenticated',
//             path: req.path,
//             contentType: req.get('Content-Type'),
//             contentLength: req.get('Content-Length'),
//             timestamp: new Date().toISOString()
//         });
//     }
    
//     next();
// };

// /**
//  * Request timeout middleware
//  * Prevents long-running requests that could cause DoS
//  */
// const requestTimeout = (timeoutMs = 30000) => {
//     return (req, res, next) => {
//         const timeout = setTimeout(() => {
//             if (!res.headersSent) {
//                 console.warn('Request timeout:', {
//                     ip: req.ip,
//                     path: req.path,
//                     method: req.method,
//                     timeout: timeoutMs,
//                     timestamp: new Date().toISOString()
//                 });
                
//                 res.status(408).json({
//                     success: false,
//                     message: 'Request timeout',
//                     code: 'REQUEST_TIMEOUT'
//                 });
//             }
//         }, timeoutMs);
        
//         // Clear timeout when response is sent
//         res.on('finish', () => {
//             clearTimeout(timeout);
//         });
        
//         next();
//     };
// };

// module.exports = {
//     // Rate limiting
//     authRateLimit,
//     registrationRateLimit,
//     uploadRateLimit,
//     createAdvancedRateLimit,
    
//     // Security middleware
//     requestFingerprinting,
//     preventSQLInjection,
//     preventXSS,
//     csrfProtection,
//     ipSecurityControls,
//     securityMonitoring,
//     requestTimeout,
    
//     // Utility functions
//     detectSuspiciousActivity
// };