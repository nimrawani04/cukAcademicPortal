// Admin Controller - Handles administrative operations including registration approvals
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const Course = require('../models/Course');
const { validationResult } = require('express-validator');
const { securityLogger } = require('../middleware/logger');

/**
 * Get pending user registrations for approval
 * GET /api/admin/registrations/pending
 * Only admin can view pending registrations
 */
const getPendingRegistrations = async (req, res) => {
    try {
        const { page = 1, limit = 10, role } = req.query;

        // Build query for pending registrations
        let query = { 
            registrationStatus: 'pending',  // Only pending registrations
            approvalRequired: true
        };

        if (role) {
            query.role = role;
        }

        // Get pending users with pagination
        const pendingUsers = await User.find(query)
            .sort({ registrationDate: -1 })  // Most recent first
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-password -emailVerificationToken -passwordResetToken');

        // Get total count for pagination
        const total = await User.countDocuments(query);

        // Format user data based on role
        const formattedUsers = await Promise.all(
            pendingUsers.map(async (user) => {
                let roleSpecificData = {};

                if (user.role === 'student') {
                    const student = await Student.findById(user._id);
                    if (student) {
                        roleSpecificData = {
                            rollNumber: student.rollNumber,
                            course: student.course,
                            year: student.year,
                            batch: student.batch,
                            dateOfBirth: student.dateOfBirth,
                            gender: student.gender
                        };
                    }
                } else if (user.role === 'faculty') {
                    const faculty = await Faculty.findById(user._id);
                    if (faculty) {
                        roleSpecificData = {
                            facultyId: faculty.facultyId,
                            department: faculty.department,
                            designation: faculty.designation,
                            qualifications: faculty.qualifications,
                            joiningDate: faculty.joiningDate
                        };
                    }
                } else if (user.role === 'admin') {
                    const admin = await Admin.findById(user._id);
                    if (admin) {
                        roleSpecificData = {
                            adminId: admin.adminId,
                            department: admin.department,
                            designation: admin.designation,
                            accessLevel: admin.accessLevel
                        };
                    }
                }

                return {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    registrationStatus: user.registrationStatus,
                    registrationDate: user.registrationDate,
                    createdAt: user.createdAt,
                    daysSinceRegistration: Math.floor((new Date() - user.registrationDate) / (1000 * 60 * 60 * 24)),
                    ...roleSpecificData
                };
            })
        );

        res.json({
            success: true,
            data: {
                registrations: formattedUsers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalRegistrations: total,
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                },
                summary: {
                    totalPending: total,
                    byRole: await User.aggregate([
                        { $match: { registrationStatus: 'pending', approvalRequired: true } },
                        { $group: { _id: '$role', count: { $sum: 1 } } }
                    ])
                }
            }
        });

    } catch (error) {
        console.error('Get pending registrations error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching pending registrations'
        });
    }
};

/**
 * Approve a user registration
 * POST /api/admin/registrations/:userId/approve
 * Only admin can approve registrations
 */
