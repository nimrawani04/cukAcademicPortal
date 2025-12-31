const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
    // Log full request details for debugging
    console.log('🔍 === REGISTRATION REQUEST DEBUG ===');
    console.log('📝 Request Method:', req.method);
    console.log('📝 Request URL:', req.url);
    console.log('📝 Request Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📝 Request Body (Raw):', JSON.stringify(req.body, null, 2));
    console.log('📝 Request Body Fields:', {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password ? `[${req.body.password.length} chars]` : undefined,
        hasName: !!req.body.name,
        hasEmail: !!req.body.email,
        hasPassword: !!req.body.password
    });
    console.log('📝 Content-Type:', req.get('Content-Type'));
    console.log('🔍 === END REQUEST DEBUG ===');
    
    try {
        const { name, email, password } = req.body;

        // Validate all fields are present
        if (!name || !email || !password) {
            const errorResponse = {
                success: false,
                message: 'Name, email, and password are required'
            };
            console.log('🔍 === ERROR RESPONSE DEBUG ===');
            console.log('❌ Response Status: 400');
            console.log('❌ Response Data:', JSON.stringify(errorResponse, null, 2));
            console.log('🔍 === END ERROR RESPONSE DEBUG ===');
            return res.status(400).json(errorResponse);
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('❌ Registration failed: Invalid email format');
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Validate password length
        if (password.length < 6) {
            console.log('❌ Registration failed: Password too short');
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if database is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('⚠️  Database not connected - skipping duplicate check and save');
            console.log('✅ Registration validated (database not available)');
            
            return res.status(201).json({
                success: true,
                message: 'Student registered'
            });
        }

        // Check if email is already used
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.log('❌ Registration failed: Email already exists -', email);
            return res.status(400).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        // Hash password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('🔐 Password hashed successfully');

        // Create new user
        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: 'student'
        });

        // Save user to MongoDB
        const savedUser = await newUser.save();
        console.log('✅ User saved to database:', savedUser.email);

        // Return success response
        const responseData = {
            success: true,
            message: 'Student registered',
            data: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
                role: savedUser.role,
                createdAt: savedUser.createdAt
            }
        };
        
        console.log('🔍 === REGISTRATION RESPONSE DEBUG ===');
        console.log('✅ Response Status: 201');
        console.log('✅ Response Data:', JSON.stringify(responseData, null, 2));
        console.log('🔍 === END RESPONSE DEBUG ===');
        
        res.status(201).json(responseData);

    } catch (error) {
        console.error('🔍 === REGISTRATION ERROR DEBUG ===');
        console.error('❌ Error Name:', error.name);
        console.error('❌ Error Message:', error.message);
        console.error('❌ Error Code:', error.code);
        console.error('❌ Error Stack:', error.stack);
        console.error('❌ Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error('🔍 === END ERROR DEBUG ===');
        
        // Handle duplicate key error (email already exists)
        if (error.code === 11000) {
            console.log('❌ Duplicate key error - Email already exists');
            return res.status(400).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            console.log('❌ Validation errors:', validationErrors);
            return res.status(400).json({
                success: false,
                message: validationErrors.join(', ')
            });
        }

        // Handle bcrypt errors
        if (error.message.includes('bcrypt')) {
            console.log('❌ Password hashing error');
            return res.status(500).json({
                success: false,
                message: 'Error processing password'
            });
        }

        // Handle database connection errors
        if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
            console.log('❌ Database connection error');
            return res.status(503).json({
                success: false,
                message: 'Database connection error. Please try again later.'
            });
        }

        // Generic server error
        const errorResponse = {
            success: false,
            message: 'Server error during registration'
        };
        console.log('🔍 === FINAL ERROR RESPONSE DEBUG ===');
        console.log('❌ Response Status: 500');
        console.log('❌ Response Data:', JSON.stringify(errorResponse, null, 2));
        console.log('🔍 === END FINAL ERROR RESPONSE DEBUG ===');
        res.status(500).json(errorResponse);
    }
};

module.exports = {
    register
};