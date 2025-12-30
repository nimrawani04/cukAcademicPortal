// Database configuration file
const mongoose = require('mongoose');

/**
 * MongoDB connection configuration options
 * These options ensure optimal connection behavior
 */
const connectionOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4, // Use IPv4, skip trying IPv6
    bufferCommands: false, // Disable mongoose buffering
    bufferMaxEntries: 0 // Disable mongoose buffering
};

/**
 * Connect to MongoDB database
 * This function handles the database connection with comprehensive error handling
 */
const connectDB = async () => {
    try {
        // Check if MongoDB URI is provided
        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI environment variable is not defined');
            console.error('Please set MONGODB_URI in your .env file');
            process.exit(1);
        }

        console.log('🔄 Connecting to MongoDB...');
        console.log(`📍 Database URI: ${process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs

        // Connect to MongoDB using the connection string from environment variables
        const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);

        // Success logging
        console.log('✅ MongoDB Connected Successfully!');
        console.log(`📊 Database Host: ${conn.connection.host}`);
        console.log(`🏷️  Database Name: ${conn.connection.name}`);
        console.log(`🔌 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
        console.log(`⚡ MongoDB Version: ${conn.connection.db.serverConfig?.s?.serverDescription?.version || 'Unknown'}`);

        // Set up connection event listeners for monitoring
        setupConnectionListeners();

    } catch (error) {
        console.error('❌ Database connection failed!');
        console.error('🔍 Error Details:', {
            message: error.message,
            code: error.code,
            name: error.name
        });

        // Provide helpful error messages based on common issues
        if (error.message.includes('ENOTFOUND')) {
            console.error('💡 Suggestion: Check your MongoDB URI and internet connection');
        } else if (error.message.includes('authentication failed')) {
            console.error('💡 Suggestion: Verify your MongoDB username and password');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.error('💡 Suggestion: Make sure MongoDB is running on the specified port');
        } else if (error.message.includes('timeout')) {
            console.error('💡 Suggestion: Check your network connection or MongoDB server status');
        }

        // Exit the process if database connection fails
        console.error('🚫 Exiting application due to database connection failure...');
        process.exit(1);
    }
};

/**
 * Set up MongoDB connection event listeners
 * These listeners help monitor the connection status
 */
const setupConnectionListeners = () => {
    const connection = mongoose.connection;

    // Connection events
    connection.on('connected', () => {
        console.log('🔗 Mongoose connected to MongoDB');
    });

    connection.on('error', (error) => {
        console.error('❌ Mongoose connection error:', error.message);
    });

    connection.on('disconnected', () => {
        console.warn('⚠️  Mongoose disconnected from MongoDB');
    });

    connection.on('reconnected', () => {
        console.log('🔄 Mongoose reconnected to MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
        try {
            await connection.close();
            console.log('🔒 MongoDB connection closed through app termination');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error closing MongoDB connection:', error.message);
            process.exit(1);
        }
    });

    // Handle process termination
    process.on('SIGTERM', async () => {
        try {
            await connection.close();
            console.log('🔒 MongoDB connection closed through process termination');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error closing MongoDB connection:', error.message);
            process.exit(1);
        }
    });
};

/**
 * Check database connection status
 * @returns {boolean} True if connected, false otherwise
 */
const isConnected = () => {
    return mongoose.connection.readyState === 1;
};

/**
 * Get database connection info
 * @returns {Object} Connection information
 */
const getConnectionInfo = () => {
    const connection = mongoose.connection;
    return {
        isConnected: connection.readyState === 1,
        host: connection.host,
        port: connection.port,
        name: connection.name,
        readyState: connection.readyState,
        readyStateText: {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        }[connection.readyState]
    };
};

/**
 * Gracefully close database connection
 */
const closeConnection = async () => {
    try {
        await mongoose.connection.close();
        console.log('🔒 MongoDB connection closed gracefully');
    } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error.message);
        throw error;
    }
};

module.exports = {
    connectDB,
    isConnected,
    getConnectionInfo,
    closeConnection
};