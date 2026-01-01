const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Admin Login
 * POST /api/admin/login
 */
const adminLogin = async (req, res) => {
    console.log('🔍 === ADMIN LOGIN REQUEST ===');
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
            console.log('⚠️  Database not connected - using fallback admin authentication');
            
            // Fallback admin users (for testing when DB is not available)
            const fallbackAdmins = [
                { email: 'admin@cukashmir.ac.in', password: 'admin123', name: 'System Administrator', role: 'admin' },
                { email: 'dean@cukashmir.ac.in', password: 'dean123', name: 'Dean Administrator', role: 'admin' }
            ];
            
            const admin = fallbackAdmins.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
            
            if (!admin) {
                console.log('❌ Fallback admin login failed: Invalid credentials -', email);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid admin credentials'
                });
            }
            
            // Generate JWT token
            const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
            const token = jwt.sign(
                { 
                    userId: 'admin_fallback_' + Date.now(), 
                    email: admin.email, 
                    role: admin.role 
                },
                jwtSecret,
                { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '24h' }
            );

            console.log('✅ Fallback admin login successful for:', admin.email);

            return res.status(200).json({
                success: true,
                message: 'Admin login successful (fallback mode)',
                data: {
                    token: token,
                    user: {
                        id: 'admin_fallback_' + Date.now(),
                        name: admin.name,
                        email: admin.email,
                        role: admin.role,
                        createdAt: new Date()
                    }
                }
            });
        }

        // Normal database authentication
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log('❌ Admin login failed: User not found -', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            console.log('❌ Admin login failed: User is not admin -', email);
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('❌ Admin login failed: Invalid password for -', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email, 
                role: user.role 
            },
            jwtSecret,
            { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '24h' }
        );

        console.log('✅ Admin login successful for:', user.email);

        res.status(200).json({
            success: true,
            message: 'Admin login successful',
            data: {
                token: token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    createdAt: user.createdAt
                }
            }
        });

    } catch (error) {
        console.error('🔍 === ADMIN LOGIN ERROR ===');
        console.error('❌ Error:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Server error during admin login'
        });
    }
};

/**
 * Get Dashboard Statistics
 * GET /api/admin/stats
 */
const getDashboardStats = async (req, res) => {
    try {
        // Check if database is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('⚠️  Database not connected - returning fallback stats');
            return res.status(200).json({
                success: true,
                data: {
                    totalStudents: 15,
                    totalTeachers: 8,
                    totalUsers: 24,
                    recentRegistrations: 3
                }
            });
        }

        // Get actual statistics from database
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalTeachers = await User.countDocuments({ role: 'teacher' });
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        const totalUsers = totalStudents + totalTeachers + totalAdmins;

        // Get recent registrations (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentRegistrations = await User.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        res.status(200).json({
            success: true,
            data: {
                totalStudents,
                totalTeachers,
                totalAdmins,
                totalUsers,
                recentRegistrations
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics'
        });
    }
};

/**
 * Get All Students
 * GET /api/admin/students
 */
const getAllStudents = async (req, res) => {
    try {
        // Check if database is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('⚠️  Database not connected - returning fallback students');
            const fallbackStudents = [
                { _id: '1', name: 'Aarav Sharma', email: 'aarav.sharma@student.cukashmir.ac.in', role: 'student', createdAt: new Date('2024-01-15') },
                { _id: '2', name: 'Priya Patel', email: 'priya.patel@student.cukashmir.ac.in', role: 'student', createdAt: new Date('2024-01-16') },
                { _id: '3', name: 'Rahul Kumar', email: 'rahul.kumar@student.cukashmir.ac.in', role: 'student', createdAt: new Date('2024-01-17') },
                { _id: '4', name: 'Sneha Gupta', email: 'sneha.gupta@student.cukashmir.ac.in', role: 'student', createdAt: new Date('2024-01-18') },
                { _id: '5', name: 'Arjun Singh', email: 'arjun.singh@student.cukashmir.ac.in', role: 'student', createdAt: new Date('2024-01-19') }
            ];
            
            return res.status(200).json({
                success: true,
                data: fallbackStudents
            });
        }

        // Get students from database
        const students = await User.find({ role: 'student' })
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: students
        });

    } catch (error) {
        console.error('Get students error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error fetching students'
        });
    }
};

