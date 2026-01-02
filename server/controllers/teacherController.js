const StudentProfile = require('../models/StudentProfile');
const FacultyProfile = require('../models/FacultyProfile');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Leave = require('../models/Leave');
const Notice = require('../models/Notice');
const Resource = require('../models/Resource');
const User = require('../models/User');

/**
 * Get teacher profile and assigned students
 * GET /api/teacher/profile
 */
const getTeacherProfile = async (req, res) => {
    try {
        console.log('🔍 Getting teacher profile for user:', req.user.userId);
        
        // Find faculty profile by userId from JWT token
        let facultyProfile = await FacultyProfile.findOne({ userId: req.user.userId })
            .populate('userId', 'name email')
            .populate('assignedStudents');
        
        // If no faculty profile exists, create one
        if (!facultyProfile) {
            const user = await User.findById(req.user.userId);
            
            // Generate a faculty ID
            const count = await FacultyProfile.countDocuments();
            const facultyId = `FAC${String(count + 1).padStart(4, '0')}`;
            
            facultyProfile = new FacultyProfile({
                userId: req.user.userId,
                facultyId: facultyId,
                department: 'Computer Science and Engineering',
                designation: 'Assistant Professor',
                joiningDate: new Date(),
                subjects: [],
                assignedStudents: []
            });
            await facultyProfile.save();
            
            // Populate the userId field
            facultyProfile = await FacultyProfile.findById(facultyProfile._id)
                .populate('userId', 'name email')
                .populate('assignedStudents');
            console.log(`✅ Created faculty profile for: ${user.email}`);
        }
        
        res.json({
            success: true,
            data: {
                id: facultyProfile._id,
                name: facultyProfile.userId.name,
                email: facultyProfile.userId.email,
                facultyId: facultyProfile.facultyId,
                department: facultyProfile.department,
                designation: facultyProfile.designation,
                subjects: facultyProfile.subjects,
                assignedStudents: facultyProfile.assignedStudents.length,
                joiningDate: facultyProfile.joiningDate,
                isActive: facultyProfile.isActive
            }
        });
        
    } catch (error) {
        console.error('Get teacher profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching teacher profile'
        });
    }
};

/**
 * Get all students (for teacher view)
 * GET /api/teacher/students
 */
