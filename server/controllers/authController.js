const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const FacultyProfile = require('../models/FacultyProfile');
const StudentProfile = require('../models/StudentProfile');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
    console.log('🔍 === REGISTRATION REQUEST DEBUG ===');
    console.log('📝 Request Body:', JSON.stringify(req.body, null, 2));
    
    try {
        const { 
            name, 
            email, 
            password, 
            role, 
            // Faculty specific fields
            department,
            designation,
            // Student specific fields
            course,
            semester,
            enrollmentYear
        } = req.body;

        // Validate all required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, password, and role are required'
            });
        }

        // Validate role
        if (!['student', 'faculty'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role must be either student or faculty'
            });
        }

        // Validate role-specific fields
        if (role === 'faculty') {
            if (!department || !designation) {
                return res.status(400).json({
                    success: false,
                    message: 'Department and designation are required for faculty registration'
                });
            }
        } else if (role === 'student') {
            if (!course || !semester) {
                return res.status(400).json({
                    success: false,
                    message: 'Course and semester are required for student registration'
                });
            }
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if database is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('⚠️  Database not connected - registration validated but not saved');
            return res.status(201).json({
                success: true,
                message: `${role === 'faculty' ? 'Faculty' : 'Student'} registration validated (database not available)`
            });
        }

        // Check if email is already used
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        // Create new user
        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: password,
            role: role,
            status: 'pending' // All registrations start as pending
        });

        // Save user to MongoDB
        const savedUser = await newUser.save();
        console.log('✅ User saved to database:', savedUser.email, 'with role:', savedUser.role);

        // Create role-specific profile
        let profile = null;
        
        if (role === 'faculty') {
            profile = new FacultyProfile({
                userId: savedUser._id,
                department: department,
                designation: designation,
                joiningDate: new Date(),
                subjects: [],
                assignedStudents: []
            });
            await profile.save();
            console.log('✅ Faculty profile created for:', savedUser.email);
        } else if (role === 'student') {
            profile = new StudentProfile({
                userId: savedUser._id,
                course: course,
                semester: parseInt(semester),
                department: department || 'Computer Science and Engineering',
                enrollmentYear: enrollmentYear || new Date().getFullYear(),
                selectedCourses: []
            });
            await profile.save();
            console.log('✅ Student profile created for:', savedUser.email);
        }

        // Return success response
        const responseData = {
            success: true,
            message: `${role === 'faculty' ? 'Faculty' : 'Student'} registered successfully. Your registration is pending approval.`,
            data: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
                role: savedUser.role,
                status: savedUser.status,
                createdAt: savedUser.createdAt
            }
        };
        
        console.log('✅ Registration successful for:', savedUser.email);
        res.status(201).json(responseData);

    } catch (error) {
        console.error('❌ Registration error:', error);
        
        // Handle duplicate key error (email already exists)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: validationErrors.join(', ')
            });
        }

        // Handle database connection errors
        if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
            return res.status(503).json({
                success: false,
                message: 'Database connection error. Please try again later.'
            });
        }

        // Generic server error
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

/**
 * Login a user
 * POST /api/auth/login
 */
const login = async (req, res) => {
    console.log('🔍 === LOGIN REQUEST DEBUG ===');
    console.log('📝 Request Body:', JSON.stringify(req.body, null, 2));
    
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Check if database is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('⚠️  Database not connected - using fallback authentication');
            
            // Fallback authentication with hardcoded users (for testing when DB is not available)
            const fallbackUsers = [
                { email: 'demo@student.com', password: 'demo123', name: 'Demo Student', role: 'student' },
                { email: 'test@student.com', password: 'test123', name: 'Test Student', role: 'student' },
                { email: 'john@student.com', password: 'student123', name: 'John Student', role: 'student' },
                { email: 'demo@faculty.com', password: 'demo123', name: 'Demo Faculty', role: 'faculty' },
                { email: 'admin@cuk.com', password: 'admin123', name: 'Admin User', role: 'admin' }
            ];
            
            const user = fallbackUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            
            // Generate JWT token
            const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
            const token = jwt.sign(
                { 
                    userId: 'fallback_' + Date.now(), 
                    email: user.email, 
                    role: user.role 
                },
                jwtSecret,
                { expiresIn: '24h' }
            );

            console.log('✅ Fallback login successful for:', user.email);

            return res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    token: token,
                    user: {
                        id: 'fallback_' + Date.now(),
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        status: 'approved'
                    }
                }
            });
        }

        // Normal database authentication
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is approved
        if (user.status !== 'approved') {
            return res.status(401).json({
                success: false,
                message: `Your account is ${user.status}. Please contact the administrator.`
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email, 
                role: user.role 
            },
            jwtSecret,
            { expiresIn: '24h' }
        );

        console.log('✅ Login successful for:', user.email);

        // Get user profile
        let profile = null;
        if (user.role === 'faculty') {
            profile = await FacultyProfile.findOne({ userId: user._id });
        } else if (user.role === 'student') {
            profile = await StudentProfile.findOne({ userId: user._id });
        }

        // Return success response
        const responseData = {
            success: true,
            message: 'Login successful',
            data: {
                token: token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    lastLogin: user.lastLogin,
                    profile: profile ? {
                        id: profile._id,
                        ...(user.role === 'faculty' ? {
                            facultyId: profile.facultyId,
                            department: profile.department,
                            designation: profile.designation
                        } : {
                            rollNumber: profile.rollNumber,
                            course: profile.course,
                            semester: profile.semester,
                            cgpa: profile.cgpa
                        })
                    } : null
                }
            }
        };
        
        res.status(200).json(responseData);

    } catch (error) {
        console.error('❌ Login error:', error);
        
        // Handle specific errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(500).json({
                success: false,
                message: 'Authentication token generation failed'
            });
        }

        // Handle database connection errors
        if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
            return res.status(503).json({
                success: false,
                message: 'Database connection error. Please try again later.'
            });
        }

        // Generic server error
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

module.exports = {
    register,
    login
};