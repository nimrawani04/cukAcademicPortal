const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Course = require('../models/Course');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

/**
 * Mark attendance for a single student
 * POST /api/attendance
 */
const markAttendance = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            studentId,
            courseId,
            subject,
            date,
            status,
            academicYear,
            semester,
            classType,
            duration,
            remarks
        } = req.body;

        // Verify student and course exist
        const [student, course] = await Promise.all([
            Student.findById(studentId),
            Course.findById(courseId)
        ]);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if attendance already exists for this date
        const existingAttendance = await Attendance.findOne({
            studentId,
            courseId,
            date: new Date(date)
        });

        if (existingAttendance) {
            // Update existing attendance
            await existingAttendance.updateStatus(status, req.user.userId, remarks);
            
            await existingAttendance.populate([
                { path: 'studentId', select: 'firstName lastName rollNumber' },
                { path: 'courseId', select: 'title code' },
                { path: 'markedBy', select: 'firstName lastName role' }
            ]);

            console.log(`✅ Attendance updated for student ${student.rollNumber} on ${date}`);

            return res.json({
                success: true,
                message: 'Attendance updated successfully',
                data: { attendance: existingAttendance }
            });
        }

        // Create new attendance record
        const attendance = new Attendance({
            studentId,
            courseId,
            subject,
            date: new Date(date),
            status,
            academicYear,
            semester,
            classType: classType || 'lecture',
            duration: duration || 60,
            remarks,
            markedBy: req.user.userId,
            markingSource: 'manual'
        });

        await attendance.save();

        // Populate the response
        await attendance.populate([
            { path: 'studentId', select: 'firstName lastName rollNumber' },
            { path: 'courseId', select: 'title code' },
            { path: 'markedBy', select: 'firstName lastName role' }
        ]);

        console.log(`✅ Attendance marked for student ${student.rollNumber} on ${date}: ${status}`);

        res.status(201).json({
            success: true,
            message: 'Attendance marked successfully',
            data: { attendance }
        });

    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while marking attendance'
        });
    }
};

/**
 * Mark attendance for multiple students (bulk)
 * POST /api/attendance/bulk
 */
const markBulkAttendance = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { attendanceData } = req.body;
        const batchId = uuidv4();

        if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Attendance data array is required and must not be empty'
            });
        }

        // Validate all student and course IDs exist
        const studentIds = [...new Set(attendanceData.map(item => item.studentId))];
        const courseIds = [...new Set(attendanceData.map(item => item.courseId))];

        const [students, courses] = await Promise.all([
            Student.find({ _id: { $in: studentIds } }).select('_id rollNumber'),
            Course.find({ _id: { $in: courseIds } }).select('_id code title')
        ]);

        const studentIdMap = new Map(students.map(s => [s._id.toString(), s]));
        const courseIdMap = new Map(courses.map(c => [c._id.toString(), c]));

        // Filter valid data
        const validData = attendanceData.filter(item => 
            studentIdMap.has(item.studentId) && courseIdMap.has(item.courseId)
        );

        if (validData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid student/course combinations found'
            });
        }

        // Process bulk attendance
        const results = await Attendance.markBulkAttendance(validData, req.user.userId, batchId);

        console.log(`📊 Bulk attendance marked: ${results.success.length} success, ${results.errors.length} errors, ${results.duplicates.length} updates`);

        res.json({
            success: true,
            message: 'Bulk attendance processing completed',
            data: {
                batchId,
                totalProcessed: validData.length,
                successful: results.success.length,
                updated: results.duplicates.length,
                errors: results.errors.length,
                results
            }
        });

    } catch (error) {
        console.error('Bulk attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during bulk attendance marking'
        });
    }
};

/**
 * Get attendance for a student
 * GET /api/attendance/student/:studentId
 */
const getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { 
            courseId, 
            academicYear, 
            semester, 
            startDate, 
            endDate, 
            status,
            page = 1,
            limit = 50
        } = req.query;

        // Verify student exists
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check access permissions
        const userRole = req.user.role;
        const userId = req.user.userId;

        if (userRole === 'student' && userId.toString() !== studentId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Students can only view their own attendance.'
            });
        }

        // Get attendance records
        const attendance = await Attendance.getAttendanceByStudent(studentId, {
            courseId,
            academicYear,
            semester,
            startDate,
            endDate,
            status
        });

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedAttendance = attendance.slice(startIndex, endIndex);

        // Calculate attendance percentage for each course
        const courseStats = {};
        if (courseId) {
            // Single course statistics
            const stats = await Attendance.calculateAttendancePercentage(studentId, courseId, {
                academicYear,
                semester,
                startDate,
                endDate
            });
            courseStats[courseId] = stats;
        } else {
            // Statistics for all courses
            const uniqueCourses = [...new Set(attendance.map(a => a.courseId._id.toString()))];
            for (const cId of uniqueCourses) {
                const stats = await Attendance.calculateAttendancePercentage(studentId, cId, {
                    academicYear,
                    semester,
                    startDate,
                    endDate
                });
                courseStats[cId] = stats;
            }
        }

        // Overall summary
        const totalRecords = attendance.length;
        const overallStats = {
            totalClasses: totalRecords,
            presentClasses: attendance.filter(a => a.status === 'present').length,
            absentClasses: attendance.filter(a => a.status === 'absent').length,
            lateClasses: attendance.filter(a => a.status === 'late').length,
            excusedClasses: attendance.filter(a => a.status === 'excused').length
        };

        if (totalRecords > 0) {
            const effectivePresent = overallStats.presentClasses + overallStats.excusedClasses + (overallStats.lateClasses * 0.5);
            overallStats.overallPercentage = ((effectivePresent / totalRecords) * 100).toFixed(2);
        } else {
            overallStats.overallPercentage = 0;
        }

        res.json({
            success: true,
            data: {
                student: {
                    id: student._id,
                    name: `${student.firstName} ${student.lastName}`,
                    rollNumber: student.rollNumber
                },
                attendance: paginatedAttendance,
                courseStatistics: courseStats,
                overallStatistics: overallStats,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(attendance.length / limit),
                    totalRecords: attendance.length,
                    hasNext: endIndex < attendance.length,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get student attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching student attendance'
        });
    }
};

/**
 * Get attendance for a course
 * GET /api/attendance/course/:courseId
 */
const getCourseAttendance = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { 
            date, 
            academicYear, 
            semester, 
            status,
            page = 1,
            limit = 100
        } = req.query;

        // Verify course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if faculty can access this course
        const userRole = req.user.role;
        const userId = req.user.userId;

        if (userRole === 'faculty' && course.instructor.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view attendance for courses you teach.'
            });
        }

        // Get attendance records
        const attendance = await Attendance.getAttendanceByCourse(courseId, {
            date,
            academicYear,
            semester,
            status
        });

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedAttendance = attendance.slice(startIndex, endIndex);

        // Get course statistics
        const statistics = await Attendance.getCourseAttendanceStatistics(courseId, {
            academicYear,
            semester
        });

        // If specific date is requested, get daily summary
        let dailySummary = null;
        if (date) {
            dailySummary = await Attendance.getClassAttendanceSummary(courseId, date, {
                academicYear,
                semester
            });
        }

        res.json({
            success: true,
            data: {
                course: {
                    id: course._id,
                    title: course.title,
                    code: course.code,
                    credits: course.credits
                },
                attendance: paginatedAttendance,
                statistics,
                dailySummary,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(attendance.length / limit),
                    totalRecords: attendance.length,
                    hasNext: endIndex < attendance.length,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get course attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching course attendance'
        });
    }
};

/**
 * Get attendance percentage for a student in a course
 * GET /api/attendance/percentage/:studentId/:courseId
 */
