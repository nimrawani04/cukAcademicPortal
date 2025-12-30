// Registration Status Controller - Handles registration status checking and workflow
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const emailService = require('../services/emailService');

/**
 * Register a new user (student or faculty)
 * POST /api/registration/register
 * Public endpoint for new registrations
 */
const registerUser = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            password,
            registrationType,
            // Student specific fields
            course,
            year,
            // Faculty specific fields
            department,
            designation
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user
        const userData = {
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone,
            password,
            role: registrationType,
            registrationStatus: 'pending',
            registrationDate: new Date()
        };

        const user = new User(userData);
        await user.save();

        // Create role-specific profile
        if (registrationType === 'student') {
            const student = new Student({
                userId: user._id,
                course,
                year,
                enrollmentNumber: `${new Date().getFullYear()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
            });
            await student.save();
        } else if (registrationType === 'faculty') {
            const faculty = new Faculty({
                userId: user._id,
                department,
                designation,
                employeeId: `FAC${new Date().getFullYear()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
            });
            await faculty.save();
        }

        // Send welcome email
        try {
            await emailService.sendWelcomeEmail({
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                userType: registrationType
            });
            console.log(`📧 Welcome email sent to ${user.email}`);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Registration submitted successfully. You will receive an email notification once approved.',
            data: {
                id: user._id,
                email: user.email,
                name: user.fullName,
                role: user.role,
                registrationStatus: user.registrationStatus,
                registrationDate: user.registrationDate
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

/**
 * Approve a registration
 * PUT /api/registration/approve/:id
 * Admin only endpoint
 */
const approveRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const { loginCredentials } = req.body; // { loginId, password }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.registrationStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Registration is not in pending status'
            });
        }

        // Update user status
        user.registrationStatus = 'approved';
        user.approvedAt = new Date();
        user.approvedBy = req.user.id;
        user.isActive = true;

        // Set login credentials if provided
        if (loginCredentials) {
            user.loginId = loginCredentials.loginId;
            if (loginCredentials.password) {
                user.password = loginCredentials.password;
            }
        }

        await user.save();

        // Send approval email
        try {
            await emailService.sendRegistrationApprovalEmail({
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                userType: user.role,
                loginCredentials: {
                    loginId: user.loginId || user.email,
                    password: loginCredentials?.password || 'Please check your email for password'
                }
            });
            console.log(`📧 Approval email sent to ${user.email}`);
        } catch (emailError) {
            console.error('Failed to send approval email:', emailError);
        }

        res.json({
            success: true,
            message: 'Registration approved successfully',
            data: {
                id: user._id,
                email: user.email,
                name: user.fullName,
                role: user.role,
                registrationStatus: user.registrationStatus,
                approvedAt: user.approvedAt
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
 * Reject a registration
 * PUT /api/registration/reject/:id
 * Admin only endpoint
 */
const rejectRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.registrationStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Registration is not in pending status'
            });
        }

        // Update user status
        user.registrationStatus = 'rejected';
        user.rejectedAt = new Date();
        user.rejectedBy = req.user.id;
        user.rejectionReason = reason || 'Registration requirements not met';

        await user.save();

        // Send rejection email
        try {
            await emailService.sendRegistrationRejectionEmail({
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                reason: user.rejectionReason
            });
            console.log(`📧 Rejection email sent to ${user.email}`);
        } catch (emailError) {
            console.error('Failed to send rejection email:', emailError);
        }

        res.json({
            success: true,
            message: 'Registration rejected successfully',
            data: {
                id: user._id,
                email: user.email,
                name: user.fullName,
                role: user.role,
                registrationStatus: user.registrationStatus,
                rejectedAt: user.rejectedAt,
                rejectionReason: user.rejectionReason
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
 * Check registration status by email
 * POST /api/registration/check-status
 * Public endpoint to check registration status
 */
const checkRegistrationStatus = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() })
            .select('firstName lastName email role registrationStatus registrationDate approvedAt rejectedAt rejectionReason isActive');

        if (!user) {
            return res.json({
                success: true,
                data: {
                    status: 'not_found',
                    message: 'No registration found with this email address',
                    canRegister: true
                }
            });
        }

        // Prepare response based on registration status
        let responseData = {
            email: user.email,
            name: user.fullName,
            role: user.role,
            registrationDate: user.registrationDate,
            status: user.registrationStatus
        };

        let message = '';
        let canLogin = false;
        let nextSteps = [];

        switch (user.registrationStatus) {
            case 'pending':
                message = 'Your registration is pending approval by an administrator';
                nextSteps = [
                    'Your registration is being reviewed',
                    'You will receive an email notification once approved',
                    'Please wait for administrator approval'
                ];
                break;

            case 'approved':
                message = 'Your registration has been approved and your account is active';
                canLogin = true;
                responseData.approvedAt = user.approvedAt;
                nextSteps = [
                    'You can now log in to the portal',
                    'Use your email and password to access your account'
                ];
                break;

            case 'rejected':
                message = 'Your registration has been rejected';
                responseData.rejectedAt = user.rejectedAt;
                responseData.rejectionReason = user.rejectionReason;
                nextSteps = [
                    'Contact support for more information',
                    'You may submit a new registration if issues are resolved'
                ];
                break;

            default:
                message = 'Registration status unknown';
                break;
        }

        res.json({
            success: true,
            data: {
                ...responseData,
                message,
                canLogin,
                nextSteps,
                daysSinceRegistration: Math.floor((new Date() - user.registrationDate) / (1000 * 60 * 60 * 24))
            }
        });

    } catch (error) {
        console.error('Check registration status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while checking registration status'
        });
    }
};

