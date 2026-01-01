const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const User = require('../models/User');

/**
 * Get all students (for teacher view)
 * GET /api/teacher/students
 */
const getAllStudents = async (req, res) => {
    try {
        console.log('🔍 Teacher getting all students');
        
        // Get all users with student role
        const studentUsers = await User.find({ role: 'student' }).select('name email');
        
        // Get student profiles if they exist
        const students = [];
        for (const user of studentUsers) {
            let student = await Student.findOne({ userId: user._id });
            
            // If no student profile exists, create a basic one
            if (!student) {
                const rollNumber = `CUK${new Date().getFullYear()}${String(students.length + 1).padStart(3, '0')}`;
                student = new Student({
                    userId: user._id,
                    rollNumber: rollNumber,
                    course: 'Not Assigned',
                    semester: 1,
                    year: new Date().getFullYear(),
                    department: 'Not Assigned'
                });
                await student.save();
                console.log(`✅ Created student profile for: ${user.email}`);
            }
            
            students.push({
                id: student._id,
                userId: user._id,
                name: user.name,
                email: user.email,
                rollNumber: student.rollNumber,
                course: student.course,
                semester: student.semester,
                year: student.year,
                department: student.department
            });
        }
        
        res.json({
            success: true,
            data: students
        });
        
    } catch (error) {
        console.error('Get all students error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching students'
        });
    }
};

/**
 * Get student attendance for teacher view
 * GET /api/teacher/attendance/:studentId
 */
const getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        console.log('🔍 Teacher getting attendance for student:', studentId);
        
        const attendance = await Attendance.find({ studentId });
        
        res.json({
            success: true,
            data: attendance
        });
        
    } catch (error) {
        console.error('Get student attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student attendance'
        });
    }
};

/**
 * Update student attendance
 * POST /api/teacher/attendance
 */
const updateAttendance = async (req, res) => {
    try {
        const { studentId, subject, totalClasses, attendedClasses } = req.body;
        
        console.log('🔍 Teacher updating attendance:', { studentId, subject, totalClasses, attendedClasses });
        
        // Find existing attendance record or create new one
        let attendance = await Attendance.findOne({ studentId, subject });
        
        if (attendance) {
            attendance.totalClasses = totalClasses;
            attendance.attendedClasses = attendedClasses;
            await attendance.save();
        } else {
            attendance = new Attendance({
                studentId,
                subject,
                totalClasses,
                attendedClasses
            });
            await attendance.save();
        }
        
        res.json({
            success: true,
            message: 'Attendance updated successfully',
            data: {
                subject: attendance.subject,
                totalClasses: attendance.totalClasses,
                attendedClasses: attendance.attendedClasses,
                percentage: attendance.percentage
            }
        });
        
    } catch (error) {
        console.error('Update attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating attendance'
        });
    }
};

/**
 * Get student marks for teacher view
 * GET /api/teacher/marks/:studentId/:subject
 */
const getStudentMarks = async (req, res) => {
    try {
        const { studentId, subject } = req.params;
        
        console.log('🔍 Teacher getting marks for student:', studentId, 'subject:', subject);
        
        let marks = await Marks.findOne({ studentId, subject });
        
        // If no marks exist, return empty marks structure
        if (!marks) {
            marks = {
                studentId,
                subject,
                marks: {
                    test1: 0,
                    test2: 0,
                    presentation: 0,
                    assignment: 0,
                    attendance: 0
                },
                total: 0,
                grade: '-'
            };
        }
        
        res.json({
            success: true,
            data: marks
        });
        
    } catch (error) {
        console.error('Get student marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student marks'
        });
    }
};

/**
 * Update student marks
 * POST /api/teacher/marks
 */
const updateMarks = async (req, res) => {
    try {
        const { studentId, subject, marks } = req.body;
        
        console.log('🔍 Teacher updating marks:', { studentId, subject, marks });
        
        // Find existing marks record or create new one
        let studentMarks = await Marks.findOne({ studentId, subject });
        
        if (studentMarks) {
            studentMarks.marks = marks;
            await studentMarks.save();
        } else {
            studentMarks = new Marks({
                studentId,
                subject,
                marks
            });
            await studentMarks.save();
        }
        
        res.json({
            success: true,
            message: 'Marks updated successfully',
            data: {
                subject: studentMarks.subject,
                marks: studentMarks.marks,
                total: studentMarks.total,
                grade: studentMarks.grade
            }
        });
        
    } catch (error) {
        console.error('Update marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating marks'
        });
    }
};

/**
 * Get all marks for a subject (for teacher view)
 * GET /api/teacher/marks/subject/:subject
 */
const getSubjectMarks = async (req, res) => {
    try {
        const { subject } = req.params;
        
        console.log('🔍 Teacher getting all marks for subject:', subject);
        
        // Get all students
        const students = await Student.find().populate('userId', 'name');
        
        // Get marks for each student in this subject
        const subjectMarks = [];
        
        for (const student of students) {
            let marks = await Marks.findOne({ studentId: student._id, subject });
            
            // If no marks exist, create empty structure
            if (!marks) {
                marks = {
                    studentId: student._id,
                    subject,
                    marks: {
                        test1: 0,
                        test2: 0,
                        presentation: 0,
                        assignment: 0,
                        attendance: 0
                    },
                    total: 0,
                    grade: '-'
                };
            }
            
            subjectMarks.push({
                studentId: student._id,
                studentName: student.userId.name,
                rollNumber: student.rollNumber,
                marks: marks.marks,
                total: marks.total,
                grade: marks.grade
            });
        }
        
        res.json({
            success: true,
            data: subjectMarks
        });
        
    } catch (error) {
        console.error('Get subject marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subject marks'
        });
    }
};

module.exports = {
    getAllStudents,
    updateAttendance,
    getStudentAttendance,
    getStudentMarks,
    updateMarks,
    getSubjectMarks
};