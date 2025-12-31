// Main server file - Entry point of our application
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database connection
const connectDB = require('./server/config/db');

// Create Express application
const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
});

// Health endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: "OK",
        message: "Server is running"
    });
});

// Import and use auth routes
const authRoutes = require('./server/routes/authRoutes');
app.use('/api/auth', authRoutes);

// Start server
const startServer = async () => {
    try {
        // Try to connect to database
        try {
            await connectDB();
        } catch (dbError) {
            console.log('⚠️  Database connection failed, continuing without database...');
            console.log('⚠️  Registration will work but data won\'t be saved');
        }
        
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('Server startup error:', error.message);
        process.exit(1);
    }
};

startServer();