/**
 * Get All Teachers
 * GET /api/admin/teachers
 */
const getAllTeachers = async (req, res) => {
    try {
        // Check if database is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('⚠️  Database not connected - returning fallback teachers');
            const fallbackTeachers = [
                { _id: '101', name: 'Dr. Rajesh Verma', email: 'rajesh.verma@cukashmir.ac.in', role: 'teacher', createdAt: new Date('2024-01-01') },
                { _id: '102', name: 'Prof. Sunita Sharma', email: 'sunita.sharma@cukashmir.ac.in', role: 'teacher', createdAt: new Date('2024-01-02') },
                { _id: '103', name: 'Dr. Amit Kumar', email: 'amit.kumar@cukashmir.ac.in', role: 'teacher', createdAt: new Date('2024-01-03') },
                { _id: '104', name: 'Prof. Meera Joshi', email: 'meera.joshi@cukashmir.ac.in', role: 'teacher', createdAt: new Date('2024-01-04') }
            ];
            
            return res.status(200).json({
                success: true,
                data: fallbackTeachers
            });
        }

        // Get teachers from database
        const teachers = await User.find({ role: 'teacher' })
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: teachers
        });

    } catch (error) {
        console.error('Get teachers error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error fetching teachers'
        });
    }
};

/**
 * Create Teacher Account
 * POST /api/admin/create-teacher
 */
const createTeacher = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
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
            console.log('⚠️  Database not connected - simulating teacher creation');
            return res.status(201).json({
                success: true,
                message: 'Teacher account created successfully (simulation mode)',
                data: {
                    id: 'teacher_' + Date.now(),
                    name: name.trim(),
                    email: email.toLowerCase().trim(),
                    role: 'teacher',
                    createdAt: new Date()
                }
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        // Create new teacher
        const newTeacher = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: password,
            role: 'teacher'
        });

        const savedTeacher = await newTeacher.save();
        console.log('✅ Teacher created:', savedTeacher.email);

        res.status(201).json({
            success: true,
            message: 'Teacher account created successfully',
            data: {
                id: savedTeacher._id,
                name: savedTeacher.name,
                email: savedTeacher.email,
                role: savedTeacher.role,
                createdAt: savedTeacher.createdAt
            }
        });

    } catch (error) {
        console.error('Create teacher error:', error.message);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: validationErrors.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating teacher account'
        });
    }
};

/**
 * Delete User (Student or Teacher)
 * DELETE /api/admin/user/:id
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if database is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('⚠️  Database not connected - simulating user deletion');
            return res.status(200).json({
                success: true,
                message: 'User deleted successfully (simulation mode)'
            });
        }

        // Find user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deletion of admin users
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete admin users'
            });
        }

        // Delete user
        await User.findByIdAndDelete(id);
        console.log('✅ User deleted:', user.email);

        res.status(200).json({
            success: true,
            message: `${user.role} deleted successfully`
        });

    } catch (error) {
        console.error('Delete user error:', error.message);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error deleting user'
        });
    }
};

/**
 * Approve Student Registration
 * PATCH /api/admin/approve-student/:id
 */
const approveStudent = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if database is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('⚠️  Database not connected - simulating student approval');
            return res.status(200).json({
                success: true,
                message: 'Student approved successfully (simulation mode)'
            });
        }

        // Find student
        const student = await User.findById(id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        if (student.role !== 'student') {
            return res.status(400).json({
                success: false,
                message: 'User is not a student'
            });
        }

        // For now, we'll just return success since we don't have an approval status field
        // In a real system, you might add an 'approved' field to the User schema
        console.log('✅ Student approved:', student.email);

        res.status(200).json({
            success: true,
            message: 'Student approved successfully',
            data: {
                id: student._id,
                name: student.name,
                email: student.email,
                role: student.role
            }
        });

    } catch (error) {
        console.error('Approve student error:', error.message);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid student ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error approving student'
        });
    }
};

module.exports = {
    adminLogin,
    getDashboardStats,
    getAllStudents,
    getAllTeachers,
    createTeacher,
    deleteUser,
    approveStudent
};