const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Student = require('../models/Student');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

/**
 * Create/Upload assignment
 * POST /api/assignments
 */
const createAssignment = async (req, res) => {
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
            title,
            description,
            subject,
            deadline,
            courseId,
            academicYear,
            semester,
            totalPoints,
            type,
            priority,
            instructions,
            allowLateSubmission,
            latePenalty,
            maxSubmissions,
            tags,
            remarks
        } = req.body;

        // Verify course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if faculty can upload to this course
        const userRole = req.user.role;
        const userId = req.user.userId;

        if (userRole === 'faculty' && course.instructor.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only create assignments for courses you teach.'
            });
        }

        // Handle file upload
        let fileData = {};
        if (req.file) {
            fileData = {
                fileUrl: req.file.path,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype
            };
        }

        // Handle additional attachments
        const attachments = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                attachments.push({
                    filename: file.originalname,
                    filePath: file.path,
                    fileSize: file.size,
                    mimeType: file.mimetype
                });
            });
        }

        // Create assignment
        const assignment = new Assignment({
            title,
            description,
            subject,
            deadline: new Date(deadline),
            courseId,
            academicYear,
            semester,
            totalPoints: totalPoints || 100,
            type: type || 'assignment',
            priority: priority || 'medium',
            instructions,
            allowLateSubmission: allowLateSubmission !== undefined ? allowLateSubmission : true,
            latePenalty: latePenalty || 10,
            maxSubmissions: maxSubmissions || 1,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            remarks,
            uploadedBy: userId,
            attachments,
            ...fileData
        });

        await assignment.save();

        // Populate the response
        await assignment.populate([
            { path: 'courseId', select: 'title code credits' },
            { path: 'uploadedBy', select: 'firstName lastName role' }
        ]);

        console.log(`✅ Assignment created: ${title} for course ${course.code}`);

        res.status(201).json({
            success: true,
            message: 'Assignment created successfully',
            data: { assignment }
        });

    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating assignment'
        });
    }
};

/**
 * Get assignments for a course
 * GET /api/assignments/course/:courseId
 */
const getCourseAssignments = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { 
            academicYear, 
            semester, 
            type, 
            priority,
            page = 1,
            limit = 20
        } = req.query;

        // Verify course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check access permissions
        const userRole = req.user.role;
        const userId = req.user.userId;

        // Students can only see published assignments
        const isPublished = userRole === 'student' ? true : null;

        // Faculty can only see assignments for courses they teach (unless admin)
        if (userRole === 'faculty' && course.instructor.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view assignments for courses you teach.'
            });
        }

        // Get assignments
        const assignments = await Assignment.getAssignmentsByCourse(courseId, {
            academicYear,
            semester,
            type,
            priority,
            isPublished
        });

        // If student, get assignments with submission status
        let formattedAssignments;
        if (userRole === 'student') {
            formattedAssignments = await Assignment.getAssignmentsForStudent(userId, {
                courseId,
                academicYear,
                semester,
                type
            });
        } else {
            formattedAssignments = assignments;
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedAssignments = formattedAssignments.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                course: {
                    id: course._id,
                    title: course.title,
                    code: course.code,
                    credits: course.credits
                },
                assignments: paginatedAssignments,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(formattedAssignments.length / limit),
                    totalAssignments: formattedAssignments.length,
                    hasNext: endIndex < formattedAssignments.length,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get course assignments error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching assignments'
        });
    }
};

/**
 * Get assignments for current student
 * GET /api/assignments/my-assignments
 */
const getMyAssignments = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'This endpoint is only for students'
            });
        }

        const { 
            courseId, 
            academicYear, 
            semester, 
            type,
            status, // 'pending', 'submitted', 'overdue'
            page = 1,
            limit = 20
        } = req.query;

        const studentId = req.user.userId;

        // Get all assignments for the student
        const assignments = await Assignment.getAssignmentsForStudent(studentId, {
            courseId,
            academicYear,
            semester,
            type
        });

        // Filter by status if specified
        let filteredAssignments = assignments;
        if (status) {
            filteredAssignments = assignments.filter(assignment => {
                switch (status) {
                    case 'pending':
                        return !assignment.hasSubmitted && !assignment.isOverdue;
                    case 'submitted':
                        return assignment.hasSubmitted;
                    case 'overdue':
                        return !assignment.hasSubmitted && assignment.isOverdue;
                    default:
                        return true;
                }
            });
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedAssignments = filteredAssignments.slice(startIndex, endIndex);

        // Calculate summary statistics
        const summary = {
            total: assignments.length,
            submitted: assignments.filter(a => a.hasSubmitted).length,
            pending: assignments.filter(a => !a.hasSubmitted && !a.isOverdue).length,
            overdue: assignments.filter(a => !a.hasSubmitted && a.isOverdue).length
        };

        res.json({
            success: true,
            data: {
                assignments: paginatedAssignments,
                summary,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(filteredAssignments.length / limit),
                    totalAssignments: filteredAssignments.length,
                    hasNext: endIndex < filteredAssignments.length,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get my assignments error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching assignments'
        });
    }
};