const getAttendancePercentage = async (req, res) => {
    try {
        const { studentId, courseId } = req.params;
        const { academicYear, semester, startDate, endDate } = req.query;

        // Verify student and course exist
        const [student, course] = await Promise.all([
            Student.findById(studentId),
            Course.findById(courseId)
        ]);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check access permissions
        const userRole = req.user.role;
        const userId = req.user.userId;

        if (userRole === 'student' && userId.toString() !== studentId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Students can only view their own attendance.'
            });
        }

        if (userRole === 'faculty' && course.instructor.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view attendance for courses you teach.'
            });
        }

        // Calculate attendance percentage
        const attendanceStats = await Attendance.calculateAttendancePercentage(studentId, courseId, {
            academicYear,
            semester,
            startDate,
            endDate
        });

        res.json({
            success: true,
            data: {
                student: {
                    id: student._id,
                    name: `${student.firstName} ${student.lastName}`,
                    rollNumber: student.rollNumber
                },
                course: {
                    id: course._id,
                    title: course.title,
                    code: course.code
                },
                attendanceStats
            }
        });

    } catch (error) {
        console.error('Get attendance percentage error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while calculating attendance percentage'
        });
    }
};

/**
 * Update attendance record
 * PUT /api/attendance/:id
 */
const updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const attendance = await Attendance.findById(id);
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        // Check permissions
        const userRole = req.user.role;
        const userId = req.user.userId;

        if (userRole === 'faculty') {
            // Faculty can only edit attendance for courses they teach
            const course = await Course.findById(attendance.courseId);
            if (!course || course.instructor.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only edit attendance for courses you teach.'
                });
            }
        } else if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only faculty and admin can edit attendance.'
            });
        }

        // Update attendance
        const { status, remarks } = req.body;
        await attendance.updateStatus(status, userId, remarks);

        // Populate the response
        await attendance.populate([
            { path: 'studentId', select: 'firstName lastName rollNumber' },
            { path: 'courseId', select: 'title code' },
            { path: 'markedBy', select: 'firstName lastName role' }
        ]);

        console.log(`✅ Attendance updated for student ${attendance.studentId.rollNumber} by ${userRole} ${userId}`);

        res.json({
            success: true,
            message: 'Attendance updated successfully',
            data: { attendance }
        });

    } catch (error) {
        console.error('Update attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating attendance'
        });
    }
};

/**
 * Delete attendance record
 * DELETE /api/attendance/:id
 */
const deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;

        const attendance = await Attendance.findById(id);
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        // Check permissions
        const userRole = req.user.role;
        const userId = req.user.userId;

        if (userRole === 'faculty') {
            // Faculty can only delete attendance for courses they teach
            const course = await Course.findById(attendance.courseId);
            if (!course || course.instructor.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only delete attendance for courses you teach.'
                });
            }
        } else if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only faculty and admin can delete attendance.'
            });
        }

        // Soft delete
        attendance.isActive = false;
        await attendance.save();

        console.log(`🗑️ Attendance deleted for student ${attendance.studentId} by ${userRole} ${userId}`);

        res.json({
            success: true,
            message: 'Attendance deleted successfully'
        });

    } catch (error) {
        console.error('Delete attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting attendance'
        });
    }
};

/**
 * Get my attendance (student convenience endpoint)
 * GET /api/attendance/my-attendance
 */
const getMyAttendance = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'This endpoint is only for students'
            });
        }

        // Redirect to student attendance endpoint with current user's ID
        req.params.studentId = req.user.userId;
        return getStudentAttendance(req, res);

    } catch (error) {
        console.error('Get my attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching attendance'
        });
    }
};

module.exports = {
    markAttendance,
    markBulkAttendance,
    getStudentAttendance,
    getCourseAttendance,
    getAttendancePercentage,
    updateAttendance,
    deleteAttendance,
    getMyAttendance
};