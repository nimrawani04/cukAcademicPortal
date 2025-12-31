const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * @returns {Promise} Promise that resolves when connected
 */
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }
        
        if (mongoUri.includes('<') || mongoUri.includes('>')) {
            throw new Error('MONGODB_URI contains placeholder values. Please replace with actual connection string');
        }
        
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        });
        
        console.log(`MongoDB connected: ${conn.connection.host}`);
        
        return conn;
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        throw error;
    }
};

module.exports = connectDB;