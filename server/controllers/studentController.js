const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const User = require('../models/User');

/**
 * Get logged-in student's profile
 * GET /api/student/profile
 */
const getStudentProfile = async (req, res) => {
    try {
        console.log('🔍 Getting profile for user:', req.user.userId);
        
        // Find student by userId from JWT token
        let student = await Student.findOne({ userId: req.user.userId }).populate('userId', 'name email');
        
        // If no student profile exists, create one
        if (!student) {
            const user = await User.findById(req.user.userId);
            const rollNumber = `CUK${new Date().getFullYear()}${String(Date.now()).slice(-3)}`;
            
            student = new Student({
                userId: req.user.userId,
                rollNumber: rollNumber,
                course: 'Not Assigned',
                semester: 1,
                year: new Date().getFullYear(),
                department: 'Not Assigned'
            });
            await student.save();
            
            // Populate the userId field
            student = await Student.findById(student._id).populate('userId', 'name email');
            console.log(`✅ Created student profile for: ${user.email}`);
        }
        
        res.json({
            success: true,
            data: {
                id: student._id,
                name: student.userId.name,
                email: student.userId.email,
                rollNumber: student.rollNumber,
                course: student.course,
                semester: student.semester,
                year: student.year,
                department: student.department,
                createdAt: student.createdAt
            }
        });
        
    } catch (error) {
        console.error('Get student profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student profile'
        });
    }
};

/**
 * Get logged-in student's attendance
 * GET /api/student/attendance
 */
const getStudentAttendance = async (req, res) => {
    try {
        console.log('🔍 Getting attendance for user:', req.user.userId);
        
        // Find student first
        let student = await Student.findOne({ userId: req.user.userId });
        if (!student) {
            return res.json({
                success: true,
                data: [] // Return empty array for new students
            });
        }
        
        // Get attendance records for this student only
        const attendance = await Attendance.find({ studentId: student._id });
        
        res.json({
            success: true,
            data: attendance.map(record => ({
                subject: record.subject,
                totalClasses: record.totalClasses,
                attendedClasses: record.attendedClasses,
                percentage: Math.round(record.percentage * 100) / 100,
                lastUpdated: record.lastUpdated
            }))
        });
        
    } catch (error) {
        console.error('Get student attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance'
        });
    }
};

/**
 * Get logged-in student's marks
 * GET /api/student/marks
 */
const getStudentMarks = async (req, res) => {
    try {
        console.log('🔍 Getting marks for user:', req.user.userId);
        
        // Find student first
        let student = await Student.findOne({ userId: req.user.userId });
        if (!student) {
            return res.json({
                success: true,
                data: [] // Return empty array for new students
            });
        }
        
        // Get marks records for this student only
        const marks = await Marks.find({ studentId: student._id }).sort({ lastUpdated: -1 });
        
        res.json({
            success: true,
            data: marks.map(record => ({
                subject: record.subject,
                marks: record.marks,
                total: record.total,
                grade: record.grade,
                lastUpdated: record.lastUpdated
            }))
        });
        
    } catch (error) {
        console.error('Get student marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching marks'
        });
    }
};

/**
 * Get student dashboard summary
 * GET /api/student/dashboard
 */
const getStudentDashboard = async (req, res) => {
    try {
        console.log('🔍 Getting dashboard for user:', req.user.userId);
        
        // Find student first
        let student = await Student.findOne({ userId: req.user.userId }).populate('userId', 'name');
        if (!student) {
            // Create student profile if it doesn't exist
            const user = await User.findById(req.user.userId);
            const rollNumber = `CUK${new Date().getFullYear()}${String(Date.now()).slice(-3)}`;
            
            student = new Student({
                userId: req.user.userId,
                rollNumber: rollNumber,
                course: 'Not Assigned',
                semester: 1,
                year: new Date().getFullYear(),
                department: 'Not Assigned'
            });
            await student.save();
            student = await Student.findById(student._id).populate('userId', 'name');
        }
        
        // Get attendance summary
        const attendance = await Attendance.find({ studentId: student._id });
        const totalSubjects = attendance.length;
        const averageAttendance = attendance.length > 0 
            ? attendance.reduce((sum, record) => sum + record.percentage, 0) / attendance.length 
            : 0;
        
        // Get marks summary
        const marks = await Marks.find({ studentId: student._id });
        const totalSubjects_marks = marks.length;
        const averageMarks = marks.length > 0 
            ? marks.reduce((sum, record) => sum + ((record.total / 50) * 100), 0) / marks.length 
            : 0;
        
        res.json({
            success: true,
            data: {
                student: {
                    name: student.userId.name,
                    rollNumber: student.rollNumber,
                    course: student.course,
                    semester: student.semester
                },
                summary: {
                    totalSubjects,
                    averageAttendance: Math.round(averageAttendance * 100) / 100,
                    totalSubjects_marks,
                    averageMarks: Math.round(averageMarks * 100) / 100
                }
            }
        });
        
    } catch (error) {
        console.error('Get student dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data'
        });
    }
};

module.exports = {
    getStudentProfile,
    getStudentAttendance,
    getStudentMarks,
    getStudentDashboard
};