/**
 * Get registration statistics (for admin dashboard)
 * GET /api/registration/statistics
 * Admin only endpoint
 */
const getRegistrationStatistics = async (req, res) => {
    try {
        const { timeframe = '30' } = req.query; // Default to last 30 days
        const days = parseInt(timeframe);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get various statistics
        const [
            totalRegistrations,
            pendingRegistrations,
            approvedRegistrations,
            rejectedRegistrations,
            recentRegistrations,
            registrationsByRole,
            registrationsByStatus,
            dailyRegistrations
        ] = await Promise.all([
            // Total registrations
            User.countDocuments(),
            
            // Pending registrations
            User.countDocuments({ registrationStatus: 'pending' }),
            
            // Approved registrations
            User.countDocuments({ registrationStatus: 'approved' }),
            
            // Rejected registrations
            User.countDocuments({ registrationStatus: 'rejected' }),
            
            // Recent registrations (within timeframe)
            User.countDocuments({ 
                registrationDate: { $gte: startDate }
            }),
            
            // Registrations by role
            User.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } }
            ]),
            
            // Registrations by status
            User.aggregate([
                { $group: { _id: '$registrationStatus', count: { $sum: 1 } } }
            ]),
            
            // Daily registrations for the last 7 days
            User.aggregate([
                {
                    $match: {
                        registrationDate: { 
                            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { 
                                format: "%Y-%m-%d", 
                                date: "$registrationDate" 
                            }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        // Format the data
        const roleStats = registrationsByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, { student: 0, faculty: 0, admin: 0 });

        const statusStats = registrationsByStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, { pending: 0, approved: 0, rejected: 0 });

        // Calculate approval rate
        const totalProcessed = approvedRegistrations + rejectedRegistrations;
        const approvalRate = totalProcessed > 0 ? 
            ((approvedRegistrations / totalProcessed) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            data: {
                summary: {
                    total: totalRegistrations,
                    pending: pendingRegistrations,
                    approved: approvedRegistrations,
                    rejected: rejectedRegistrations,
                    recent: recentRegistrations,
                    approvalRate: parseFloat(approvalRate)
                },
                byRole: roleStats,
                byStatus: statusStats,
                dailyTrend: dailyRegistrations,
                timeframe: {
                    days,
                    startDate,
                    endDate: new Date()
                }
            }
        });

    } catch (error) {
        console.error('Get registration statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching registration statistics'
        });
    }
};

/**
 * Get recent registration activity (for admin dashboard)
 * GET /api/registration/recent-activity
 * Admin only endpoint
 */
const getRecentActivity = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        // Get recent registrations with all statuses
        const recentActivity = await User.find({})
            .select('firstName lastName email role registrationStatus registrationDate approvedAt rejectedAt approvedBy rejectedBy')
            .populate('approvedBy', 'firstName lastName')
            .populate('rejectedBy', 'firstName lastName')
            .sort({ 
                $or: [
                    { registrationDate: -1 },
                    { approvedAt: -1 },
                    { rejectedAt: -1 }
                ]
            })
            .limit(parseInt(limit));

        // Format the activity data
        const formattedActivity = recentActivity.map(user => {
            let activityType = 'registered';
            let activityDate = user.registrationDate;
            let activityBy = null;

            if (user.approvedAt && (!user.rejectedAt || user.approvedAt > user.rejectedAt)) {
                activityType = 'approved';
                activityDate = user.approvedAt;
                activityBy = user.approvedBy;
            } else if (user.rejectedAt) {
                activityType = 'rejected';
                activityDate = user.rejectedAt;
                activityBy = user.rejectedBy;
            }

            return {
                id: user._id,
                name: user.fullName,
                email: user.email,
                role: user.role,
                activityType,
                activityDate,
                activityBy: activityBy ? activityBy.fullName : null,
                registrationStatus: user.registrationStatus,
                registrationDate: user.registrationDate
            };
        });

        res.json({
            success: true,
            data: {
                activities: formattedActivity,
                total: formattedActivity.length
            }
        });

    } catch (error) {
        console.error('Get recent activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching recent activity'
        });
    }
};

/**
 * Resend registration confirmation email
 * POST /api/registration/resend-confirmation
 * Public endpoint for users to resend confirmation
 */
const resendConfirmation = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ 
            email: email.toLowerCase(),
            registrationStatus: 'pending'
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No pending registration found with this email address'
            });
        }

        // Send confirmation email
        try {
            const { sendRegistrationConfirmationEmail } = require('../utils/emailService');
            if (process.env.EMAIL_USER) {
                await sendRegistrationConfirmationEmail(user);
                console.log(`📧 Confirmation email resent to ${user.email}`);
            }
        } catch (emailError) {
            console.error('Failed to resend confirmation email:', emailError);
            return res.status(500).json({
                success: false,
                message: 'Failed to send confirmation email'
            });
        }

        res.json({
            success: true,
            message: 'Confirmation email sent successfully',
            data: {
                email: user.email,
                registrationDate: user.registrationDate
            }
        });

    } catch (error) {
        console.error('Resend confirmation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while resending confirmation'
        });
    }
};

module.exports = {
    registerUser,
    approveRegistration,
    rejectRegistration,
    checkRegistrationStatus,
    getRegistrationStatistics,
    getRecentActivity,
    resendConfirmation
};