const Notice = require('../models/Notice');
const Course = require('../models/Course');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { validationResult } = require('express-validator');
const emailService = require('../services/emailService');

/**
 * Create a new notice
 * POST /api/notices
 * Only faculty and admin can create notices
 */
const createNotice = async (req, res) => {
    try {
        // Check for validation errors
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
            content,
            priority,
            targetAudience,
            expiryDate,
            targetCourses,
            targetYears,
            type,
            publishDate
        } = req.body;

        const createdBy = req.user.userId;

        // Validate target courses if specified
        if (targetAudience === 'specific_course' && targetCourses && targetCourses.length > 0) {
            const courses = await Course.find({ _id: { $in: targetCourses } });
            if (courses.length !== targetCourses.length) {
                return res.status(400).json({
                    success: false,
                    message: 'One or more target courses not found'
                });
            }
        }

        // Handle file attachments if any
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

        // Create notice
        const notice = new Notice({
            title,
            content,
            priority: priority || 'normal',
            targetAudience: targetAudience || 'all',
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            createdBy,
            targetCourses: targetAudience === 'specific_course' ? targetCourses : [],
            targetYears: targetAudience === 'specific_year' ? targetYears : [],
            type: type || 'general',
            publishDate: publishDate ? new Date(publishDate) : new Date(),
            attachments
        });

        await notice.save();

        // Populate creator information
        await notice.populate('createdBy', 'firstName lastName role');
        await notice.populate('targetCourses', 'title code');

        console.log(`✅ Notice created by ${req.user.role} ${createdBy}: ${title}`);

        // Send email notifications for important/urgent notices
        if (priority === 'important' || priority === 'urgent') {
            try {
                await sendNoticeEmailNotifications(notice);
            } catch (emailError) {
                console.error('Failed to send notice email notifications:', emailError);
                // Don't fail the notice creation if email fails
            }
        }

        res.status(201).json({
            success: true,
            message: 'Notice created successfully',
            data: { notice }
        });

    } catch (error) {
        console.error('Create notice error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating notice'
        });
    }
};

/**
 * Get all notices based on user role and targeting
 * GET /api/notices
 */
const getNotices = async (req, res) => {
    try {
        const { page = 1, limit = 10, priority, type, search } = req.query;
        const userRole = req.user.role;
        const userId = req.user.userId;

        // Use the static method from the Notice model
        const result = await Notice.getNoticesForUser(userId, userRole, {
            page: parseInt(page),
            limit: parseInt(limit),
            priority,
            type,
            search
        });

        // Mark notices as read by current user (for students and faculty)
        if (userRole !== 'admin' && result.notices.length > 0) {
            const noticeIds = result.notices.map(notice => notice._id);
            await Notice.updateMany(
                {
                    _id: { $in: noticeIds },
                    'readBy.user': { $ne: userId }
                },
                {
                    $push: {
                        readBy: {
                            user: userId,
                            readAt: new Date()
                        }
                    }
                }
            );
        }

        // Format notices for response
        const formattedNotices = result.notices.map(notice => ({
            id: notice._id,
            title: notice.title,
            content: notice.content,
            priority: notice.priority,
            targetAudience: notice.targetAudience,
            expiryDate: notice.expiryDate,
            createdBy: notice.createdBy,
            type: notice.type,
            targetCourses: notice.targetCourses,
            targetYears: notice.targetYears,
            attachments: notice.attachments,
            publishDate: notice.publishDate,
            createdAt: notice.createdAt,
            updatedAt: notice.updatedAt,
            viewCount: notice.viewCount,
            readCount: notice.readCount,
            isUrgent: notice.isUrgent,
            daysUntilExpiry: notice.daysUntilExpiry,
            isRead: notice.readBy.some(read => read.user.toString() === userId.toString())
        }));

        res.json({
            success: true,
            data: {
                notices: formattedNotices,
                pagination: result.pagination
            }
        });

    } catch (error) {
        console.error('Get notices error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching notices'
        });
    }
};

/**
 * Get notices specifically for students
 * GET /api/notices/students
 * Public endpoint that filters notices for student audience
 */
