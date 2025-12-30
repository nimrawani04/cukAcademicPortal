// Authentication Controller - Handles user registration, login, and authentication
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

// Import models
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');

// Import utilities
const { securityLogger } = require('../middleware/logger');
const { sendWelcomeEmail, sendRegistrationConfirmationEmail, notifyAdminsNewRegistration } = require('../utils/emailService');
const emailService = require('../services/emailService');

/**
 * Generate JWT token for authenticated users
 * @param {Object} user - User object
 * @returns {Object} Object containing access and refresh tokens
 */
const generateTokens = (user) => {
    const payload = {
        userId: user._id,
        email: user.email,
        role: user.role,
        userType: user.userType || user.role
    };

    // Access token (short-lived)
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
    });

    // Refresh token (long-lived)
    const refreshToken = jwt.sign(
        { userId: user._id, tokenType: 'refresh' }, 
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
};

/**
 * Get user model based on role
 * @param {string} role - User role (student, faculty, admin)
 * @returns {mongoose.Model} Appropriate model
 */
const getUserModel = (role) => {
    switch (role.toLowerCase()) {
        case 'student':
            return Student;
        case 'faculty':
            return Faculty;
        case 'admin':
            return Admin;
        default:
            return User;
    }
};

/**
 * Register a new user (creates pending registration)
 * POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        // Check for validation errors from middleware
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { role, ...userData } = req.body;

        // Check if user already exists (including pending registrations)
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            securityLogger('DUPLICATE_REGISTRATION_ATTEMPT', req, { email: userData.email });
            
            // Provide different messages based on existing user status
            let message = 'User with this email already exists';
            if (!existingUser.isActive && !existingUser.isEmailVerified) {
                message = 'A registration with this email is already pending approval';
            } else if (!existingUser.isActive) {
                message = 'This account has been deactivated. Please contact administrator';
            }
            
            return res.status(400).json({
                success: false,
                message
            });
        }

        // Get appropriate model based on role
        const UserModel = getUserModel(role);

        // Create new user with PENDING status
        const user = new UserModel({
            ...userData,
            role: role.toLowerCase(),
            isActive: false,              // ❌ Account is inactive until approved
            isEmailVerified: false,       // ❌ Email not verified until approved
            emailVerificationToken: crypto.randomBytes(32).toString('hex'),
            registrationStatus: 'pending', // 📋 Pending approval
            registrationDate: new Date(),
            approvalRequired: true
        });

        await user.save();

        // Log registration submission
        console.log(`📋 New ${role} registration submitted (PENDING): ${user.email}`);
        securityLogger('USER_REGISTRATION_SUBMITTED', req, { 
            userId: user._id, 
            role: user.role,
            email: user.email,
            status: 'pending'
        });

        // Send registration confirmation email (not welcome email)
        if (process.env.EMAIL_USER) {
            sendRegistrationConfirmationEmail(user).catch(error => 
                console.error('Failed to send registration confirmation email:', error)
            );
        }

        // Notify admins about new registration (async)
        if (process.env.EMAIL_USER) {
            notifyAdminsNewRegistration(user).catch(error =>
                console.error('Failed to notify admins:', error)
            );
        }

        // Remove sensitive fields from response
        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.emailVerificationToken;

        res.status(201).json({
            success: true,
            message: 'Registration submitted successfully. Your account is pending approval by an administrator.',
            data: {
                user: userResponse,
                status: 'pending',
                nextSteps: [
                    'Your registration has been submitted for review',
                    'An administrator will review your application',
                    'You will receive an email notification once your account is approved',
                    'After approval, you can log in with your credentials'
                ]
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            let message = `${field} already exists`;
            
            // Provide specific messages for different fields
            if (field === 'email') {
                message = 'An account with this email already exists or is pending approval';
            } else if (field === 'rollNumber') {
                message = 'This roll number is already registered';
            } else if (field === 'facultyId') {
                message = 'This faculty ID is already registered';
            } else if (field === 'adminId') {
                message = 'This admin ID is already registered';
            }
            
            return res.status(400).json({
                success: false,
                message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

/**
 * Generic login function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} expectedRole - Expected user role for this login endpoint
 */
