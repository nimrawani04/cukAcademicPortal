// Request Logger Middleware - Logs HTTP requests for debugging and monitoring
const fs = require('fs');
const path = require('path');

/**
 * Create logs directory if it doesn't exist
 */
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Format date for log files
 * @returns {string} Date in YYYY-MM-DD format
 */
const getDateString = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
};

/**
 * Format timestamp for log entries
 * @returns {string} Timestamp in ISO format
 */
const getTimestamp = () => {
    return new Date().toISOString();
};

/**
 * Write log entry to file
 * @param {string} logEntry - The log entry to write
 * @param {string} logType - Type of log (access, error, etc.)
 */
const writeToLogFile = (logEntry, logType = 'access') => {
    const dateString = getDateString();
    const logFileName = `${logType}-${dateString}.log`;
    const logFilePath = path.join(logsDir, logFileName);
    
    fs.appendFile(logFilePath, logEntry + '\n', (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
};

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
const getClientIP = (req) => {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           'unknown';
};

/**
 * Request logging middleware
 * Logs all HTTP requests with details like method, URL, IP, user agent, etc.
 */
const logger = (req, res, next) => {
    const startTime = Date.now();
    
    // Get request details
    const method = req.method;
    const url = req.originalUrl || req.url;
    const userAgent = req.get('User-Agent') || 'unknown';
    const clientIP = getClientIP(req);
    const timestamp = getTimestamp();
    
    // Get user info if authenticated
    const userId = req.user ? req.user.userId : 'anonymous';
    const userRole = req.user ? req.user.role : 'none';
    
    // Override res.end to capture response details
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        // Calculate response time
        const responseTime = Date.now() - startTime;
        
        // Get response details
        const statusCode = res.statusCode;
        const contentLength = res.get('Content-Length') || 0;
        
        // Create log entry
        const logEntry = [
            timestamp,
            clientIP,
            method,
            url,
            statusCode,
            responseTime + 'ms',
            contentLength + 'bytes',
            userId,
            userRole,
            `"${userAgent}"`
        ].join(' | ');
        
        // Write to log file
        writeToLogFile(logEntry, 'access');
        
        // Console log in development
        if (process.env.NODE_ENV === 'development') {
            const statusColor = statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'; // Red for errors, green for success
            const resetColor = '\x1b[0m';
            
            console.log(
                `${statusColor}${method} ${url} ${statusCode}${resetColor} - ${responseTime}ms - ${clientIP}`
            );
        }
        
        // Call original end method
        originalEnd.call(this, chunk, encoding);
    };
    
    next();
};

/**
 * Error logging middleware
 * Logs application errors to separate error log file
 */
const errorLogger = (err, req, res, next) => {
    const timestamp = getTimestamp();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const clientIP = getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    const userId = req.user ? req.user.userId : 'anonymous';
    
    // Create error log entry
    const errorLogEntry = [
        timestamp,
        'ERROR',
        clientIP,
        method,
        url,
        userId,
        err.message,
        err.stack ? err.stack.replace(/\n/g, ' | ') : 'No stack trace',
        `"${userAgent}"`
    ].join(' | ');
    
    // Write to error log file
    writeToLogFile(errorLogEntry, 'error');
    
    next(err);
};

/**
 * Security event logger
 * Logs security-related events like failed login attempts, unauthorized access, etc.
 */
const securityLogger = (event, req, details = {}) => {
    const timestamp = getTimestamp();
    const clientIP = getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    const url = req.originalUrl || req.url;
    
    const securityLogEntry = [
        timestamp,
        'SECURITY',
        event,
        clientIP,
        url,
        JSON.stringify(details),
        `"${userAgent}"`
    ].join(' | ');
    
    writeToLogFile(securityLogEntry, 'security');
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.warn(`🔒 Security Event: ${event} from ${clientIP}`);
    }
};

/**
 * Performance logger
 * Logs slow requests for performance monitoring
 */
const performanceLogger = (threshold = 1000) => {
    return (req, res, next) => {
        const startTime = Date.now();
        
        const originalEnd = res.end;
        res.end = function(chunk, encoding) {
            const responseTime = Date.now() - startTime;
            
            // Log slow requests
            if (responseTime > threshold) {
                const timestamp = getTimestamp();
                const method = req.method;
                const url = req.originalUrl || req.url;
                const clientIP = getClientIP(req);
                
                const performanceLogEntry = [
                    timestamp,
                    'SLOW_REQUEST',
                    method,
                    url,
                    responseTime + 'ms',
                    clientIP
                ].join(' | ');
                
                writeToLogFile(performanceLogEntry, 'performance');
                
                console.warn(`⚠️  Slow request: ${method} ${url} took ${responseTime}ms`);
            }
            
            originalEnd.call(this, chunk, encoding);
        };
        
        next();
    };
};

module.exports = logger;
module.exports.errorLogger = errorLogger;
module.exports.securityLogger = securityLogger;
module.exports.performanceLogger = performanceLogger;