const getNoticesForStudents = async (req, res) => {
    try {
        const { page = 1, limit = 10, priority, search, year, courseId } = req.query;

        // Build query for student-targeted notices
        let query = {
            isActive: true,
            publishDate: { $lte: new Date() },
            $or: [
                { expiryDate: null },
                { expiryDate: { $gte: new Date() } }
            ],
            $and: [{
                $or: [
                    { targetAudience: 'all' },
                    { targetAudience: 'students' }
                ]
            }]
        };

        // Add year-specific notices if year is provided
        if (year) {
            query.$and[0].$or.push({
                targetAudience: 'specific_year',
                targetYears: parseInt(year)
            });
        }

        // Add course-specific notices if courseId is provided
        if (courseId) {
            query.$and[0].$or.push({
                targetAudience: 'specific_course',
                targetCourses: courseId
            });
        }

        // Add additional filters
        if (priority) query.priority = priority;
        if (search) {
            query.$and.push({
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { content: { $regex: search, $options: 'i' } }
                ]
            });
        }

        // Execute query with pagination
        const notices = await Notice.find(query)
            .populate('createdBy', 'firstName lastName role')
            .populate('targetCourses', 'title code')
            .sort({ priority: -1, publishDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Get total count for pagination
        const total = await Notice.countDocuments(query);

        // Format notices for response
        const formattedNotices = notices.map(notice => ({
            id: notice._id,
            title: notice.title,
            content: notice.content,
            priority: notice.priority,
            targetAudience: notice.targetAudience,
            expiryDate: notice.expiryDate,
            createdBy: notice.createdBy,
            type: notice.type,
            publishDate: notice.publishDate,
            createdAt: notice.createdAt,
            viewCount: notice.viewCount,
            isUrgent: notice.isUrgent,
            daysUntilExpiry: notice.daysUntilExpiry
        }));

        res.json({
            success: true,
            data: {
                notices: formattedNotices,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalNotices: total,
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get notices for students error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching notices for students'
        });
    }
};

/**
 * Get a specific notice by ID
 * GET /api/notices/:id
 */
const getNoticeById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const notice = await Notice.findById(id)
            .populate('createdBy', 'firstName lastName role')
            .populate('targetCourses', 'title code');

        if (!notice) {
            return res.status(404).json({
                success: false,
                message: 'Notice not found'
            });
        }

        // Check if notice is visible (active and not expired)
        if (!notice.isVisible()) {
            return res.status(404).json({
                success: false,
                message: 'Notice not available'
            });
        }

        // Check if user has access to this notice
        const userRole = req.user.role;
        let hasAccess = false;

        if (userRole === 'admin') {
            hasAccess = true;
        } else if (notice.targetAudience === 'all') {
            hasAccess = true;
        } else if (notice.targetAudience === userRole + 's') { // 'students' or 'faculty'
            hasAccess = true;
        } else if (notice.targetAudience === 'specific_course') {
            // Check if user is enrolled/teaching in target courses
            const userCourses = await Course.find({
                $or: [
                    { 'enrolledStudents.student': userId },
                    { instructor: userId }
                ]
            }).select('_id');

            const userCourseIds = userCourses.map(c => c._id.toString());
            const targetCourseIds = notice.targetCourses.map(c => c._id.toString());
            
            hasAccess = targetCourseIds.some(id => userCourseIds.includes(id));
        } else if (notice.targetAudience === 'specific_year' && userRole === 'student') {
            const Student = require('../models/Student');
            const student = await Student.findById(userId);
            hasAccess = student && notice.targetYears.includes(student.year);
        }

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to view this notice.'
            });
        }

        // Mark as read and increment view count
        await notice.markAsRead(userId);
        await notice.incrementViewCount();

        res.json({
            success: true,
            data: { notice }
        });

    } catch (error) {
        console.error('Get notice by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching notice'
        });
    }
};

/**
 * Update a notice (Edit notice)
 * PUT /api/notices/:id
 * Only the creator or admin can update notices
 */
const updateNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const notice = await Notice.findById(id);
        if (!notice) {
            return res.status(404).json({
                success: false,
                message: 'Notice not found'
            });
        }

        // Check if user can update this notice
        if (userRole !== 'admin' && notice.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only update your own notices.'
            });
        }

        // Validate the request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        // Update allowed fields
        const allowedUpdates = [
            'title', 'content', 'priority', 'targetAudience',
            'expiryDate', 'targetCourses', 'targetYears', 'type'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'expiryDate' && req.body[field]) {
                    notice[field] = new Date(req.body[field]);
                } else {
                    notice[field] = req.body[field];
                }
            }
        });

        // Handle file attachments if any
        if (req.files && req.files.length > 0) {
            const newAttachments = req.files.map(file => ({
                filename: file.originalname,
                filePath: file.path,
                fileSize: file.size,
                mimeType: file.mimetype
            }));
            notice.attachments.push(...newAttachments);
        }

        await notice.save();

        await notice.populate('createdBy', 'firstName lastName role');
        await notice.populate('targetCourses', 'title code');

        console.log(`✅ Notice updated by ${userRole} ${userId}: ${notice.title}`);

        res.json({
            success: true,
            message: 'Notice updated successfully',
            data: { notice }
        });

    } catch (error) {
        console.error('Update notice error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating notice'
        });
    }
};

