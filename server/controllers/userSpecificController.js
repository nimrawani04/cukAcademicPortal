/**
 * USER-SPECIFIC API CONTROLLERS
 * Enforces critical API rules: Faculty → only assigned students, Student → only own data, Admin → everything
 */

const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const FacultyProfile = require('../models/FacultyProfile');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Notice = require('../models/Notice');
const Resource = require('../models/Resource');
const Leave = require('../models/Leave');

/**
 * ADMIN CONTROLLERS - Can access everything
 */

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
    try {
        console.log('🔍 Admin getting all users');
        
        const users = await User.find({})
            .select('-password')
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: {
                users,
                total: users.length
            }
        });
        
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
};

// Approve user (Admin only) - Updates MongoDB
const approveUser = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('🔍 Admin approving user:', userId);
        
        // Update user status in MongoDB
        const user = await User.findByIdAndUpdate(
            userId,
            { status: 'approved' },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User approved successfully',
            data: user
        });
        
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving user'
        });
    }
};

// Delete user (Admin only) - Updates MongoDB
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('🔍 Admin deleting user:', userId);
        
        // Delete user from MongoDB
        const user = await User.findByIdAndDelete(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Also delete associated profiles
        if (user.role === 'student') {
            await StudentProfile.findOneAndDelete({ userId });
        } else if (user.role === 'faculty') {
            await FacultyProfile.findOneAndDelete({ userId });
        }
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user'
        });
    }
};

/**
 * FACULTY CONTROLLERS - Only assigned students
 */

// Get faculty's assigned students only
const getFacultyStudents = async (req, res) => {
    try {
        const facultyProfile = req.facultyProfile;
        console.log('🔍 Faculty getting assigned students:', facultyProfile._id);
        
        // Only get students assigned to this faculty
        const students = await StudentProfile.find({
            _id: { $in: facultyProfile.assignedStudents }
        })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: {
                students,
                total: students.length
            }
        });
        
    } catch (error) {
        console.error('Get faculty students error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching assigned students'
        });
    }
};

// Add attendance for assigned student only - Updates MongoDB
const addStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const facultyProfile = req.facultyProfile;
        const { subject, date, status, classType } = req.body;
        
        console.log('🔍 Faculty adding attendance for student:', studentId);
        
        // Verify student is assigned to this faculty
        if (!facultyProfile.assignedStudents.includes(studentId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied - student not assigned to you'
            });
        }
        
        // Create attendance record in MongoDB
        const attendance = new Attendance({
            studentId,
            facultyId: facultyProfile._id,
            subject,
            date: new Date(date),
            status,
            classType: classType || 'lecture'
        });
        
        await attendance.save();
        
        res.status(201).json({
            success: true,
            message: 'Attendance recorded successfully',
            data: attendance
        });
        
    } catch (error) {
        console.error('Add attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error recording attendance'
        });
    }
};

// Add marks for assigned student only - Updates MongoDB
const addStudentMarks = async (req, res) => {
    try {
        const { studentId } = req.params;
        const facultyProfile = req.facultyProfile;
        const { subject, examType, totalMarks, maxMarks } = req.body;
        
        console.log('🔍 Faculty adding marks for student:', studentId);
        
        // Verify student is assigned to this faculty
        if (!facultyProfile.assignedStudents.includes(studentId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied - student not assigned to you'
            });
        }
        
        // Calculate percentage and grade
        const percentage = (totalMarks / maxMarks) * 100;
        const grade = calculateGrade(percentage);
        
        // Create marks record in MongoDB
        const marks = new Marks({
            studentId,
            facultyId: facultyProfile._id,
            subject,
            examType,
            totalMarks,
            maxMarks,
            percentage,
            grade,
            isPublished: true
        });
        
        await marks.save();
        
        res.status(201).json({
            success: true,
            message: 'Marks added successfully',
            data: marks
        });
        
    } catch (error) {
        console.error('Add marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding marks'
        });
    }
};

// Get attendance for assigned students only
const getFacultyStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const facultyProfile = req.facultyProfile;
        
        console.log('🔍 Faculty getting attendance for student:', studentId);
        
        // Verify student is assigned to this faculty
        if (!facultyProfile.assignedStudents.includes(studentId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied - student not assigned to you'
            });
        }
        
        // Get attendance records for this student from this faculty
        const attendance = await Attendance.find({
            studentId,
            facultyId: facultyProfile._id
        }).sort({ date: -1 });
        
        res.json({
            success: true,
            data: {
                attendance,
                total: attendance.length
            }
        });
        
    } catch (error) {
        console.error('Get student attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance'
        });
    }
};

