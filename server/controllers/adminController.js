const User = require('../models/User');
const FacultyProfile = require('../models/FacultyProfile');
const StudentProfile = require('../models/StudentProfile');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Notice = require('../models/Notice');
const Resource = require('../models/Resource');
const Leave = require('../models/Leave');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Admin login
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin user
        const admin = await User.findOne({ email, role: 'admin' });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }

        // Check password
        const isValidPassword = await admin.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }

        // Check if admin is approved
        if (admin.status !== 'approved') {
            return res.status(401).json({
                success: false,
                message: 'Admin account is not approved'
            });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: admin._id, 
                email: admin.email, 
                role: admin.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Admin login successful',
            data: {
                token,
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role
                }
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Admin login failed',
            error: error.message
        });
    }
};

// Get pending registrations
const getPendingRegistrations = async (req, res) => {
    try {
        const pendingUsers = await User.find({ status: 'pending' })
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: pendingUsers
        });
    } catch (error) {
        console.error('Get pending registrations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending registrations',
            error: error.message
        });
    }
};

// Update user status (approve/reject)
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be approved or rejected'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.status = status;
        if (status === 'approved') {
            user.approvedBy = req.user.userId;
            user.approvedAt = new Date();
        } else {
            user.rejectedAt = new Date();
            user.rejectionReason = reason;
        }

        await user.save();

        res.json({
            success: true,
            message: `User ${status} successfully`,
            data: user
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
            error: error.message
        });
    }
};

// Create user manually
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, ...profileData } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create user
        const user = new User({
            name,
            email,
            password,
            role,
            status: 'approved', // Admin-created users are auto-approved
            approvedBy: req.user.id,
            approvedAt: new Date()
        });

        await user.save();

        // Create profile based on role
        if (role === 'faculty') {
            const facultyProfile = new FacultyProfile({
                userId: user._id,
                ...profileData
            });
            await facultyProfile.save();
        } else if (role === 'student') {
            const studentProfile = new StudentProfile({
                userId: user._id,
                ...profileData
            });
            await studentProfile.save();
        }

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { userId: user._id, email: user.email }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: error.message
        });
    }
};

// Admin Dashboard - Get overview statistics
const getDashboardStats = async (req, res) => {
    try {
        const stats = {
            users: {
                total: await User.countDocuments(),
                pending: await User.countDocuments({ status: 'pending' }),
                approved: await User.countDocuments({ status: 'approved' }),
                students: await User.countDocuments({ role: 'student' }),
                faculty: await User.countDocuments({ role: 'faculty' })
            },
            registrations: {
                pendingStudents: await User.countDocuments({ role: 'student', status: 'pending' }),
                pendingFaculty: await User.countDocuments({ role: 'faculty', status: 'pending' })
            },
            leaves: {
                pending: await Leave.countDocuments({ status: 'pending' }),
                approved: await Leave.countDocuments({ status: 'approved' }),
                rejected: await Leave.countDocuments({ status: 'rejected' })
            },
            notices: {
                active: await Notice.countDocuments({ isActive: true }),
                total: await Notice.countDocuments()
            },
            resources: {
                total: await Resource.countDocuments({ isActive: true })
            }
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: error.message
        });
    }
};

// USER MANAGEMENT

// Get all users with filters
const getAllUsers = async (req, res) => {
    try {
        const { role, status, page = 1, limit = 20, search } = req.query;
        
        const query = {};
        if (role) query.role = role;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('approvedBy', 'name email');

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};

// Approve user registration
const approveUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { comments } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.status = 'approved';
        user.approvedBy = req.user.userId;
        user.approvedAt = new Date();
        await user.save();

        res.json({
            success: true,
            message: 'User approved successfully',
            data: user
        });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve user',
            error: error.message
        });
    }
};

// Reject user registration
const rejectUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.status = 'rejected';
        user.rejectedAt = new Date();
        user.rejectionReason = reason;
        await user.save();

        res.json({
            success: true,
            message: 'User rejected successfully',
            data: user
        });
    } catch (error) {
        console.error('Reject user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject user',
            error: error.message
        });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete associated profile
        if (user.role === 'faculty') {
            await FacultyProfile.findOneAndDelete({ userId });
        } else if (user.role === 'student') {
            await StudentProfile.findOneAndDelete({ userId });
            // Also delete related academic records
            await Attendance.deleteMany({ studentId: userId });
            await Marks.deleteMany({ studentId: userId });
        }

        // Delete user
        await User.findByIdAndDelete(userId);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
};