/**
 * Get single assignment by ID
 * GET /api/assignments/:id
 */
const getAssignmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const assignment = await Assignment.findById(id)
            .populate('courseId', 'title code credits')
            .populate('uploadedBy', 'firstName lastName role')
            .populate('submissions.student', 'firstName lastName rollNumber')
            .populate('submissions.gradedBy', 'firstName lastName role');

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Check access permissions
        const userRole = req.user.role;
        const userId = req.user.userId;

        // Students can only see published assignments
        if (userRole === 'student' && !assignment.isPublished) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Faculty can only see assignments for courses they teach (unless admin)
        if (userRole === 'faculty') {
            const course = await Course.findById(assignment.courseId);
            if (course && course.instructor.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only view assignments for courses you teach.'
                });
            }
        }

        // Increment view count
        await assignment.incrementViewCount();

        // For students, filter out other students' submissions
        let responseAssignment = assignment.toObject();
        if (userRole === 'student') {
            const studentSubmissions = assignment.submissions.filter(
                sub => sub.student._id.toString() === userId.toString()
            );
            responseAssignment.submissions = studentSubmissions;
            responseAssignment.hasSubmitted = studentSubmissions.length > 0;
            responseAssignment.submissionCount = studentSubmissions.length;
        }

        res.json({
            success: true,
            data: { assignment: responseAssignment }
        });

    } catch (error) {
        console.error('Get assignment by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching assignment'
        });
    }
};

/**
 * Download assignment file
 * GET /api/assignments/:id/download
 */
const downloadAssignment = async (req, res) => {
    try {
        const { id } = req.params;

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Check access permissions
        const userRole = req.user.role;
        const userId = req.user.userId;

        // Students can only download published assignments
        if (userRole === 'student' && !assignment.isPublished) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Faculty can only download assignments for courses they teach (unless admin)
        if (userRole === 'faculty') {
            const course = await Course.findById(assignment.courseId);
            if (course && course.instructor.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only download assignments for courses you teach.'
                });
            }
        }

        if (!assignment.fileUrl) {
            return res.status(404).json({
                success: false,
                message: 'No file attached to this assignment'
            });
        }

        // Check if file exists
        if (!fs.existsSync(assignment.fileUrl)) {
            return res.status(404).json({
                success: false,
                message: 'Assignment file not found on server'
            });
        }

        // Increment download count
        await assignment.incrementDownloadCount();

        // Set appropriate headers for file download
        res.setHeader('Content-Type', assignment.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${assignment.fileName}"`);
        
        // Stream the file
        const fileStream = fs.createReadStream(assignment.fileUrl);
        fileStream.pipe(res);

        console.log(`📥 Assignment downloaded: ${assignment.title} by ${userRole} ${userId}`);

    } catch (error) {
        console.error('Download assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while downloading assignment'
        });
    }
};

/**
 * Update assignment
 * PUT /api/assignments/:id
 */
