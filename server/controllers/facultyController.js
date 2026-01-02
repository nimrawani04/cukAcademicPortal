const User = require('../models/User');
const FacultyProfile = require('../models/FacultyProfile');
const StudentProfile = require('../models/StudentProfile');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Notice = require('../models/Notice');
const Resource = require('../models/Resource');
const Leave = require('../models/Leave');

// Get faculty dashboard data
const getDashboard = async (req, res) => {
    try {
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.id })
            .populate('userId', 'name email');

        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        // Get assigned students count
        const assignedStudentsCount = facultyProfile.assignedStudents.length;

        // Get notices count
        const noticesCount = await Notice.countDocuments({ 
            facultyId: facultyProfile._id,
            isActive: true 
        });

        // Get resources count
        const resourcesCount = await Resource.countDocuments({ 
            facultyId: facultyProfile._id,
            isActive: true 
        });

        // Get pending leaves count
        const pendingLeavesCount = await Leave.countDocuments({
            status: 'pending',
            userId: { $in: facultyProfile.assignedStudents }
        });

        const stats = {
            assignedStudents: assignedStudentsCount,
            activeNotices: noticesCount,
            uploadedResources: resourcesCount,
            pendingLeaves: pendingLeavesCount
        };

        res.json({
            success: true,
            data: {
                profile: facultyProfile,
                stats
            }
        });
    } catch (error) {
        console.error('Faculty dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
};

// Get faculty profile
const getProfile = async (req, res) => {
    try {
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.id })
            .populate('userId', 'name email phone')
            .populate('assignedStudents', 'rollNumber')
            .populate('assignedStudents.userId', 'name email');

        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        res.json({
            success: true,
            data: facultyProfile
        });
    } catch (error) {
        console.error('Get faculty profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
};

// Update faculty profile
const updateProfile = async (req, res) => {
    try {
        const updateData = req.body;
        
        const facultyProfile = await FacultyProfile.findOneAndUpdate(
            { userId: req.user.id },
            updateData,
            { new: true, runValidators: true }
        ).populate('userId', 'name email phone');

        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: facultyProfile
        });
    } catch (error) {
        console.error('Update faculty profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
};

// Get assigned students
const getAssignedStudents = async (req, res) => {
    try {
        const { course, semester, subject } = req.query;
        
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.id });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        let query = { _id: { $in: facultyProfile.assignedStudents } };
        
        if (course) query.course = course;
        if (semester) query.semester = parseInt(semester);

        const students = await StudentProfile.find(query)
            .populate('userId', 'name email phone')
            .sort({ rollNumber: 1 });

        // If subject filter is provided, filter by selected courses
        let filteredStudents = students;
        if (subject) {
            filteredStudents = students.filter(student => 
                student.selectedCourses.some(course => 
                    course.subjectName === subject || course.subjectCode === subject
                )
            );
        }

        res.json({
            success: true,
            data: filteredStudents
        });
    } catch (error) {
        console.error('Get assigned students error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assigned students',
            error: error.message
        });
    }
};

// ATTENDANCE MANAGEMENT

// Mark attendance
const markAttendance = async (req, res) => {
    try {
        const { attendanceData } = req.body; // Array of attendance records
        
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.id });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        const attendanceRecords = [];
        
        for (const record of attendanceData) {
            const attendance = new Attendance({
                studentId: record.studentId,
                facultyId: facultyProfile._id,
                subject: record.subject,
                subjectCode: record.subjectCode,
                date: record.date || new Date(),
                status: record.status,
                semester: record.semester,
                academicYear: record.academicYear,
                classType: record.classType || 'lecture',
                duration: record.duration || 60,
                remarks: record.remarks,
                recordedBy: req.user.id
            });

            await attendance.save();
            attendanceRecords.push(attendance);
        }

        res.json({
            success: true,
            message: 'Attendance marked successfully',
            data: attendanceRecords
        });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark attendance',
            error: error.message
        });
    }
};

// Get attendance records
const getAttendance = async (req, res) => {
    try {
        const { studentId, subject, academicYear, startDate, endDate, page = 1, limit = 50 } = req.query;
        
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.id });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        const query = { facultyId: facultyProfile._id };
        
        if (studentId) query.studentId = studentId;
        if (subject) query.subject = subject;
        if (academicYear) query.academicYear = academicYear;
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const attendance = await Attendance.find(query)
            .populate('studentId', 'rollNumber')
            .populate('studentId.userId', 'name email')
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

// Get attendance summary
const getAttendanceSummary = async (req, res) => {
    try {
        const { subject, academicYear, semester } = req.query;
        
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.id });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        const matchQuery = { facultyId: facultyProfile._id };
        if (subject) matchQuery.subject = subject;
        if (academicYear) matchQuery.academicYear = academicYear;
        if (semester) matchQuery.semester = parseInt(semester);

        const summary = await Attendance.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$studentId',
                    totalClasses: { $sum: 1 },
                    attendedClasses: {
                        $sum: {
                            $cond: [
                                { $in: ['$status', ['present', 'late']] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $addFields: {
                    percentage: {
                        $multiply: [
                            { $divide: ['$attendedClasses', '$totalClasses'] },
                            100
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: 'studentprofiles',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'student'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'student.userId',
                    foreignField: '_id',
                    as: 'user'
                }
            }
        ]);

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get attendance summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance summary',
            error: error.message
        });
    }
};

// MARKS MANAGEMENT