const getAllStudents = async (req, res) => {
    try {
        console.log('🔍 Teacher getting all students');
        
        // Get all student profiles
        const students = await StudentProfile.find({ isActive: true })
            .populate('userId', 'name email')
            .sort({ rollNumber: 1 });
        
        res.json({
            success: true,
            data: students.map(student => ({
                id: student._id,
                userId: student.userId._id,
                name: student.userId.name,
                email: student.userId.email,
                rollNumber: student.rollNumber,
                course: student.course,
                semester: student.semester,
                department: student.department,
                cgpa: student.cgpa,
                enrollmentYear: student.enrollmentYear
            }))
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
 * Update student attendance
 * POST /api/teacher/attendance
 */
const updateAttendance = async (req, res) => {
    try {
        const { studentId, subject, subjectCode, date, status, semester, academicYear, classType, duration, remarks } = req.body;
        
        console.log('🔍 Teacher updating attendance:', { studentId, subject, status });
        
        // Get faculty profile
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.userId });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }
        
        // Create new attendance record
        const attendance = new Attendance({
            studentId,
            facultyId: facultyProfile._id,
            subject,
            subjectCode: subjectCode || subject.toUpperCase().replace(/\s+/g, ''),
            date: date ? new Date(date) : new Date(),
            status,
            semester: semester || 1,
            academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
            classType: classType || 'lecture',
            duration: duration || 60,
            remarks,
            recordedBy: req.user.userId
        });
        
        await attendance.save();
        
        res.json({
            success: true,
            message: 'Attendance updated successfully',
            data: {
                subject: attendance.subject,
                date: attendance.date,
                status: attendance.status,
                classType: attendance.classType
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
 * Add/Update student marks
 * POST /api/teacher/marks
 */
const updateMarks = async (req, res) => {
    try {
        const { studentId, subject, subjectCode, examType, totalMarks, maxMarks, semester, academicYear, credits, examDate, remarks } = req.body;
        
        console.log('🔍 Teacher updating marks:', { studentId, subject, examType, totalMarks, maxMarks });
        
        // Get faculty profile
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.userId });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }
        
        // Check if marks already exist for this student, subject, and exam type
        let marks = await Marks.findOne({
            studentId,
            facultyId: facultyProfile._id,
            subject,
            examType,
            semester: semester || 1,
            academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
        });

        if (marks) {
            // Update existing marks
            marks.totalMarks = totalMarks;
            marks.maxMarks = maxMarks;
            marks.credits = credits || 3;
            marks.examDate = examDate ? new Date(examDate) : undefined;
            marks.remarks = remarks;
            marks.recordedBy = req.user.userId;
            await marks.save();
        } else {
            // Create new marks record
            marks = new Marks({
                studentId,
                facultyId: facultyProfile._id,
                subject,
                subjectCode: subjectCode || subject.toUpperCase().replace(/\s+/g, ''),
                examType,
                totalMarks,
                maxMarks,
                credits: credits || 3,
                semester: semester || 1,
                academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
                examDate: examDate ? new Date(examDate) : undefined,
                remarks,
                recordedBy: req.user.userId
            });
            await marks.save();
        }
        
        // Update student CGPA
        const studentProfile = await StudentProfile.findById(studentId);
        if (studentProfile) {
            await studentProfile.calculateCGPA();
        }
        
        res.json({
            success: true,
            message: 'Marks added successfully',
            data: {
                subject: marks.subject,
                examType: marks.examType,
                totalMarks: marks.totalMarks,
                maxMarks: marks.maxMarks,
                percentage: marks.percentage,
                grade: marks.grade,
                gradePoints: marks.gradePoints
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
 * Get leave applications for review
 * GET /api/teacher/leaves
 */
const getLeaveApplications = async (req, res) => {
    try {
        const { status } = req.query;
        
        // Get faculty profile
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.userId });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        // Get user IDs of assigned students
        const assignedStudents = await StudentProfile.find({
            _id: { $in: facultyProfile.assignedStudents }
        }).select('userId');
        
        const studentUserIds = assignedStudents.map(student => student.userId);

        // Build query
        let query = { userId: { $in: studentUserIds } };
        if (status) {
            query.status = status;
        }
        
        const leaves = await Leave.find(query)
            .populate('userId', 'name email role')
            .populate('reviewedBy', 'name email')
            .sort({ appliedDate: -1 });
        
        res.json({
            success: true,
            data: leaves.map(leave => ({
                id: leave._id,
                studentName: leave.userId?.name || 'Unknown',
                studentEmail: leave.userId?.email || 'Unknown',
                leaveType: leave.leaveType,
                reason: leave.reason,
                fromDate: leave.fromDate,
                toDate: leave.toDate,
                totalDays: leave.totalDays,
                status: leave.status,
                priority: leave.priority,
                appliedDate: leave.appliedDate,
                reviewComments: leave.reviewComments,
                reviewDate: leave.reviewDate
            }))
        });
        
    } catch (error) {
        console.error('Get leave applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching leave applications'
        });
    }
};

/**
 * Approve/Reject leave application
 * PATCH /api/teacher/leave/:id/review
 */
const reviewLeaveApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comments } = req.body;
        
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be approved or rejected'
            });
        }
        
        const leave = await Leave.findById(id);
        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave application not found'
            });
        }
        
        leave.status = status;
        leave.reviewComments = comments;
        leave.reviewedBy = req.user.userId;
        leave.reviewDate = new Date();
        
        await leave.save();
        
        res.json({
            success: true,
            message: `Leave application ${status} successfully`,
            data: {
                id: leave._id,
                status: leave.status,
                reviewComments: leave.reviewComments,
                reviewDate: leave.reviewDate
            }
        });
        
    } catch (error) {
        console.error('Review leave application error:', error);
        res.status(500).json({
            success: false,
            message: 'Error reviewing leave application'
        });
    }
};

/**
 * Create notice
 * POST /api/teacher/notice
 */
const createNotice = async (req, res) => {
    try {
        const { title, content, priority, category, targetGroup, expiryDate } = req.body;
        
        // Get faculty profile
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.userId });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }
        
        const notice = new Notice({
            facultyId: facultyProfile._id,
            title,
            content,
            priority: priority || 'medium',
            category,
            targetGroup: targetGroup || { allStudents: true },
            expiryDate: expiryDate ? new Date(expiryDate) : undefined
        });
        
        await notice.save();
        
        res.status(201).json({
            success: true,
            message: 'Notice created successfully',
            data: {
                id: notice._id,
                title: notice.title,
                category: notice.category,
                priority: notice.priority,
                publishDate: notice.publishDate
            }
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
 * Get teacher's notices
 * GET /api/teacher/notices
 */
const getTeacherNotices = async (req, res) => {
    try {
        // Get faculty profile
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.userId });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }
        
        const notices = await Notice.find({ facultyId: facultyProfile._id })
            .sort({ publishDate: -1 });
        
        res.json({
            success: true,
            data: notices.map(notice => ({
                id: notice._id,
                title: notice.title,
                content: notice.content,
                priority: notice.priority,
                category: notice.category,
                isActive: notice.isActive,
                publishDate: notice.publishDate,
                expiryDate: notice.expiryDate,
                targetGroup: notice.targetGroup,
                viewCount: notice.viewCount
            }))
        });
        
    } catch (error) {
        console.error('Get teacher notices error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notices'
        });
    }
};

