const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const FacultyProfile = require('../models/FacultyProfile');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Notice = require('../models/Notice');
const Resource = require('../models/Resource');
const Leave = require('../models/Leave');

/**
 * Get logged-in student's profile
 * GET /api/student/profile
 */
const getStudentProfile = async (req, res) => {
    try {
        console.log('🔍 Getting student profile for user:', req.user.userId);
        
        // Find student profile by userId from JWT token
        let studentProfile = await StudentProfile.findOne({ userId: req.user.userId })
            .populate('userId', 'name email')
            .populate('selectedCourses.facultyId', 'facultyId designation department')
            .populate('selectedCourses.facultyId.userId', 'name email');
        
        // If no student profile exists, create one
        if (!studentProfile) {
            const user = await User.findById(req.user.userId);
            
            // Generate a roll number
            const count = await StudentProfile.countDocuments();
            const rollNumber = `STU${String(count + 1).padStart(4, '0')}`;
            
            studentProfile = new StudentProfile({
                userId: req.user.userId,
                rollNumber: rollNumber,
                course: 'B.Tech Computer Science',
                semester: 1,
                department: 'Computer Science and Engineering',
                enrollmentYear: new Date().getFullYear(),
                selectedCourses: []
            });
            await studentProfile.save();
            
            // Populate the userId field
            studentProfile = await StudentProfile.findById(studentProfile._id)
                .populate('userId', 'name email')
                .populate('selectedCourses.facultyId', 'facultyId designation department')
                .populate('selectedCourses.facultyId.userId', 'name email');
            console.log(`✅ Created student profile for: ${user.email}`);
        }
        
        res.json({
            success: true,
            data: {
                id: studentProfile._id,
                name: studentProfile.userId.name,
                email: studentProfile.userId.email,
                rollNumber: studentProfile.rollNumber,
                course: studentProfile.course,
                semester: studentProfile.semester,
                department: studentProfile.department,
                cgpa: studentProfile.cgpa,
                enrollmentYear: studentProfile.enrollmentYear,
                selectedCourses: studentProfile.selectedCourses,
                isActive: studentProfile.isActive
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
 * Get logged-in student's attendance records
 * GET /api/student/attendance
 */
const getStudentAttendance = async (req, res) => {
    try {
        const { subject, academicYear, startDate, endDate, page = 1, limit = 50 } = req.query;
        
        console.log('🔍 Getting student attendance for user:', req.user.userId);
        
        // Find student profile
        const studentProfile = await StudentProfile.findOne({ userId: req.user.userId });
        if (!studentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        const query = { studentId: studentProfile._id };
        
        if (subject) query.subject = subject;
        if (academicYear) query.academicYear = academicYear;
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const attendance = await Attendance.find(query)
            .populate('facultyId', 'facultyId designation')
            .populate('facultyId.userId', 'name email')
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Attendance.countDocuments(query);

        res.json({
            success: true,
            data: {
                attendance: attendance.map(att => ({
                    id: att._id,
                    subject: att.subject,
                    subjectCode: att.subjectCode,
                    date: att.date,
                    status: att.status,
                    classType: att.classType,
                    duration: att.duration,
                    facultyName: att.facultyId?.userId?.name || 'Unknown',
                    semester: att.semester,
                    academicYear: att.academicYear
                })),
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get student attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance records'
        });
    }
};

/**
 * Get logged-in student's marks/grades
 * GET /api/student/marks
 */
const getStudentMarks = async (req, res) => {
    try {
        const { subject, examType, academicYear, semester, page = 1, limit = 50 } = req.query;
        
        console.log('🔍 Getting student marks for user:', req.user.userId);
        
        // Find student profile
        const studentProfile = await StudentProfile.findOne({ userId: req.user.userId });
        if (!studentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        const query = { 
            studentId: studentProfile._id,
            isPublished: true // Only show published marks
        };
        
        if (subject) query.subject = subject;
        if (examType) query.examType = examType;
        if (academicYear) query.academicYear = academicYear;
        if (semester) query.semester = parseInt(semester);

        const marks = await Marks.find(query)
            .populate('facultyId', 'facultyId designation')
            .populate('facultyId.userId', 'name email')
            .sort({ dateRecorded: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Marks.countDocuments(query);

        res.json({
            success: true,
            data: {
                marks: marks.map(mark => ({
                    id: mark._id,
                    subject: mark.subject,
                    subjectCode: mark.subjectCode,
                    examType: mark.examType,
                    totalMarks: mark.totalMarks,
                    maxMarks: mark.maxMarks,
                    percentage: mark.percentage,
                    grade: mark.grade,
                    gradePoints: mark.gradePoints,
                    credits: mark.credits,
                    facultyName: mark.facultyId?.userId?.name || 'Unknown',
                    semester: mark.semester,
                    academicYear: mark.academicYear,
                    dateRecorded: mark.dateRecorded
                })),
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get student marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching marks records'
        });
    }
};

/**
 * Get logged-in student's dashboard summary
 * GET /api/student/dashboard
 */
const getStudentDashboard = async (req, res) => {
    try {
        console.log('🔍 Getting student dashboard for user:', req.user.userId);
        
        // Find student profile
        const studentProfile = await StudentProfile.findOne({ userId: req.user.userId })
            .populate('userId', 'name email')
            .populate('selectedCourses.facultyId', 'facultyId designation')
            .populate('selectedCourses.facultyId.userId', 'name email');

        if (!studentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        // Get current academic year
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const academicYear = currentMonth >= 7 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;

        // Get attendance summary
        const attendanceCount = await Attendance.countDocuments({
            studentId: studentProfile._id,
            academicYear
        });

        // Get marks count
        const marksCount = await Marks.countDocuments({
            studentId: studentProfile._id,
            isPublished: true,
            academicYear
        });

        // Get notices count
        const noticesCount = await Notice.countDocuments({
            isActive: true,
            $or: [
                { 'targetGroup.allStudents': true },
                { 'targetGroup.courses': studentProfile.course },
                { 'targetGroup.semesters': studentProfile.semester },
                { 'targetGroup.departments': studentProfile.department }
            ]
        });

        // Get resources count
        const resourcesCount = await Resource.countDocuments({
            $or: [
                { isPublic: true },
                { 'targetGroup.allStudents': true },
                { 'targetGroup.courses': studentProfile.course },
                { 'targetGroup.semesters': studentProfile.semester },
                { 'targetGroup.departments': studentProfile.department }
            ],
            isActive: true
        });

        // Get pending leaves count
        const pendingLeavesCount = await Leave.countDocuments({
            userId: req.user.userId,
            status: 'pending'
        });

        // Calculate CGPA
        await studentProfile.calculateCGPA();

        const stats = {
            cgpa: studentProfile.cgpa,
            totalCredits: studentProfile.totalCredits,
            currentSemester: studentProfile.semester,
            enrollmentYear: studentProfile.enrollmentYear,
            attendanceRecords: attendanceCount,
            marksRecords: marksCount,
            availableNotices: noticesCount,
            availableResources: resourcesCount,
            pendingLeaves: pendingLeavesCount
        };

        res.json({
            success: true,
            data: {
                profile: {
                    id: studentProfile._id,
                    name: studentProfile.userId.name,
                    email: studentProfile.userId.email,
                    rollNumber: studentProfile.rollNumber,
                    course: studentProfile.course,
                    semester: studentProfile.semester,
                    department: studentProfile.department,
                    cgpa: studentProfile.cgpa
                },
                stats
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

/**
 * Get logged-in student's leave applications
 * GET /api/student/leaves
 */
const getStudentLeaves = async (req, res) => {
    try {
        const { status, leaveType, page = 1, limit = 20 } = req.query;
        
        console.log('🔍 Getting student leaves for user:', req.user.userId);
        
        const query = { userId: req.user.userId };
        if (status) query.status = status;
        if (leaveType) query.leaveType = leaveType;

        const leaves = await Leave.find(query)
            .populate('reviewedBy', 'name email')
            .sort({ appliedDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Leave.countDocuments(query);

        res.json({
            success: true,
            data: {
                leaves: leaves.map(leave => ({
                    id: leave._id,
                    leaveType: leave.leaveType,
                    reason: leave.reason,
                    fromDate: leave.fromDate,
                    toDate: leave.toDate,
                    totalDays: leave.totalDays,
                    status: leave.status,
                    priority: leave.priority,
                    appliedDate: leave.appliedDate,
                    reviewComments: leave.reviewComments,
                    reviewDate: leave.reviewDate,
                    reviewedBy: leave.reviewedBy?.name || null
                })),
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
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
 * Apply for leave
 * POST /api/student/leave
 */
const applyLeave = async (req, res) => {
    try {
        console.log('🔍 Student applying for leave:', req.user.userId);
        
        const leave = new Leave({
            userId: req.user.userId,
            ...req.body
        });

        await leave.save();

        res.status(201).json({
            success: true,
            message: 'Leave application submitted successfully',
            data: {
                id: leave._id,
                leaveType: leave.leaveType,
                fromDate: leave.fromDate,
                toDate: leave.toDate,
                totalDays: leave.totalDays,
                status: leave.status,
                appliedDate: leave.appliedDate
            }
        });
    } catch (error) {
        console.error('Apply leave error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting leave application'
        });
    }
};

/**
 * Get notices for logged-in student
 * GET /api/student/notices
 */
const getStudentNotices = async (req, res) => {
    try {
        const { category, priority, page = 1, limit = 20 } = req.query;
        
        console.log('🔍 Getting student notices for user:', req.user.userId);
        
        // Find student profile
        const studentProfile = await StudentProfile.findOne({ userId: req.user.userId });
        if (!studentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        // Build query for notices
        let query = {
            isActive: true,
            $or: [
                { 'targetGroup.allStudents': true },
                { 'targetGroup.courses': studentProfile.course },
                { 'targetGroup.semesters': studentProfile.semester },
                { 'targetGroup.departments': studentProfile.department }
            ]
        };

        if (category) query.category = category;
        if (priority) query.priority = priority;

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
                notices: notices.map(notice => ({
                    id: notice._id,
                    title: notice.title,
                    content: notice.content,
                    priority: notice.priority,
                    category: notice.category,
                    publishDate: notice.publishDate,
                    expiryDate: notice.expiryDate,
                    facultyName: notice.facultyId?.userId?.name || 'Unknown',
                    viewCount: notice.viewCount
                })),
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get student notices error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notices'
        });
    }
};

/**
 * Get resources for logged-in student
 * GET /api/student/resources
 */
const getStudentResources = async (req, res) => {
    try {
        const { subject, resourceType, semester, page = 1, limit = 20 } = req.query;
        
        console.log('🔍 Getting student resources for user:', req.user.userId);
        
        // Find student profile
        const studentProfile = await StudentProfile.findOne({ userId: req.user.userId });
        if (!studentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        // Build query for resources
        let query = {
            isActive: true,
            $or: [
                { isPublic: true },
                { 'targetGroup.allStudents': true },
                { 'targetGroup.courses': studentProfile.course },
                { 'targetGroup.semesters': studentProfile.semester },
                { 'targetGroup.departments': studentProfile.department }
            ]
        };

        if (subject) query.subject = subject;
        if (resourceType) query.resourceType = resourceType;
        if (semester) query.semester = parseInt(semester);

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
                resources: resources.map(resource => ({
                    id: resource._id,
                    title: resource.title,
                    description: resource.description,
                    subject: resource.subject,
                    subjectCode: resource.subjectCode,
                    resourceType: resource.resourceType,
                    filename: resource.originalName,
                    fileSize: resource.fileSize,
                    mimeType: resource.mimeType,
                    uploadDate: resource.uploadDate,
                    downloadCount: resource.downloadCount,
                    facultyName: resource.facultyId?.userId?.name || 'Unknown',
                    semester: resource.semester
                })),
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get student resources error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching resources'
        });
    }
};

/**
 * Download a specific resource
 * GET /api/student/resource/:id/download
 */
const downloadResource = async (req, res) => {
    try {
        const { id } = req.params;
        const path = require('path');
        const fs = require('fs');
        
        console.log('🔍 Student downloading resource:', id, 'for user:', req.user.userId);
        
        const resource = await Resource.findById(id);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        // Check if student has access to this resource
        const studentProfile = await StudentProfile.findOne({ userId: req.user.userId });
        if (!studentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        const hasAccess = resource.isPublic || 
                         resource.targetGroup.allStudents ||
                         resource.targetGroup.courses.includes(studentProfile.course) ||
                         resource.targetGroup.semesters.includes(studentProfile.semester) ||
                         resource.targetGroup.departments.includes(studentProfile.department);

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this resource'
            });
        }

        // Increment download count
        await resource.incrementDownloadCount(req.user.userId);

        // Get the actual file path
        const filePath = path.join(__dirname, '../../uploads/resources', resource.filename);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            // Create a dummy file for demonstration
            const dummyContent = `This is a sample ${resource.resourceType} file for ${resource.title}\n\nSubject: ${resource.subject}\nUploaded: ${resource.uploadDate}\nDescription: ${resource.description}`;
            
            res.setHeader('Content-Type', resource.mimeType || 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename="${resource.originalName || resource.filename}"`);
            res.setHeader('Content-Length', Buffer.byteLength(dummyContent));
            
            return res.send(dummyContent);
        }

        // Serve the actual file
        res.setHeader('Content-Type', resource.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${resource.originalName || resource.filename}"`);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('Download resource error:', error);
        res.status(500).json({
            success: false,
            message: 'Error downloading resource'
        });
    }
};

module.exports = {
    // Legacy function names for existing routes
    getStudentProfile,
    getStudentAttendance,
    getStudentMarks,
    getStudentDashboard,
    getStudentLeaves,
    applyLeave,
    getStudentNotices,
    getStudentResources,
    downloadResource
};