const updateAssignment = async (req, res) => {
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

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Check permissions
        const userRole = req.user.role;
        const userId = req.user.userId;

        if (userRole === 'faculty') {
            // Faculty can only edit assignments for courses they teach
            const course = await Course.findById(assignment.courseId);
            if (!course || course.instructor.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only edit assignments for courses you teach.'
                });
            }
        } else if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only faculty and admin can edit assignments.'
            });
        }

        // Update allowed fields
        const allowedUpdates = [
            'title', 'description', 'subject', 'deadline', 'totalPoints',
            'type', 'priority', 'instructions', 'allowLateSubmission',
            'latePenalty', 'maxSubmissions', 'isPublished', 'tags', 'remarks'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'deadline') {
                    assignment[field] = new Date(req.body[field]);
                } else if (field === 'tags' && typeof req.body[field] === 'string') {
                    assignment[field] = req.body[field].split(',').map(tag => tag.trim());
                } else {
                    assignment[field] = req.body[field];
                }
            }
        });

        // Handle new file upload
        if (req.file) {
            // Delete old file if exists
            if (assignment.fileUrl && fs.existsSync(assignment.fileUrl)) {
                fs.unlinkSync(assignment.fileUrl);
            }
            
            assignment.fileUrl = req.file.path;
            assignment.fileName = req.file.originalname;
            assignment.fileSize = req.file.size;
            assignment.mimeType = req.file.mimetype;
        }

        await assignment.save();

        // Populate the response
        await assignment.populate([
            { path: 'courseId', select: 'title code credits' },
            { path: 'uploadedBy', select: 'firstName lastName role' }
        ]);

        console.log(`✅ Assignment updated: ${assignment.title} by ${userRole} ${userId}`);

        res.json({
            success: true,
            message: 'Assignment updated successfully',
            data: { assignment }
        });

    } catch (error) {
        console.error('Update assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating assignment'
        });
    }
};

/**
 * Delete assignment
 * DELETE /api/assignments/:id
 */
const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Check permissions
        const userRole = req.user.role;
        const userId = req.user.userId;

        if (userRole === 'faculty') {
            // Faculty can only delete assignments for courses they teach
            const course = await Course.findById(assignment.courseId);
            if (!course || course.instructor.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only delete assignments for courses you teach.'
                });
            }
        } else if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only faculty and admin can delete assignments.'
            });
        }

        // Soft delete
        assignment.isActive = false;
        await assignment.save();

        console.log(`🗑️ Assignment deleted: ${assignment.title} by ${userRole} ${userId}`);

        res.json({
            success: true,
            message: 'Assignment deleted successfully'
        });

    } catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting assignment'
        });
    }
};

/**
 * Get upcoming deadlines
 * GET /api/assignments/upcoming-deadlines
 */
const getUpcomingDeadlines = async (req, res) => {
    try {
        const { courseId, days = 7 } = req.query;
        const userRole = req.user.role;
        const userId = req.user.userId;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: 'Course ID is required'
            });
        }

        // Check access permissions
        if (userRole === 'faculty') {
            const course = await Course.findById(courseId);
            if (!course || course.instructor.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only view assignments for courses you teach.'
                });
            }
        }

        const upcomingAssignments = await Assignment.getUpcomingDeadlines(courseId, parseInt(days));

        // For students, add submission status
        let formattedAssignments = upcomingAssignments;
        if (userRole === 'student') {
            formattedAssignments = upcomingAssignments.map(assignment => {
                const studentSubmissions = assignment.submissions.filter(
                    sub => sub.student.toString() === userId.toString()
                );
                
                const assignmentObj = assignment.toObject();
                assignmentObj.hasSubmitted = studentSubmissions.length > 0;
                assignmentObj.submissionCount = studentSubmissions.length;
                delete assignmentObj.submissions; // Remove for privacy
                
                return assignmentObj;
            });
        }

        res.json({
            success: true,
            data: {
                assignments: formattedAssignments,
                daysAhead: parseInt(days)
            }
        });

    } catch (error) {
        console.error('Get upcoming deadlines error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching upcoming deadlines'
        });
    }
};

/**
 * Get assignment statistics
 * GET /api/assignments/:id/statistics
 */
const getAssignmentStatistics = async (req, res) => {
    try {
        const { id } = req.params;

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Check permissions - only faculty and admin
        const userRole = req.user.role;
        const userId = req.user.userId;

        if (userRole === 'faculty') {
            const course = await Course.findById(assignment.courseId);
            if (!course || course.instructor.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only view statistics for assignments in courses you teach.'
                });
            }
        } else if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only faculty and admin can view assignment statistics.'
            });
        }

        const statistics = await Assignment.getAssignmentStatistics(id);

        res.json({
            success: true,
            data: {
                assignment: {
                    id: assignment._id,
                    title: assignment.title,
                    totalPoints: assignment.totalPoints,
                    deadline: assignment.deadline
                },
                statistics
            }
        });

    } catch (error) {
        console.error('Get assignment statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching assignment statistics'
        });
    }
};

module.exports = {
    createAssignment,
    getCourseAssignments,
    getMyAssignments,
    getAssignmentById,
    downloadAssignment,
    updateAssignment,
    deleteAssignment,
    getUpcomingDeadlines,
    getAssignmentStatistics
};