// Create notice - Updates MongoDB
const createNotice = async (req, res) => {
    try {
        const facultyProfile = req.facultyProfile;
        const { title, content, priority, category, targetGroup } = req.body;
        
        console.log('🔍 Faculty creating notice');
        
        // Create notice in MongoDB
        const notice = new Notice({
            facultyId: facultyProfile._id,
            title,
            content,
            priority: priority || 'normal',
            category: category || 'general',
            targetGroup: targetGroup || { allStudents: true },
            publishDate: new Date(),
            isActive: true
        });
        
        await notice.save();
        
        res.status(201).json({
            success: true,
            message: 'Notice created successfully',
            data: notice
        });
        
    } catch (error) {
        console.error('Create notice error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating notice'
        });
    }
};

/**
 * STUDENT CONTROLLERS - Only own data
 */

// Get student's own profile only
const getStudentOwnProfile = async (req, res) => {
    try {
        const { userId } = req.user;
        console.log('🔍 Student getting own profile:', userId);
        
        // Only get this student's profile
        const studentProfile = await StudentProfile.findOne({ userId })
            .populate('userId', 'name email');
        
        if (!studentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }
        
        res.json({
            success: true,
            data: studentProfile
        });
        
    } catch (error) {
        console.error('Get student profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    }
};

// Get student's own attendance only
const getStudentOwnAttendance = async (req, res) => {
    try {
        const studentProfile = req.studentProfile;
        console.log('🔍 Student getting own attendance:', studentProfile._id);
        
        // Only get this student's attendance
        const attendance = await Attendance.find({
            studentId: studentProfile._id
        })
        .populate('facultyId', 'designation')
        .sort({ date: -1 });
        
        res.json({
            success: true,
            data: {
                attendance,
                total: attendance.length
            }
        });
        
    } catch (error) {
        console.error('Get student attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance'
        });
    }
};

// Get student's own marks only
const getStudentOwnMarks = async (req, res) => {
    try {
        const studentProfile = req.studentProfile;
        console.log('🔍 Student getting own marks:', studentProfile._id);
        
        // Only get this student's published marks
        const marks = await Marks.find({
            studentId: studentProfile._id,
            isPublished: true
        })
        .populate('facultyId', 'designation')
        .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: {
                marks,
                total: marks.length
            }
        });
        
    } catch (error) {
        console.error('Get student marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching marks'
        });
    }
};

// Apply for leave - Updates MongoDB
const applyForLeave = async (req, res) => {
    try {
        const { userId } = req.user;
        const { leaveType, reason, fromDate, toDate, priority } = req.body;
        
        console.log('🔍 Student applying for leave:', userId);
        
        // Calculate total days
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const totalDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
        
        // Create leave application in MongoDB
        const leave = new Leave({
            userId,
            leaveType,
            reason,
            fromDate: from,
            toDate: to,
            totalDays,
            priority: priority || 'normal',
            status: 'pending',
            appliedDate: new Date()
        });
        
        await leave.save();
        
        res.status(201).json({
            success: true,
            message: 'Leave application submitted successfully',
            data: leave
        });
        
    } catch (error) {
        console.error('Apply leave error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting leave application'
        });
    }
};

// Get student's own leave applications only
const getStudentOwnLeaves = async (req, res) => {
    try {
        const { userId } = req.user;
        console.log('🔍 Student getting own leaves:', userId);
        
        // Only get this student's leave applications
        const leaves = await Leave.find({ userId })
            .sort({ appliedDate: -1 });
        
        res.json({
            success: true,
            data: {
                leaves,
                total: leaves.length
            }
        });
        
    } catch (error) {
        console.error('Get student leaves error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching leave applications'
        });
    }
};

/**
 * UTILITY FUNCTIONS
 */

function calculateGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 35) return 'D';
    return 'F';
}

module.exports = {
    // Admin controllers
    getAllUsers,
    approveUser,
    deleteUser,
    
    // Faculty controllers
    getFacultyStudents,
    addStudentAttendance,
    addStudentMarks,
    getFacultyStudentAttendance,
    createNotice,
    
    // Student controllers
    getStudentOwnProfile,
    getStudentOwnAttendance,
    getStudentOwnMarks,
    applyForLeave,
    getStudentOwnLeaves
};