/**
 * Upload a new resource
 * POST /api/teacher/resource
 */
const uploadResource = async (req, res) => {
    try {
        const { title, description, subject, subjectCode, resourceType, semester, targetGroup } = req.body;
        
        // Get faculty profile
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.userId });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }
        
        const resource = new Resource({
            facultyId: facultyProfile._id,
            title,
            description,
            subject,
            subjectCode,
            resourceType: resourceType || 'document',
            semester: semester || 1,
            targetGroup: targetGroup || { allStudents: true },
            // Note: File upload handling would be implemented with multer middleware
            fileUrl: '/uploads/placeholder.pdf', // Placeholder for now
            originalName: title + '.pdf',
            mimeType: 'application/pdf',
            fileSize: 1024,
            uploadDate: new Date()
        });
        
        await resource.save();
        
        res.status(201).json({
            success: true,
            message: 'Resource uploaded successfully',
            data: {
                id: resource._id,
                title: resource.title,
                subject: resource.subject,
                uploadDate: resource.uploadDate
            }
        });
        
    } catch (error) {
        console.error('Upload resource error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading resource'
        });
    }
};

/**
 * Get teacher's uploaded resources
 * GET /api/teacher/resources
 */
const getTeacherResources = async (req, res) => {
    try {
        // Get faculty profile
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.userId });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }
        
        const resources = await Resource.find({ facultyId: facultyProfile._id })
            .sort({ uploadDate: -1 });
        
        res.json({
            success: true,
            data: resources.map(resource => ({
                id: resource._id,
                title: resource.title,
                description: resource.description,
                subject: resource.subject,
                subjectCode: resource.subjectCode,
                resourceType: resource.resourceType,
                semester: resource.semester,
                uploadDate: resource.uploadDate,
                downloadCount: resource.downloadCount,
                isActive: resource.isActive
            }))
        });
        
    } catch (error) {
        console.error('Get teacher resources error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching resources'
        });
    }
};

/**
 * Delete a resource
 * DELETE /api/teacher/resource/:id
 */
const deleteResource = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get faculty profile
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.userId });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }
        
        const resource = await Resource.findOne({ _id: id, facultyId: facultyProfile._id });
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found or access denied'
            });
        }
        
        await Resource.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Resource deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete resource error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting resource'
        });
    }
};

/**
 * Get attendance records for a specific student
 * GET /api/teacher/attendance/:studentId
 */
const getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // Get faculty profile
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.userId });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }
        
        const attendance = await Attendance.find({ 
            studentId: studentId,
            facultyId: facultyProfile._id 
        })
        .populate('studentId', 'rollNumber')
        .populate('studentId.userId', 'name email')
        .sort({ date: -1 });
        
        res.json({
            success: true,
            data: attendance.map(record => ({
                id: record._id,
                date: record.date,
                status: record.status,
                subject: record.subject,
                subjectCode: record.subjectCode,
                classType: record.classType,
                duration: record.duration,
                semester: record.semester,
                academicYear: record.academicYear
            }))
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
 * Get marks records for a specific student
 * GET /api/teacher/marks/:studentId
 */
const getStudentMarks = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // Get faculty profile
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.userId });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }
        
        const marks = await Marks.find({ 
            studentId: studentId,
            facultyId: facultyProfile._id 
        })
        .populate('studentId', 'rollNumber')
        .populate('studentId.userId', 'name email')
        .sort({ dateRecorded: -1 });
        
        res.json({
            success: true,
            data: marks.map(record => ({
                id: record._id,
                subject: record.subject,
                subjectCode: record.subjectCode,
                examType: record.examType,
                totalMarks: record.totalMarks,
                maxMarks: record.maxMarks,
                percentage: record.percentage,
                grade: record.grade,
                gradePoints: record.gradePoints,
                credits: record.credits,
                semester: record.semester,
                academicYear: record.academicYear,
                dateRecorded: record.dateRecorded,
                isPublished: record.isPublished
            }))
        });
        
    } catch (error) {
        console.error('Get student marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student marks'
        });
    }
};

module.exports = {
    getTeacherProfile,
    getAllStudents,
    updateAttendance,
    updateMarks,
    getLeaveApplications,
    reviewLeaveApplication,
    createNotice,
    getTeacherNotices,
    uploadResource,
    getTeacherResources,
    deleteResource,
    getStudentAttendance,
    getStudentMarks
};