// Add user manually
const addUser = async (req, res) => {
    try {
        const { name, email, password, role, ...profileData } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create user
        const user = new User({
            name,
            email,
            password,
            role,
            status: 'approved', // Admin-created users are auto-approved
            approvedBy: req.user.id,
            approvedAt: new Date()
        });

        await user.save();

        // Create profile based on role
        if (role === 'faculty') {
            const facultyProfile = new FacultyProfile({
                userId: user._id,
                ...profileData
            });
            await facultyProfile.save();
        } else if (role === 'student') {
            const studentProfile = new StudentProfile({
                userId: user._id,
                ...profileData
            });
            await studentProfile.save();
        }

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { userId: user._id, email: user.email }
        });
    } catch (error) {
        console.error('Add user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: error.message
        });
    }
};

// FACULTY MANAGEMENT

// Get all faculty with their profiles
const getAllFaculty = async (req, res) => {
    try {
        const { department, designation, page = 1, limit = 20 } = req.query;
        
        const query = { role: 'faculty' };
        const profileQuery = {};
        
        if (department) profileQuery.department = department;
        if (designation) profileQuery.designation = designation;

        const faculty = await User.find(query)
            .select('-password')
            .populate({
                path: 'userId',
                match: profileQuery,
                model: 'FacultyProfile'
            })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Filter out faculty without matching profiles
        const filteredFaculty = faculty.filter(f => f.userId);

        res.json({
            success: true,
            data: filteredFaculty
        });
    } catch (error) {
        console.error('Get faculty error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch faculty',
            error: error.message
        });
    }
};

// Update faculty profile
const updateFacultyProfile = async (req, res) => {
    try {
        const { facultyId } = req.params;
        const updateData = req.body;

        const facultyProfile = await FacultyProfile.findByIdAndUpdate(
            facultyId,
            updateData,
            { new: true, runValidators: true }
        ).populate('userId', 'name email');

        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        res.json({
            success: true,
            message: 'Faculty profile updated successfully',
            data: facultyProfile
        });
    } catch (error) {
        console.error('Update faculty error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update faculty profile',
            error: error.message
        });
    }
};

// STUDENT MANAGEMENT

// Get all students with their profiles
const getAllStudents = async (req, res) => {
    try {
        const { course, semester, department, page = 1, limit = 20 } = req.query;
        
        const query = { role: 'student' };
        const profileQuery = {};
        
        if (course) profileQuery.course = course;
        if (semester) profileQuery.semester = parseInt(semester);
        if (department) profileQuery.department = department;

        const students = await User.find(query)
            .select('-password')
            .populate({
                path: 'userId',
                match: profileQuery,
                model: 'StudentProfile'
            })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Filter out students without matching profiles
        const filteredStudents = students.filter(s => s.userId);

        res.json({
            success: true,
            data: filteredStudents
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch students',
            error: error.message
        });
    }
};

// Update student profile
const updateStudentProfile = async (req, res) => {
    try {
        const { studentId } = req.params;
        const updateData = req.body;

        const studentProfile = await StudentProfile.findByIdAndUpdate(
            studentId,
            updateData,
            { new: true, runValidators: true }
        ).populate('userId', 'name email');

        if (!studentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        res.json({
            success: true,
            message: 'Student profile updated successfully',
            data: studentProfile
        });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update student profile',
            error: error.message
        });
    }
};

// ACADEMIC RECORDS MANAGEMENT