const approveRegistration = async (req, res) => {
    try {
        const { userId } = req.params;
        const { comments } = req.body;
        const adminId = req.user.userId;

        // Find the user to approve
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is pending approval
        if (user.registrationStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Registration is not pending. Current status: ${user.registrationStatus}`
            });
        }

        // Get admin details for email
        const admin = await User.findById(adminId).select('firstName lastName');

        // Approve the user
        user.isActive = true;                           // ✅ Activate account
        user.isEmailVerified = true;                    // ✅ Auto-verify email on approval
        user.registrationStatus = 'approved';          // ✅ Set status to approved
        user.approvalRequired = false;                  // ✅ No longer requires approval
        user.approvedBy = adminId;                      // 👤 Record who approved
        user.approvedAt = new Date();                   // 📅 Record when approved
        user.approvalComments = comments;               // 💬 Store approval comments

        await user.save();

        // Log the approval
        securityLogger('USER_REGISTRATION_APPROVED', { user: { userId: adminId } }, {
            approvedUserId: userId,
            approvedUserRole: user.role,
            approvedUserEmail: user.email,
            comments
        });

        console.log(`✅ Registration approved by admin ${adminId} for ${user.role} ${user.email}`);

        // Send approval notification email
        try {
            const { sendRegistrationApprovalEmail } = require('../utils/emailService');
            if (process.env.EMAIL_USER) {
                await sendRegistrationApprovalEmail(user, admin, comments);
                console.log(`📧 Approval email sent to ${user.email}`);
            }
        } catch (emailError) {
            console.error('Failed to send approval email:', emailError);
        }

        res.json({
            success: true,
            message: 'Registration approved successfully',
            data: {
                userId,
                userEmail: user.email,
                userRole: user.role,
                userName: user.fullName,
                approvedAt: user.approvedAt,
                approvedBy: admin ? admin.fullName : 'Administrator',
                comments: comments || null
            }
        });

    } catch (error) {
        console.error('Approve registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while approving registration'
        });
    }
};

/**
 * Reject a user registration
 * POST /api/admin/registrations/:userId/reject
 * Only admin can reject registrations
 */
const rejectRegistration = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const adminId = req.user.userId;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        // Find the user to reject
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is pending approval
        if (user.registrationStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Registration is not pending. Current status: ${user.registrationStatus}`
            });
        }

        // Get admin details for email
        const admin = await User.findById(adminId).select('firstName lastName');

        // Store rejection details before updating
        const rejectionData = {
            userId: user._id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            rejectedBy: adminId,
            rejectedAt: new Date(),
            rejectionReason: reason
        };

        // Update user status to rejected (keep the record for audit purposes)
        user.registrationStatus = 'rejected';          // ❌ Set status to rejected
        user.rejectedBy = adminId;                      // 👤 Record who rejected
        user.rejectedAt = new Date();                   // 📅 Record when rejected
        user.rejectionReason = reason;                  // 💬 Store rejection reason
        user.isActive = false;                          // ❌ Keep account inactive
        user.approvalRequired = false;                  // ❌ No longer requires approval

        await user.save();

        // Log the rejection
        securityLogger('USER_REGISTRATION_REJECTED', { user: { userId: adminId } }, rejectionData);

        console.log(`❌ Registration rejected by admin ${adminId} for ${user.role} ${user.email}: ${reason}`);

        // Send rejection notification email
        try {
            const { sendRegistrationRejectionEmail } = require('../utils/emailService');
            if (process.env.EMAIL_USER) {
                await sendRegistrationRejectionEmail(user, admin, reason);
                console.log(`📧 Rejection email sent to ${user.email}`);
            }
        } catch (emailError) {
            console.error('Failed to send rejection email:', emailError);
        }

        res.json({
            success: true,
            message: 'Registration rejected successfully',
            data: {
                userId,
                userEmail: user.email,
                userRole: user.role,
                userName: user.fullName,
                rejectionReason: reason,
                rejectedAt: rejectionData.rejectedAt,
                rejectedBy: admin ? admin.fullName : 'Administrator'
            }
        });

    } catch (error) {
        console.error('Reject registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while rejecting registration'
        });
    }
};

/**
 * Bulk approve registrations
 * POST /api/admin/registrations/bulk-approve
 * Only admin can bulk approve registrations
 */
const bulkApproveRegistrations = async (req, res) => {
    try {
        const { userIds, comments } = req.body;
        const adminId = req.user.userId;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs array is required'
            });
        }

        const results = {
            approved: [],
            failed: [],
            alreadyApproved: []
        };

        for (const userId of userIds) {
            try {
                const user = await User.findById(userId);
                
                if (!user) {
                    results.failed.push({ userId, reason: 'User not found' });
                    continue;
                }

                if (user.registrationStatus === 'approved') {
                    results.alreadyApproved.push({ 
                        userId, 
                        email: user.email,
                        name: user.fullName 
                    });
                    continue;
                }

                if (user.registrationStatus !== 'pending') {
                    results.failed.push({ 
                        userId, 
                        reason: `Registration status is ${user.registrationStatus}, not pending` 
                    });
                    continue;
                }

                // Approve the user
                user.isActive = true;
                user.isEmailVerified = true;
                user.registrationStatus = 'approved';
                user.approvalRequired = false;
                user.approvedBy = adminId;
                user.approvedAt = new Date();
                user.approvalComments = comments;

                await user.save();

                results.approved.push({
                    userId,
                    email: user.email,
                    role: user.role,
                    name: user.fullName
                });

                // Send approval email (async, don't wait)
                if (process.env.EMAIL_USER) {
                    const { sendRegistrationApprovalEmail } = require('../utils/emailService');
                    sendRegistrationApprovalEmail(user, { fullName: 'Administrator' }, comments)
                        .catch(error => console.error(`Failed to send approval email to ${user.email}:`, error));
                }

                // Log individual approval
                securityLogger('USER_REGISTRATION_BULK_APPROVED', { user: { userId: adminId } }, {
                    approvedUserId: userId,
                    approvedUserEmail: user.email,
                    approvedUserRole: user.role
                });

            } catch (error) {
                results.failed.push({ userId, reason: error.message });
            }
        }

        console.log(`✅ Bulk approval completed by admin ${adminId}: ${results.approved.length} approved, ${results.failed.length} failed`);

        res.json({
            success: true,
            message: 'Bulk approval completed',
            data: {
                summary: {
                    totalRequested: userIds.length,
                    approved: results.approved.length,
                    failed: results.failed.length,
                    alreadyApproved: results.alreadyApproved.length
                },
                results
            }
        });

    } catch (error) {
        console.error('Bulk approve registrations error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while bulk approving registrations'
        });
    }
};