/**
 * Delete a notice
 * DELETE /api/notices/:id
 * Only the creator or admin can delete notices
 */
const deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const notice = await Notice.findById(id);
        if (!notice) {
            return res.status(404).json({
                success: false,
                message: 'Notice not found'
            });
        }

        // Check if user can delete this notice
        if (userRole !== 'admin' && notice.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete your own notices.'
            });
        }

        // Soft delete by setting isActive to false
        notice.isActive = false;
        await notice.save();

        console.log(`🗑️ Notice deleted by ${userRole} ${userId}: ${notice.title}`);

        res.json({
            success: true,
            message: 'Notice deleted successfully'
        });

    } catch (error) {
        console.error('Delete notice error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting notice'
        });
    }
};

/**
 * Send email notifications for important notices
 * @param {Object} notice - The notice object
 */
const sendNoticeEmailNotifications = async (notice) => {
    try {
        let recipients = [];

        // Get recipients based on target audience
        switch (notice.targetAudience) {
            case 'all':
                // Get all active users
                recipients = await User.find({ 
                    isActive: true,
                    isEmailVerified: true 
                }).select('email firstName lastName role');
                break;

            case 'students':
                // Get all active students
                recipients = await User.find({ 
                    role: 'student',
                    isActive: true,
                    isEmailVerified: true 
                }).select('email firstName lastName role');
                break;

            case 'faculty':
                // Get all active faculty
                recipients = await User.find({ 
                    role: 'faculty',
                    isActive: true,
                    isEmailVerified: true 
                }).select('email firstName lastName role');
                break;

            case 'specific_course':
                if (notice.targetCourses && notice.targetCourses.length > 0) {
                    // Get students enrolled in target courses and faculty teaching them
                    const courses = await Course.find({ 
                        _id: { $in: notice.targetCourses } 
                    }).populate('enrolledStudents.student', 'email firstName lastName role')
                      .populate('instructor', 'email firstName lastName role');

                    const studentIds = new Set();
                    const facultyIds = new Set();

                    courses.forEach(course => {
                        // Add enrolled students
                        course.enrolledStudents.forEach(enrollment => {
                            if (enrollment.student && enrollment.student.isActive) {
                                studentIds.add(enrollment.student._id.toString());
                                recipients.push(enrollment.student);
                            }
                        });

                        // Add course instructor
                        if (course.instructor && course.instructor.isActive) {
                            facultyIds.add(course.instructor._id.toString());
                            recipients.push(course.instructor);
                        }
                    });

                    // Remove duplicates
                    recipients = recipients.filter((recipient, index, self) => 
                        index === self.findIndex(r => r._id.toString() === recipient._id.toString())
                    );
                }
                break;

            case 'specific_year':
                if (notice.targetYears && notice.targetYears.length > 0) {
                    // Get students in specific years
                    const students = await Student.find({ 
                        year: { $in: notice.targetYears } 
                    }).populate('userId', 'email firstName lastName role isActive isEmailVerified');

                    recipients = students
                        .filter(student => student.userId && student.userId.isActive && student.userId.isEmailVerified)
                        .map(student => student.userId);
                }
                break;

            default:
                console.log('Unknown target audience for notice email notifications');
                return;
        }

        if (recipients.length === 0) {
            console.log('No recipients found for notice email notifications');
            return;
        }

        // Prepare notice details for email
        const noticeDetails = {
            title: notice.title,
            content: notice.content,
            priority: notice.priority,
            createdBy: notice.createdBy ? `${notice.createdBy.firstName} ${notice.createdBy.lastName}` : 'System',
            expiryDate: notice.expiryDate
        };

        // Send email notifications
        console.log(`📧 Sending notice email notifications to ${recipients.length} recipients`);
        const emailResults = await emailService.sendNoticeAlert(recipients, noticeDetails);

        // Log results
        const successful = emailResults.filter(result => result.status === 'fulfilled').length;
        const failed = emailResults.filter(result => result.status === 'rejected').length;
        
        console.log(`📧 Notice email notifications: ${successful} sent, ${failed} failed`);

        if (failed > 0) {
            console.error('Some notice email notifications failed:', 
                emailResults.filter(result => result.status === 'rejected')
                    .map(result => result.reason)
            );
        }

    } catch (error) {
        console.error('Error sending notice email notifications:', error);
        throw error;
    }
};

module.exports = {
    createNotice,
    getNotices,
    getNoticesForStudents,
    getNoticeById,
    updateNotice,
    deleteNotice,
    sendNoticeEmailNotifications
};