const loginUser = async (req, res, expectedRole = null) => {
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

        const { email, password, rememberMe = false } = req.body;

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            securityLogger('LOGIN_FAILED_USER_NOT_FOUND', req, { email });
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user role matches expected role (for role-specific endpoints)
        if (expectedRole && user.role !== expectedRole) {
            securityLogger('LOGIN_FAILED_WRONG_ROLE', req, { 
                email, 
                expectedRole, 
                actualRole: user.role 
            });
            return res.status(401).json({
                success: false,
                message: `This login is only for ${expectedRole}s. Please use the correct login page.`
            });
        }

        // Check if account is locked
        if (user.isLocked()) {
            securityLogger('LOGIN_FAILED_ACCOUNT_LOCKED', req, { 
                userId: user._id, 
                email: user.email 
            });
            return res.status(423).json({
                success: false,
                message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
            });
        }

        // Check if account is active (approved)
        if (!user.isActive) {
            // Provide specific messages based on registration status
            let message = 'Account is not active. Please contact administrator.';
            let code = 'ACCOUNT_INACTIVE';
            
            if (user.registrationStatus === 'pending') {
                message = 'Your registration is still pending approval. Please wait for administrator approval.';
                code = 'REGISTRATION_PENDING';
            } else if (user.registrationStatus === 'rejected') {
                message = 'Your registration has been rejected. Please contact administrator for more information.';
                code = 'REGISTRATION_REJECTED';
            }
            
            securityLogger('LOGIN_FAILED_ACCOUNT_INACTIVE', req, { 
                userId: user._id, 
                email: user.email,
                registrationStatus: user.registrationStatus || 'unknown'
            });
            
            return res.status(401).json({
                success: false,
                message,
                code
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            // Increment login attempts
            await user.incLoginAttempts();
            
            securityLogger('LOGIN_FAILED_WRONG_PASSWORD', req, { 
                userId: user._id, 
                email: user.email,
                attempts: user.loginAttempts + 1
            });
            
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Reset login attempts on successful login
        if (user.loginAttempts > 0) {
            await user.resetLoginAttempts();
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Set refresh token as httpOnly cookie if remember me is checked
        if (rememberMe) {
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
        }

        // Log successful login
        console.log(`✅ ${user.role} login successful: ${user.email}`);
        securityLogger('LOGIN_SUCCESS', req, { 
            userId: user._id, 
            role: user.role,
            email: user.email 
        });

        // Remove sensitive fields from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userResponse,
                tokens: {
                    accessToken,
                    ...(rememberMe ? {} : { refreshToken }) // Don't send refresh token if it's in cookie
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

/**
 * General login (any role)
 * POST /api/auth/login
 */
const login = async (req, res) => {
    await loginUser(req, res);
};

/**
 * Student-specific login
 * POST /api/auth/student/login
 */
const studentLogin = async (req, res) => {
    await loginUser(req, res, 'student');
};

/**
 * Faculty-specific login
 * POST /api/auth/faculty/login
 */
const facultyLogin = async (req, res) => {
    await loginUser(req, res, 'faculty');
};

/**
 * Admin-specific login
 * POST /api/auth/admin/login
 */
const adminLogin = async (req, res) => {
    await loginUser(req, res, 'admin');
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res) => {
    try {
        const { refreshToken: tokenFromBody } = req.body;
        const tokenFromCookie = req.cookies.refreshToken;
        
        const refreshToken = tokenFromBody || tokenFromCookie;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token not provided'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(
            refreshToken, 
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        );

        if (decoded.tokenType !== 'refresh') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token type'
            });
        }

        // Find user
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        // Generate new access token
        const { accessToken } = generateTokens(user);

        res.json({
            success: true,
            data: {
                accessToken
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during token refresh'
        });
    }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
    try {
        // Clear refresh token cookie
        res.clearCookie('refreshToken');

        // Log logout
        if (req.user) {
            console.log(`👋 User logout: ${req.user.email}`);
            securityLogger('USER_LOGOUT', req, { 
                userId: req.user.userId,
                email: req.user.email 
            });
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during logout'
        });
    }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 */
const getProfile = async (req, res) => {
    try {
        // Get user with role-specific fields
        const UserModel = getUserModel(req.user.role);
        const user = await UserModel.findById(req.user.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching profile'
        });
    }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
    try {
        const allowedUpdates = ['firstName', 'lastName', 'phone', 'profilePicture'];
        const updates = {};
        
        // Only allow specific fields to be updated
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        const UserModel = getUserModel(req.user.role);
        const user = await UserModel.findByIdAndUpdate(
            req.user.userId,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile'
        });
    }
};

/**
 * Change password
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Find user
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            securityLogger('PASSWORD_CHANGE_FAILED_WRONG_CURRENT', req, { 
                userId: user._id 
            });
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Log password change
        securityLogger('PASSWORD_CHANGED', req, { userId: user._id });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while changing password'
        });
    }
};

/**
 * Verify email
 * GET /api/auth/verify-email/:token
 */
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ emailVerificationToken: token });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during email verification'
        });
    }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
    try {
        const { email, userType } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Find user by email
        const user = await User.findOne({ 
            email: email.toLowerCase(),
            ...(userType && { role: userType })
        });

        // Always return success to prevent email enumeration
        const successResponse = {
            success: true,
            message: 'If an account with this email exists, you will receive a password reset link shortly.'
        };

        if (!user) {
            console.log(`Password reset requested for non-existent email: ${email}`);
            return res.json(successResponse);
        }

        if (!user.isActive) {
            console.log(`Password reset requested for inactive account: ${email}`);
            return res.json(successResponse);
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save reset token to user
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = resetTokenExpiry;
        await user.save();

        // Send password reset email
        try {
            await emailService.sendPasswordResetEmail({
                email: user.email,
                firstName: user.firstName,
                resetToken,
                userType: user.role
            });
            console.log(`📧 Password reset email sent to ${user.email}`);
            
            securityLogger('PASSWORD_RESET_REQUESTED', req, { 
                userId: user._id,
                email: user.email 
            });
        } catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
            
            // Clear reset token if email fails
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();
            
            return res.status(500).json({
                success: false,
                message: 'Failed to send password reset email. Please try again later.'
            });
        }

        res.json(successResponse);

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while processing password reset request'
        });
    }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword, userType } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Reset token and new password are required'
            });
        }

        // Find user with valid reset token
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() },
            ...(userType && { role: userType })
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Update password
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        
        // Reset login attempts if any
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        
        await user.save();

        // Log password reset
        securityLogger('PASSWORD_RESET_COMPLETED', req, { 
            userId: user._id,
            email: user.email 
        });

        console.log(`🔐 Password reset completed for ${user.email}`);

        res.json({
            success: true,
            message: 'Password reset successfully. You can now log in with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while resetting password'
        });
    }
};

/**
 * Verify reset token
 * GET /api/auth/verify-reset-token/:token
 */
const verifyResetToken = async (req, res) => {
    try {
        const { token } = req.params;
        const { userType } = req.query;

        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() },
            ...(userType && { role: userType })
        }).select('email firstName lastName role');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        res.json({
            success: true,
            message: 'Reset token is valid',
            data: {
                email: user.email,
                name: user.fullName,
                userType: user.role
            }
        });

    } catch (error) {
        console.error('Verify reset token error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while verifying reset token'
        });
    }
};

module.exports = {
    register,
    login,
    studentLogin,
    facultyLogin,
    adminLogin,
    refreshToken,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    verifyEmail,
    forgotPassword,
    resetPassword,
    verifyResetToken
};