/**
 * Get all users with filtering and pagination
 * GET /api/admin/users
 * Only admin can view all users
 */
const getAllUsers = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            role, 
            isActive, 
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        let query = {};
        
        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query
        const users = await User.find(query)
            .select('-password')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Get total count
        const total = await User.countDocuments(query);

        // Get role-specific data for each user
        const formattedUsers = await Promise.all(
            users.map(async (user) => {
                let roleSpecificData = {};

                try {
                    if (user.role === 'student') {
                        const student = await Student.findById(user._id);
                        if (student) {
                            roleSpecificData = {
                                rollNumber: student.rollNumber,
                                course: student.course,
                                year: student.year,
                                cgpa: student.cgpa
                            };
                        }
                    } else if (user.role === 'faculty') {
                        const faculty = await Faculty.findById(user._id);
                        if (faculty) {
                            roleSpecificData = {
                                facultyId: faculty.facultyId,
                                department: faculty.department,
                                designation: faculty.designation
                            };
                        }
                    } else if (user.role === 'admin') {
                        const admin = await Admin.findById(user._id);
                        if (admin) {
                            roleSpecificData = {
                                adminId: admin.adminId,
                                department: admin.department,
                                accessLevel: admin.accessLevel
                            };
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching role-specific data for user ${user._id}:`, error);
                }

                return {
                    ...user.toObject(),
                    ...roleSpecificData
                };
            })
        );

        res.json({
            success: true,
            data: {
                users: formattedUsers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalUsers: total,
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching users'
        });
    }
};

/**
 * Deactivate a user account
 * POST /api/admin/users/:userId/deactivate
 * Only admin can deactivate users
 */
const deactivateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const adminId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.isActive) {
            return res.status(400).json({
                success: false,
                message: 'User is already deactivated'
            });
        }

        // Prevent admin from deactivating themselves
        if (userId === adminId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account'
            });
        }

        user.isActive = false;
        user.deactivatedBy = adminId;
        user.deactivatedAt = new Date();
        user.deactivationReason = reason;

        await user.save();

        // Log the deactivation
        securityLogger('USER_ACCOUNT_DEACTIVATED', { user: { userId: adminId } }, {
            deactivatedUserId: userId,
            deactivatedUserEmail: user.email,
            deactivatedUserRole: user.role,
            reason
        });

        res.json({
            success: true,
            message: 'User account deactivated successfully',
            data: {
                userId,
                userEmail: user.email,
                deactivatedAt: user.deactivatedAt
            }
        });

    } catch (error) {
        console.error('Deactivate user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deactivating user'
        });
    }
};

/**
 * Reactivate a user account
 * POST /api/admin/users/:userId/reactivate
 * Only admin can reactivate users
 */
const reactivateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const adminId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isActive) {
            return res.status(400).json({
                success: false,
                message: 'User is already active'
            });
        }

        user.isActive = true;
        user.reactivatedBy = adminId;
        user.reactivatedAt = new Date();
        
        // Clear deactivation fields
        user.deactivatedBy = undefined;
        user.deactivatedAt = undefined;
        user.deactivationReason = undefined;

        await user.save();

        // Log the reactivation
        securityLogger('USER_ACCOUNT_REACTIVATED', { user: { userId: adminId } }, {
            reactivatedUserId: userId,
            reactivatedUserEmail: user.email,
            reactivatedUserRole: user.role
        });

        res.json({
            success: true,
            message: 'User account reactivated successfully',
            data: {
                userId,
                userEmail: user.email,
                reactivatedAt: user.reactivatedAt
            }
        });

    } catch (error) {
        console.error('Reactivate user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while reactivating user'
        });
    }
};

module.exports = {
    getPendingRegistrations,
    approveRegistration,
    rejectRegistration,
    bulkApproveRegistrations,
    getAllUsers,
    deactivateUser,
    reactivateUser
};