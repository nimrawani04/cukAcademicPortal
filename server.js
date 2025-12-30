// Main server file - Entry point of our application

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config(); // Load environment variables from .env file

// Import database connection
const { connectDB, getConnectionInfo } = require('./server/config/database');

// Import route files
const authRoutes = require('./server/routes/authRoutes');
const studentRoutes = require('./server/routes/studentRoutes');
const courseRoutes = require('./server/routes/courseRoutes');
const healthRoutes = require('./server/routes/healthRoutes');
const marksRoutes = require('./server/routes/marksRoutes');
const attendanceRoutes = require('./server/routes/attendanceRoutes');
const noticeRoutes = require('./server/routes/noticeRoutes');
const adminRoutes = require('./server/routes/adminRoutes');
const registrationRoutes = require('./server/routes/registrationRoutes');
const assignmentRoutes = require('./server/routes/assignmentRoutes');
const uploadTestRoutes = require('./server/routes/uploadTestRoutes');

// Import middleware
const { errorHandler, notFoundHandler, initializeGlobalErrorHandlers } = require('./server/middleware/errorHandler');
const { addResponseTiming } = require('./server/utils/apiResponse');
const { sanitizeInput, securityHeaders, validateRequestSize } = require('./server/middleware/validation');
//const { requestFingerprinting, preventSQLInjection, preventXSS, securityMonitoring } = require('./server/middleware/security');
const logger = require('./server/middleware/logger');
//const { generalLimiter } = require('./server/middleware/rateLimiter');
const { handleUploadError } = require('./server/config/multer');

// Create Express application
const app = express();

// Initialize global error handlers
initializeGlobalErrorHandlers();

// Security middleware - Enhanced for production
app.use(helmet({
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
            scriptSrc: ["'self'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https:", "data:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            workerSrc: ["'none'"],
        },
    } : false,
    hsts: process.env.NODE_ENV === 'production' ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    } : false
}));

// Additional security headers
//app.use(securityHeaders);

// Request size validation
//app.use(validateRequestSize);

// Request fingerprinting and monitoring
//app.use(requestFingerprinting);
//app.use(securityMonitoring);

// SQL injection and XSS prevention
//app.use(preventSQLInjection);
//app.use(preventXSS);

// Response timing middleware
//app.use(addResponseTiming);

// Compression middleware
app.use(compression());

// CORS configuration - Production ready
const corsOptions = {
    origin: function (origin, callback) {
        // In production, be more strict about origins
        if (process.env.NODE_ENV === 'production') {
            const allowedOrigins = process.env.CORS_ORIGIN 
                ? process.env.CORS_ORIGIN.split(',').map(url => url.trim())
                : [process.env.FRONTEND_URL];
            
            // Allow requests with no origin (mobile apps, Postman, etc.) only in development
            if (!origin && process.env.NODE_ENV !== 'production') {
                return callback(null, true);
            }
            
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`Origin ${origin} not allowed by CORS policy`));
            }
        } else {
            // Development - more permissive
            const allowedOrigins = [
                process.env.FRONTEND_URL || 'http://localhost:3000',
                'http://localhost:3001',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:3001',
                'http://localhost:5500', // Live Server
                'http://127.0.0.1:5500'
            ];
            
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`Origin ${origin} not allowed by CORS`));
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
        'X-File-Name'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: process.env.NODE_ENV === 'production' ? 86400 : 0 // 24 hours in production
};

app.use(cors(corsOptions));

// Body parsing middleware with security enhancements
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        // Store raw body for webhook verification if needed
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb',
    parameterLimit: 1000 // Prevent parameter pollution
}));

// Input sanitization middleware
//app.use(sanitizeInput);

// Cookie parsing middleware
app.use(cookieParser());

// Request logging middleware
//app.use(logger);
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', apiLimiter);


// Rate limiting middleware
//app.use('/api/', generalLimiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'server/uploads')));

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
    // Serve static files from root directory
    app.use(express.static(path.join(__dirname)));
    
    // Handle React routing - send all non-API requests to index.html
    app.get('*', (req, res, next) => {
        // Skip API routes
        if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
            return next();
        }
        res.sendFile(path.join(__dirname, 'index.html'));
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
    const dbInfo = getConnectionInfo();
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
            connected: dbInfo.isConnected,
            status: dbInfo.readyStateText
        },
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
// Health check routes (no /api prefix for monitoring services)
app.use('/health', healthRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/upload-test', uploadTestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/registration', registrationRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Academic Portal API',
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/health',
        endpoints: {
            authentication: '/api/auth',
            registration: '/api/registration',
            students: '/api/students',
            courses: '/api/courses',
            marks: '/api/marks',
            attendance: '/api/attendance',
            notices: '/api/notices',
            assignments: '/api/assignments',
            admin: '/api/admin',
            health: '/api/health',
            uploadTest: '/api/upload-test'
        }
    });
});

// 404 handler for undefined routes
app.use('*', notFoundHandler);

// Upload error handling middleware (before general error handler)
app.use(handleUploadError);

// Error handling middleware (should be last)
app.use(errorHandler);

/**
 * Start the server
 */
const startServer = async () => {
    try {
        // Connect to database first
        console.log('🚀 Starting Academic Portal Server...');
        console.log('📋 Environment:', process.env.NODE_ENV || 'development');
        
        await connectDB();
        
        // Start server after successful database connection
        const PORT = process.env.PORT || 5000;
        const server = app.listen(PORT, () => {
            console.log('🎉 Server started successfully!');
            console.log(`🌐 Server running on port ${PORT}`);
            console.log(`📍 Local URL: http://localhost:${PORT}`);
            console.log(`🏥 Health check: http://localhost:${PORT}/health`);
            console.log('📚 API Documentation: http://localhost:${PORT}/api/docs');
            console.log('⏰ Server started at:', new Date().toISOString());
            console.log('🔐 Authentication endpoints:');
            console.log('   - General login: POST /api/auth/login');
            console.log('   - Student login: POST /api/auth/student/login');
            console.log('   - Faculty login: POST /api/auth/faculty/login');
            console.log('   - Admin login: POST /api/auth/admin/login');
            console.log('   - Register: POST /api/auth/register');
        });

        // Graceful shutdown handling
        const gracefulShutdown = (signal) => {
            console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
            
            server.close(async () => {
                console.log('🔒 HTTP server closed');
                
                try {
                    await mongoose.connection.close();
                    console.log('🔒 Database connection closed');
                    console.log('✅ Graceful shutdown completed');
                    process.exit(0);
                } catch (error) {
                    console.error('❌ Error during shutdown:', error.message);
                    process.exit(1);
                }
            });

            // Force close after 10 seconds
            setTimeout(() => {
                console.error('⚠️  Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('💥 Uncaught Exception:', error.message);
            console.error('Stack:', error.stack);
            process.exit(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('💥 Unhandled Rejection at:', promise);
            console.error('Reason:', reason);
            process.exit(1);
        });

    } catch (error) {
        console.error('💥 Failed to start server:', error.message);
        process.exit(1);
    }
};

// Start the application
startServer();