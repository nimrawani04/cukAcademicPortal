/**
 * Script to create an admin user for testing
 * Run this script to create the first admin account
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./server/models/User');

// Connect to database
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        return false;
    }
};

// Create admin user
const createAdminUser = async () => {
    try {
        console.log('🔍 === CREATING ADMIN USER ===');
        
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@cukashmir.ac.in' });
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists:', existingAdmin.email);
            console.log('📝 Admin Details:');
            console.log('   Name:', existingAdmin.name);
            console.log('   Email:', existingAdmin.email);
            console.log('   Role:', existingAdmin.role);
            console.log('   Created:', existingAdmin.createdAt);
            return;
        }
        
        // Create new admin user
        const adminUser = new User({
            name: 'System Administrator',
            email: 'admin@cukashmir.ac.in',
            password: 'admin123', // Will be hashed by the User model
            role: 'admin'
        });
        
        const savedAdmin = await adminUser.save();
        console.log('✅ Admin user created successfully!');
        console.log('📝 Admin Login Credentials:');
        console.log('   Email: admin@cukashmir.ac.in');
        console.log('   Password: admin123');
        console.log('   Role: admin');
        console.log('   ID:', savedAdmin._id);
        
        // Create additional admin for testing
        const existingDean = await User.findOne({ email: 'dean@cukashmir.ac.in' });
        if (!existingDean) {
            const deanUser = new User({
                name: 'Dean Administrator',
                email: 'dean@cukashmir.ac.in',
                password: 'dean123',
                role: 'admin'
            });
            
            await deanUser.save();
            console.log('✅ Dean admin user created successfully!');
            console.log('📝 Dean Login Credentials:');
            console.log('   Email: dean@cukashmir.ac.in');
            console.log('   Password: dean123');
        }
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        
        if (error.code === 11000) {
            console.log('⚠️  Admin user already exists (duplicate key error)');
        } else if (error.name === 'ValidationError') {
            console.log('❌ Validation errors:', Object.values(error.errors).map(err => err.message));
        }
    }
};

// Main function
const main = async () => {
    console.log('🚀 Starting admin user creation...');
    
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
        console.log('❌ Cannot create admin user without database connection');
        process.exit(1);
    }
    
    // Create admin user
    await createAdminUser();
    
    // Close database connection
    await mongoose.connection.close();
    console.log('🔍 === ADMIN USER CREATION COMPLETE ===');
    process.exit(0);
};

// Run the script
main().catch(error => {
    console.error('❌ Script error:', error);
    process.exit(1);
});