// Get all attendance records
const getAllAttendance = async (req, res) => {
    try {
        const { studentId, facultyId, subject, academicYear, page = 1, limit = 50 } = req.query;
        
        const query = {};
        if (studentId) query.studentId = studentId;
        if (facultyId) query.facultyId = facultyId;
        if (subject) query.subject = subject;
        if (academicYear) query.academicYear = academicYear;

        const attendance = await Attendance.find(query)
            .populate('studentId', 'rollNumber')
            .populate('studentId.userId', 'name email')
            .populate('facultyId', 'facultyId designation')
            .populate('facultyId.userId', 'name email')
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Attendance.countDocuments(query);

        res.json({
            success: true,
            data: {
                attendance,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance records',
            error: error.message
        });
    }
};

// Get all marks records
const getAllMarks = async (req, res) => {
    try {
        const { studentId, facultyId, subject, academicYear, semester, page = 1, limit = 50 } = req.query;
        
        const query = {};
        if (studentId) query.studentId = studentId;
        if (facultyId) query.facultyId = facultyId;
        if (subject) query.subject = subject;
        if (academicYear) query.academicYear = academicYear;
        if (semester) query.semester = parseInt(semester);

        const marks = await Marks.find(query)
            .populate('studentId', 'rollNumber')
            .populate('studentId.userId', 'name email')
            .populate('facultyId', 'facultyId designation')
            .populate('facultyId.userId', 'name email')
            .sort({ dateRecorded: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Marks.countDocuments(query);

        res.json({
            success: true,
            data: {
                marks,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch marks records',
            error: error.message
        });
    }
};

// LEAVE MANAGEMENT

// Get all leave applications
const getAllLeaves = async (req, res) => {
    try {
        const { status, leaveType, userId, page = 1, limit = 20 } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (leaveType) query.leaveType = leaveType;
        if (userId) query.userId = userId;

        const leaves = await Leave.find(query)
            .populate('userId', 'name email role')
            .populate('reviewedBy', 'name email')
            .sort({ appliedDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Leave.countDocuments(query);

        res.json({
            success: true,
            data: {
                leaves,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get leaves error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leave applications',
            error: error.message
        });
    }
};

// Approve/Reject leave application
const reviewLeave = async (req, res) => {
    try {
        const { leaveId } = req.params;
        const { status, comments } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be approved or rejected'
            });
        }

        const leave = await Leave.findById(leaveId);
        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave application not found'
            });
        }

        leave.status = status;
        leave.reviewedBy = req.user.userId;
        leave.reviewDate = new Date();
        leave.reviewComments = comments;
        await leave.save();

        res.json({
            success: true,
            message: `Leave application ${status} successfully`,
            data: leave
        });
    } catch (error) {
        console.error('Review leave error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to review leave application',
            error: error.message
        });
    }
};

// NOTICE MANAGEMENT

// Get all notices
const getAllNotices = async (req, res) => {
    try {
        const { facultyId, category, isActive, page = 1, limit = 20 } = req.query;
        
        const query = {};
        if (facultyId) query.facultyId = facultyId;
        if (category) query.category = category;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const notices = await Notice.find(query)
            .populate('facultyId', 'facultyId designation')
            .populate('facultyId.userId', 'name email')
            .sort({ publishDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Notice.countDocuments(query);

        res.json({
            success: true,
            data: {
                notices,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get notices error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notices',
            error: error.message
        });
    }
};

// Delete notice
const deleteNotice = async (req, res) => {
    try {
        const { noticeId } = req.params;

        const notice = await Notice.findByIdAndDelete(noticeId);
        if (!notice) {
            return res.status(404).json({
                success: false,
                message: 'Notice not found'
            });
        }

        res.json({
            success: true,
            message: 'Notice deleted successfully'
        });
    } catch (error) {
        console.error('Delete notice error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notice',
            error: error.message
        });
    }
};

// RESOURCE MANAGEMENT

// Get all resources
const getAllResources = async (req, res) => {
    try {
        const { facultyId, subject, resourceType, page = 1, limit = 20 } = req.query;
        
        const query = {};
        if (facultyId) query.facultyId = facultyId;
        if (subject) query.subject = subject;
        if (resourceType) query.resourceType = resourceType;

        const resources = await Resource.find(query)
            .populate('facultyId', 'facultyId designation')
            .populate('facultyId.userId', 'name email')
            .sort({ uploadDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Resource.countDocuments(query);

        res.json({
            success: true,
            data: {
                resources,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get resources error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch resources',
            error: error.message
        });
    }
};

// Delete resource
const deleteResource = async (req, res) => {
    try {
        const { resourceId } = req.params;

        const resource = await Resource.findByIdAndDelete(resourceId);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        res.json({
            success: true,
            message: 'Resource deleted successfully'
        });
    } catch (error) {
        console.error('Delete resource error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete resource',
            error: error.message
        });
    }
};

module.exports = {
    adminLogin,
    getDashboardStats,
    getPendingRegistrations,
    updateUserStatus,
    getAllUsers,
    approveUser,
    rejectUser,
    deleteUser,
    addUser,
    createUser,
    getAllFaculty,
    updateFacultyProfile,
    getAllStudents,
    updateStudentProfile,
    getAllAttendance,
    getAllMarks,
    getAllLeaves,
    reviewLeave,
    getAllNotices,
    deleteNotice,
    getAllResources,
    deleteResource
};