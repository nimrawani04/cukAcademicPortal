// Database Health Check Utility - Monitor database connection and performance
const mongoose = require('mongoose');

/**
 * Perform comprehensive database health check
 * @returns {Object} Health check results
 */
const performHealthCheck = async () => {
    const healthCheck = {
        timestamp: new Date().toISOString(),
        database: {
            connected: false,
            status: 'unknown',
            host: null,
            name: null,
            version: null,
            ping: null,
            collections: 0,
            indexes: 0
        },
        performance: {
            responseTime: null,
            memoryUsage: null,
            activeConnections: null
        },
        errors: []
    };

    try {
        const startTime = Date.now();
        
        // Check basic connection status
        const connection = mongoose.connection;
        healthCheck.database.connected = connection.readyState === 1;
        healthCheck.database.status = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        }[connection.readyState];

        if (healthCheck.database.connected) {
            healthCheck.database.host = connection.host;
            healthCheck.database.name = connection.name;

            // Test database responsiveness with a simple ping
            const admin = connection.db.admin();
            const pingResult = await admin.ping();
            healthCheck.database.ping = pingResult.ok === 1 ? 'success' : 'failed';

            // Get database version
            const buildInfo = await admin.buildInfo();
            healthCheck.database.version = buildInfo.version;

            // Get collection count
            const collections = await connection.db.listCollections().toArray();
            healthCheck.database.collections = collections.length;

            // Get server status for performance metrics
            const serverStatus = await admin.serverStatus();
            healthCheck.performance.memoryUsage = {
                resident: serverStatus.mem?.resident || 0,
                virtual: serverStatus.mem?.virtual || 0,
                mapped: serverStatus.mem?.mapped || 0
            };
            healthCheck.performance.activeConnections = serverStatus.connections?.current || 0;

            // Calculate response time
            healthCheck.performance.responseTime = Date.now() - startTime;

            console.log('✅ Database health check completed successfully');
        } else {
            healthCheck.errors.push('Database is not connected');
            console.warn('⚠️  Database health check: Not connected');
        }

    } catch (error) {
        healthCheck.errors.push(error.message);
        console.error('❌ Database health check failed:', error.message);
    }

    return healthCheck;
};

/**
 * Monitor database connection continuously
 * @param {number} interval - Check interval in milliseconds (default: 30 seconds)
 */
const startHealthMonitoring = (interval = 30000) => {
    console.log(`🔍 Starting database health monitoring (interval: ${interval}ms)`);
    
    const monitor = setInterval(async () => {
        const health = await performHealthCheck();
        
        if (!health.database.connected) {
            console.warn('⚠️  Database connection lost!');
        } else if (health.performance.responseTime > 1000) {
            console.warn(`⚠️  Slow database response: ${health.performance.responseTime}ms`);
        }
        
        if (health.errors.length > 0) {
            console.error('❌ Database health issues:', health.errors);
        }
    }, interval);

    // Stop monitoring on process termination
    process.on('SIGINT', () => {
        clearInterval(monitor);
        console.log('🔒 Database health monitoring stopped');
    });

    process.on('SIGTERM', () => {
        clearInterval(monitor);
        console.log('🔒 Database health monitoring stopped');
    });

    return monitor;
};

/**
 * Test database operations (CRUD)
 * @returns {Object} Test results
 */
const testDatabaseOperations = async () => {
    const testResults = {
        timestamp: new Date().toISOString(),
        tests: {
            create: { success: false, time: null, error: null },
            read: { success: false, time: null, error: null },
            update: { success: false, time: null, error: null },
            delete: { success: false, time: null, error: null }
        },
        overall: { success: false, totalTime: null }
    };

    const startTime = Date.now();

    try {
        // Create a test collection for operations
        const TestModel = mongoose.model('HealthTest', new mongoose.Schema({
            testId: String,
            timestamp: Date,
            data: String
        }));

        const testId = `health_test_${Date.now()}`;

        // Test CREATE operation
        try {
            const createStart = Date.now();
            const testDoc = new TestModel({
                testId,
                timestamp: new Date(),
                data: 'Health check test data'
            });
            await testDoc.save();
            testResults.tests.create.success = true;
            testResults.tests.create.time = Date.now() - createStart;
        } catch (error) {
            testResults.tests.create.error = error.message;
        }

        // Test READ operation
        try {
            const readStart = Date.now();
            const foundDoc = await TestModel.findOne({ testId });
            if (foundDoc) {
                testResults.tests.read.success = true;
                testResults.tests.read.time = Date.now() - readStart;
            }
        } catch (error) {
            testResults.tests.read.error = error.message;
        }

        // Test UPDATE operation
        try {
            const updateStart = Date.now();
            await TestModel.updateOne(
                { testId },
                { data: 'Updated health check test data' }
            );
            testResults.tests.update.success = true;
            testResults.tests.update.time = Date.now() - updateStart;
        } catch (error) {
            testResults.tests.update.error = error.message;
        }

        // Test DELETE operation
        try {
            const deleteStart = Date.now();
            await TestModel.deleteOne({ testId });
            testResults.tests.delete.success = true;
            testResults.tests.delete.time = Date.now() - deleteStart;
        } catch (error) {
            testResults.tests.delete.error = error.message;
        }

        // Calculate overall results
        const successfulTests = Object.values(testResults.tests).filter(test => test.success).length;
        testResults.overall.success = successfulTests === 4;
        testResults.overall.totalTime = Date.now() - startTime;

        if (testResults.overall.success) {
            console.log('✅ All database operations test passed');
        } else {
            console.warn('⚠️  Some database operations failed');
        }

    } catch (error) {
        console.error('❌ Database operations test failed:', error.message);
        testResults.overall.error = error.message;
    }

    return testResults;
};

/**
 * Get database statistics
 * @returns {Object} Database statistics
 */
const getDatabaseStats = async () => {
    const stats = {
        timestamp: new Date().toISOString(),
        connection: null,
        collections: [],
        indexes: 0,
        totalSize: 0,
        errors: []
    };

    try {
        const connection = mongoose.connection;
        
        if (connection.readyState !== 1) {
            stats.errors.push('Database not connected');
            return stats;
        }

        stats.connection = {
            host: connection.host,
            port: connection.port,
            name: connection.name,
            readyState: connection.readyState
        };

        // Get database statistics
        const dbStats = await connection.db.stats();
        stats.totalSize = dbStats.dataSize || 0;

        // Get collection information
        const collections = await connection.db.listCollections().toArray();
        
        for (const collection of collections) {
            try {
                const collectionStats = await connection.db.collection(collection.name).stats();
                const indexInfo = await connection.db.collection(collection.name).indexes();
                
                stats.collections.push({
                    name: collection.name,
                    documents: collectionStats.count || 0,
                    size: collectionStats.size || 0,
                    indexes: indexInfo.length || 0
                });
                
                stats.indexes += indexInfo.length || 0;
            } catch (error) {
                stats.errors.push(`Error getting stats for collection ${collection.name}: ${error.message}`);
            }
        }

        console.log('📊 Database statistics retrieved successfully');

    } catch (error) {
        stats.errors.push(error.message);
        console.error('❌ Failed to get database statistics:', error.message);
    }

    return stats;
};

module.exports = {
    performHealthCheck,
    startHealthMonitoring,
    testDatabaseOperations,
    getDatabaseStats
};