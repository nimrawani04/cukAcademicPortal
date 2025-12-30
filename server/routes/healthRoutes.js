// Health Check Routes - API endpoints for monitoring system health
const express = require('express');
const { getConnectionInfo } = require('../config/database');
const { 
    performHealthCheck, 
    testDatabaseOperations, 
    getDatabaseStats 
} = require('../utils/dbHealthCheck');

const router = express.Router();

/**
 * GET /api/health
 * Basic health check endpoint
 */
router.get('/', async (req, res) => {
    try {
        const dbInfo = getConnectionInfo();
        
        const healthStatus = {
            status: dbInfo.isConnected ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.version,
            environment: process.env.NODE_ENV || 'development',
            database: {
                connected: dbInfo.isConnected,
                status: dbInfo.readyStateText,
                host: dbInfo.host,
                name: dbInfo.name
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                external: Math.round(process.memoryUsage().external / 1024 / 1024)
            },
            cpu: {
                usage: process.cpuUsage()
            }
        };

        const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(healthStatus);

    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * GET /api/health/detailed
 * Comprehensive health check with database tests
 */
router.get('/detailed', async (req, res) => {
    try {
        console.log('🔍 Performing detailed health check...');
        
        const healthCheck = await performHealthCheck();
        
        const statusCode = healthCheck.database.connected && healthCheck.errors.length === 0 ? 200 : 503;
        
        res.status(statusCode).json({
            status: statusCode === 200 ? 'healthy' : 'unhealthy',
            ...healthCheck
        });

    } catch (error) {
        console.error('Detailed health check error:', error);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * GET /api/health/database
 * Database-specific health check and operations test
 */
router.get('/database', async (req, res) => {
    try {
        console.log('🔍 Testing database operations...');
        
        const [healthCheck, operationsTest] = await Promise.all([
            performHealthCheck(),
            testDatabaseOperations()
        ]);

        const isHealthy = healthCheck.database.connected && 
                         operationsTest.overall.success && 
                         healthCheck.errors.length === 0;

        const statusCode = isHealthy ? 200 : 503;

        res.status(statusCode).json({
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            connection: healthCheck.database,
            operations: operationsTest,
            performance: healthCheck.performance,
            errors: [...healthCheck.errors, ...(operationsTest.overall.error ? [operationsTest.overall.error] : [])]
        });

    } catch (error) {
        console.error('Database health check error:', error);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * GET /api/health/stats
 * Database statistics and metrics
 */
router.get('/stats', async (req, res) => {
    try {
        console.log('📊 Retrieving database statistics...');
        
        const stats = await getDatabaseStats();
        
        const statusCode = stats.errors.length === 0 ? 200 : 503;
        
        res.status(statusCode).json({
            status: statusCode === 200 ? 'success' : 'partial',
            ...stats
        });

    } catch (error) {
        console.error('Database stats error:', error);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * GET /api/health/readiness
 * Kubernetes/Docker readiness probe endpoint
 */
router.get('/readiness', async (req, res) => {
    try {
        const dbInfo = getConnectionInfo();
        
        if (dbInfo.isConnected) {
            res.status(200).json({
                status: 'ready',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(503).json({
                status: 'not ready',
                timestamp: new Date().toISOString(),
                reason: 'Database not connected'
            });
        }

    } catch (error) {
        res.status(503).json({
            status: 'not ready',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * GET /api/health/liveness
 * Kubernetes/Docker liveness probe endpoint
 */
router.get('/liveness', (req, res) => {
    // Simple liveness check - if the server can respond, it's alive
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = router;