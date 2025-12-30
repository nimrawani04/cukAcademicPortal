// Simple server test without database connection
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Create Express application
const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check routes (simplified)
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        database: {
            connected: false,
            status: 'not configured for test'
        }
    });
});

app.get('/health/ready', (req, res) => {
    res.json({
        status: 'READY',
        timestamp: new Date().toISOString()
    });
});

app.get('/health/live', (req, res) => {
    res.json({
        status: 'ALIVE',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        pid: process.pid
    });
});

// Basic route
app.get('/', (req, res) => {
    res.json({
        message: 'Academic Portal API - Test Server',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Test server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Ready check: http://localhost:${PORT}/health/ready`);
    console.log(`🔗 Live check: http://localhost:${PORT}/health/live`);
});