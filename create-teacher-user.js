/**
 * Script to create a teacher user for testing
 */

const mongoose = require('mongoose');
require('dotenv').config();

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

// Create teacher user
const createTeacherUser = async () => {
    try {
        console.log('🔍 === CREATING TEACHER USER ===');
        
        // Check if teacher already exists
        const existingTeacher = await User.findOne({ email: 'teacher@cukashmir.ac.in' });
        if (existingTeacher) {
            console.log('⚠️  Teacher user already exists:', existingTeacher.email);
            console.log('📝 Teacher Details:');
            console.log('   Name:', existingTeacher.name);
            console.log('   Email:', existingTeacher.email);
            console.log('   Role:', existingTeacher.role);
            console.log('   Created:', existingTeacher.createdAt);
            return;
        }
        
        // Create new teacher user
        const teacherUser = new User({
            name: 'Dr. John Smith',
            email: 'teacher@cukashmir.ac.in',
            password: 'teacher123', // Will be hashed by the User model
            role: 'teacher'
        });
        
        const savedTeacher = await teacherUser.save();
        console.log('✅ Teacher user created successfully!');
        console.log('📝 Teacher Login Credentials:');
        console.log('   Email: teacher@cukashmir.ac.in');
        console.log('   Password: teacher123');
        console.log('   Role: teacher');
        console.log('   ID:', savedTeacher._id);
        
    } catch (error) {
        console.error('❌ Error creating teacher user:', error.message);
        
        if (error.code === 11000) {
            console.log('⚠️  Teacher user already exists (duplicate key error)');
        } else if (error.name === 'ValidationError') {
            console.log('❌ Validation errors:', Object.values(error.errors).map(err => err.message));
        }
    }
};

// Main function
const main = async () => {
    console.log('🚀 Starting teacher user creation...');
    
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
        console.log('❌ Cannot create teacher user without database connection');
        process.exit(1);
    }
    
    // Create teacher user
    await createTeacherUser();
    
    // Close database connection
    await mongoose.connection.close();
    console.log('🔍 === TEACHER USER CREATION COMPLETE ===');
    process.exit(0);
};

// Run the script
main().catch(error => {
    console.error('❌ Script error:', error);
    process.exit(1);
});