// Add/Update marks
const addMarks = async (req, res) => {
    try {
        const { marksData } = req.body; // Array of marks records
        
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.id });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        const marksRecords = [];
        
        for (const record of marksData) {
            // Check if marks already exist for this student, subject, and exam type
            let marks = await Marks.findOne({
                studentId: record.studentId,
                facultyId: facultyProfile._id,
                subject: record.subject,
                examType: record.examType,
                semester: record.semester,
                academicYear: record.academicYear
            });

            if (marks) {
                // Update existing marks
                marks.totalMarks = record.totalMarks;
                marks.maxMarks = record.maxMarks;
                marks.examDate = record.examDate;
                marks.remarks = record.remarks;
                marks.recordedBy = req.user.id;
                await marks.save();
            } else {
                // Create new marks record
                marks = new Marks({
                    studentId: record.studentId,
                    facultyId: facultyProfile._id,
                    subject: record.subject,
                    subjectCode: record.subjectCode,
                    examType: record.examType,
                    totalMarks: record.totalMarks,
                    maxMarks: record.maxMarks,
                    credits: record.credits || 3,
                    semester: record.semester,
                    academicYear: record.academicYear,
                    examDate: record.examDate,
                    remarks: record.remarks,
                    recordedBy: req.user.id
                });
                await marks.save();
            }

            marksRecords.push(marks);
        }

        res.json({
            success: true,
            message: 'Marks added/updated successfully',
            data: marksRecords
        });
    } catch (error) {
        console.error('Add marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add/update marks',
            error: error.message
        });
    }
};

// Get marks records
const getMarks = async (req, res) => {
    try {
        const { studentId, subject, examType, academicYear, semester, page = 1, limit = 50 } = req.query;
        
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.id });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        const query = { facultyId: facultyProfile._id };
        
        if (studentId) query.studentId = studentId;
        if (subject) query.subject = subject;
        if (examType) query.examType = examType;
        if (academicYear) query.academicYear = academicYear;
        if (semester) query.semester = parseInt(semester);

        const marks = await Marks.find(query)
            .populate('studentId', 'rollNumber')
            .populate('studentId.userId', 'name email')
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

// Publish marks
const publishMarks = async (req, res) => {
    try {
        const { marksIds } = req.body; // Array of marks IDs to publish
        
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.id });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        await Marks.updateMany(
            { 
                _id: { $in: marksIds },
                facultyId: facultyProfile._id 
            },
            { 
                isPublished: true,
                publishedAt: new Date()
            }
        );

        res.json({
            success: true,
            message: 'Marks published successfully'
        });
    } catch (error) {
        console.error('Publish marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to publish marks',
            error: error.message
        });
    }
};

// NOTICE MANAGEMENT

// Create notice
const createNotice = async (req, res) => {
    try {
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.id });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        const notice = new Notice({
            facultyId: facultyProfile._id,
            ...req.body
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
            message: 'Failed to create notice',
            error: error.message
        });
    }
};

// Get faculty notices
const getNotices = async (req, res) => {
    try {
        const { category, isActive, page = 1, limit = 20 } = req.query;
        
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.id });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        const query = { facultyId: facultyProfile._id };
        if (category) query.category = category;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const notices = await Notice.find(query)
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

// Update notice
const updateNotice = async (req, res) => {
    try {
        const { noticeId } = req.params;
        
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.id });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        const notice = await Notice.findOneAndUpdate(
            { _id: noticeId, facultyId: facultyProfile._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!notice) {
            return res.status(404).json({
                success: false,
                message: 'Notice not found'
            });
        }

        res.json({
            success: true,
            message: 'Notice updated successfully',
            data: notice
        });
    } catch (error) {
        console.error('Update notice error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notice',
            error: error.message
        });
    }
};

// Delete notice
const deleteNotice = async (req, res) => {
    try {
        const { noticeId } = req.params;
        
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.id });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        const notice = await Notice.findOneAndDelete({
            _id: noticeId,
            facultyId: facultyProfile._id
        });

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

// Upload resource
const uploadResource = async (req, res) => {
    try {
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.id });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        const resource = new Resource({
            facultyId: facultyProfile._id,
            ...req.body
        });

        await resource.save();

        res.status(201).json({
            success: true,
            message: 'Resource uploaded successfully',
            data: resource
        });
    } catch (error) {
        console.error('Upload resource error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload resource',
            error: error.message
        });
    }
};

// Get faculty resources
const getResources = async (req, res) => {
    try {
        const { subject, resourceType, semester, page = 1, limit = 20 } = req.query;
        
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.id });
        if (!facultyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Faculty profile not found'
            });
        }

        const query = { facultyId: facultyProfile._id, isActive: true };
        if (subject) query.subject = subject;
        if (resourceType) query.resourceType = resourceType;
        if (semester) query.semester = parseInt(semester);

        const resources = await Resource.find(query)
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

// LEAVE MANAGEMENT

// Get leave applications from assigned students
const getLeaveApplications = async (req, res) => {
    try {
        const { status, leaveType, page = 1, limit = 20 } = req.query;
        
        const facultyProfile = await FacultyProfile.findOne({ userId: req.user.id });
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

        const query = { userId: { $in: studentUserIds } };
        if (status) query.status = status;
        if (leaveType) query.leaveType = leaveType;

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
        console.error('Get leave applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leave applications',
            error: error.message
        });
    }
};

// Review leave application
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
        leave.reviewedBy = req.user.id;
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

module.exports = {
    getDashboard,
    getProfile,
    updateProfile,
    getAssignedStudents,
    markAttendance,
    getAttendance,
    getAttendanceSummary,
    addMarks,
    getMarks,
    publishMarks,
    createNotice,
    getNotices,
    updateNotice,
    deleteNotice,
    uploadResource,
    getResources,
    getLeaveApplications,
    reviewLeave
};