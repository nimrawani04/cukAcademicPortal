// Email Service Utility - Handles sending emails for notifications and communications
const nodemailer = require('nodemailer');

/**
 * Email transporter configuration
 * Uses environment variables for email service settings
 */
let transporter;

/**
 * Initialize email transporter
 * Call this function when the application starts
 */
const initializeEmailService = () => {
    try {
        transporter = nodemailer.createTransporter({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false // Allow self-signed certificates
            }
        });

        console.log('Email service initialized successfully');
    } catch (error) {
        console.error('Failed to initialize email service:', error);
    }
};

/**
 * Send a generic email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content (optional)
 * @param {Array} options.attachments - File attachments (optional)
 * @returns {Promise} Promise that resolves when email is sent
 */
const sendEmail = async (options) => {
    try {
        if (!transporter) {
            throw new Error('Email service not initialized');
        }

        const mailOptions = {
            from: `Academic Portal <${process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html || null,
            attachments: options.attachments || []
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', result.messageId);
        return result;

    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

/**
 * Send welcome email to new users
 * @param {Object} user - User object
 */
const sendWelcomeEmail = async (user) => {
    const subject = `Welcome to Academic Portal, ${user.firstName}!`;
    
    const text = `
        Dear ${user.firstName} ${user.lastName},
        
        Welcome to the Academic Portal! Your account has been successfully created.
        
        Account Details:
        - Name: ${user.firstName} ${user.lastName}
        - Email: ${user.email}
        - Role: ${user.role}
        
        You can now log in to access your dashboard and explore the features available to you.
        
        Login URL: ${process.env.FRONTEND_URL}/login
        
        If you have any questions or need assistance, please don't hesitate to contact our support team.
        
        Best regards,
        Academic Portal Team
    `;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Welcome to Academic Portal!</h2>
            
            <p>Dear <strong>${user.firstName} ${user.lastName}</strong>,</p>
            
            <p>Welcome to the Academic Portal! Your account has been successfully created.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; margin-top: 0;">Account Details:</h3>
                <ul style="color: #6b7280;">
                    <li><strong>Name:</strong> ${user.firstName} ${user.lastName}</li>
                    <li><strong>Email:</strong> ${user.email}</li>
                    <li><strong>Role:</strong> ${user.role}</li>
                </ul>
            </div>
            
            <p>You can now log in to access your dashboard and explore the features available to you.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/login" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Login to Portal
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
                If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                This email was sent from Academic Portal. Please do not reply to this email.
            </p>
        </div>
    `;

    await sendEmail({
        to: user.email,
        subject,
        text,
        html
    });
};

/**
 * Send registration confirmation email to new users
 * @param {Object} user - User object
 */
const sendRegistrationConfirmationEmail = async (user) => {
    const subject = 'Registration Submitted - Pending Approval';
    
    const text = `
        Hello ${user.firstName},
        
        Thank you for registering with the Academic Portal!
        
        Your registration has been successfully submitted and is now pending approval by an administrator.
        
        Registration Details:
        - Name: ${user.firstName} ${user.lastName}
        - Email: ${user.email}
        - Role: ${user.role}
        - Registration Date: ${new Date(user.registrationDate).toLocaleDateString()}
        
        What happens next:
        1. An administrator will review your registration
        2. You will receive an email notification once your account is approved or if additional information is needed
        3. After approval, you can log in using your email and password
        
        Please note: You cannot log in until your account has been approved.
        
        If you have any questions, please contact our support team.
        
        Best regards,
        Academic Portal Team
    `;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Registration Submitted Successfully!</h2>
            
            <p>Hello <strong>${user.firstName}</strong>,</p>
            
            <p>Thank you for registering with the Academic Portal!</p>
            
            <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196F3;">
                <h3 style="margin-top: 0; color: #1976D2;">⏳ Registration Pending Approval</h3>
                <p>Your registration has been successfully submitted and is now pending approval by an administrator.</p>
            </div>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Registration Details:</h3>
                <ul>
                    <li><strong>Name:</strong> ${user.firstName} ${user.lastName}</li>
                    <li><strong>Email:</strong> ${user.email}</li>
                    <li><strong>Role:</strong> ${user.role}</li>
                    <li><strong>Registration Date:</strong> ${new Date(user.registrationDate).toLocaleDateString()}</li>
                </ul>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h3 style="margin-top: 0; color: #856404;">What happens next:</h3>
                <ol>
                    <li>An administrator will review your registration</li>
                    <li>You will receive an email notification once your account is approved</li>
                    <li>After approval, you can log in using your email and password</li>
                </ol>
                <p><strong>Important:</strong> You cannot log in until your account has been approved.</p>
            </div>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>
            <strong>Academic Portal Team</strong></p>
        </div>
    `;

    await sendEmail({
        to: user.email,
        subject,
        text,
        html
    });
};

/**
 * Notify administrators about new registration
 * @param {Object} user - User object
 */
const notifyAdminsNewRegistration = async (user) => {
    try {
        // Get all admin users
        const User = require('../models/User');
        const admins = await User.find({ 
            role: 'admin', 
            isActive: true,
            registrationStatus: 'approved'
        }).select('email firstName');

        if (admins.length === 0) {
            console.warn('No active admins found to notify about new registration');
            return;
        }

        const subject = `New ${user.role} Registration Pending Approval`;
        
        for (const admin of admins) {
            const text = `
                Hello ${admin.firstName},
                
                A new ${user.role} registration is pending your approval.
                
                Registration Details:
                - Name: ${user.firstName} ${user.lastName}
                - Email: ${user.email}
                - Role: ${user.role}
                - Registration Date: ${new Date(user.registrationDate).toLocaleDateString()}
                ${user.rollNumber ? `- Roll Number: ${user.rollNumber}` : ''}
                ${user.facultyId ? `- Faculty ID: ${user.facultyId}` : ''}
                ${user.adminId ? `- Admin ID: ${user.adminId}` : ''}
                
                Please log in to the admin panel to review and approve/reject this registration.
                
                Admin Panel: ${process.env.FRONTEND_URL}/admin/registrations
                
                Best regards,
                Academic Portal System
            `;

            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">New Registration Pending Approval</h2>
                    
                    <p>Hello <strong>${admin.firstName}</strong>,</p>
                    
                    <p>A new <strong>${user.role}</strong> registration is pending your approval.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
                        <h3 style="margin-top: 0;">Registration Details:</h3>
                        <ul>
                            <li><strong>Name:</strong> ${user.firstName} ${user.lastName}</li>
                            <li><strong>Email:</strong> ${user.email}</li>
                            <li><strong>Role:</strong> ${user.role}</li>
                            <li><strong>Registration Date:</strong> ${new Date(user.registrationDate).toLocaleDateString()}</li>
                            ${user.rollNumber ? `<li><strong>Roll Number:</strong> ${user.rollNumber}</li>` : ''}
                            ${user.facultyId ? `<li><strong>Faculty ID:</strong> ${user.facultyId}</li>` : ''}
                            ${user.adminId ? `<li><strong>Admin ID:</strong> ${user.adminId}</li>` : ''}
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}/admin/registrations" 
                           style="background-color: #007bff; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Review Registration
                        </a>
                    </div>
                    
                    <p>Please log in to the admin panel to review and approve/reject this registration.</p>
                    
                    <p>Best regards,<br>
                    <strong>Academic Portal System</strong></p>
                </div>
            `;

            await sendEmail({
                to: admin.email,
                subject,
                text,
                html
            });
        }

        console.log(`📧 Notified ${admins.length} admin(s) about new ${user.role} registration: ${user.email}`);

    } catch (error) {
        console.error('Error notifying admins about new registration:', error);
        throw error;
    }
};

/**
 * Send registration approval email
 * @param {Object} user - User object
 * @param {Object} approver - Admin who approved the registration
 * @param {string} comments - Approval comments
 */
const sendRegistrationApprovalEmail = async (user, approver, comments) => {
    const subject = 'Registration Approved - Welcome to Academic Portal!';
    
    const text = `
        Hello ${user.firstName},
        
        Great news! Your registration for the Academic Portal has been approved.
        
        Account Details:
        - Name: ${user.firstName} ${user.lastName}
        - Email: ${user.email}
        - Role: ${user.role}
        - Approved Date: ${new Date().toLocaleDateString()}
        ${comments ? `- Admin Comments: ${comments}` : ''}
        
        You can now log in to the Academic Portal using your email and password.
        
        Login URL: ${process.env.FRONTEND_URL}/login
        
        Welcome to the Academic Portal community!
        
        Best regards,
        Academic Portal Team
    `;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">🎉 Registration Approved!</h2>
            
            <p>Hello <strong>${user.firstName}</strong>,</p>
            
            <p>Great news! Your registration for the Academic Portal has been approved.</p>
            
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                <h3 style="margin-top: 0; color: #155724;">✅ Account Activated</h3>
                <p>Your account is now active and you can log in to access the portal.</p>
            </div>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Account Details:</h3>
                <ul>
                    <li><strong>Name:</strong> ${user.firstName} ${user.lastName}</li>
                    <li><strong>Email:</strong> ${user.email}</li>
                    <li><strong>Role:</strong> ${user.role}</li>
                    <li><strong>Approved Date:</strong> ${new Date().toLocaleDateString()}</li>
                </ul>
                ${comments ? `
                <div style="margin-top: 15px; padding: 10px; background-color: #e9ecef; border-radius: 3px;">
                    <strong>Admin Comments:</strong> ${comments}
                </div>
                ` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/login" 
                   style="background-color: #28a745; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                    Login to Portal
                </a>
            </div>
            
            <p>Welcome to the Academic Portal community!</p>
            
            <p>Best regards,<br>
            <strong>Academic Portal Team</strong></p>
        </div>
    `;

    await sendEmail({
        to: user.email,
        subject,
        text,
        html
    });
};

/**
 * Send registration rejection email
 * @param {Object} user - User object
 * @param {Object} rejector - Admin who rejected the registration
 * @param {string} reason - Rejection reason
 */
const sendRegistrationRejectionEmail = async (user, rejector, reason) => {
    const subject = 'Registration Update - Academic Portal';
    
    const text = `
        Hello ${user.firstName},
        
        We have reviewed your registration for the Academic Portal.
        
        Unfortunately, we are unable to approve your registration at this time.
        
        Reason: ${reason}
        
        If you believe this is an error or would like to discuss this decision, please contact our support team.
        
        You may also submit a new registration if you believe you can address the concerns mentioned above.
        
        Best regards,
        Academic Portal Team
    `;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Registration Update</h2>
            
            <p>Hello <strong>${user.firstName}</strong>,</p>
            
            <p>We have reviewed your registration for the Academic Portal.</p>
            
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <h3 style="margin-top: 0; color: #721c24;">Registration Status</h3>
                <p>Unfortunately, we are unable to approve your registration at this time.</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h3 style="margin-top: 0; color: #856404;">Reason:</h3>
                <p>${reason}</p>
            </div>
            
            <p>If you believe this is an error or would like to discuss this decision, please contact our support team.</p>
            
            <p>You may also submit a new registration if you believe you can address the concerns mentioned above.</p>
            
            <p>Best regards,<br>
            <strong>Academic Portal Team</strong></p>
        </div>
    `;

    await sendEmail({
        to: user.email,
        subject,
        text,
        html
    });
};

/**
 * Send assignment notification email
 * @param {Object} assignment - Assignment object
 * @param {Array} students - Array of student objects
 * @param {string} type - Notification type ('new', 'updated', 'reminder')
 */
const sendAssignmentNotification = async (assignment, students, type = 'new') => {
    const subjects = {
        new: 'New Assignment Posted',
        updated: 'Assignment Updated',
        reminder: 'Assignment Due Soon'
    };

    const subject = `${subjects[type]}: ${assignment.title}`;
    
    for (const student of students) {
        const text = `
            Hello ${student.firstName},
            
            ${type === 'new' ? 'A new assignment has been posted' : 
              type === 'updated' ? 'An assignment has been updated' : 
              'Reminder: Assignment due soon'}
            
            Assignment Details:
            - Title: ${assignment.title}
            - Course: ${assignment.course.title} (${assignment.course.code})
            - Due Date: ${new Date(assignment.dueDate).toLocaleDateString()}
            - Total Points: ${assignment.totalPoints}
            
            ${assignment.description}
            
            Please log in to the portal to view full details and submit your work.
            
            Best regards,
            Academic Portal Team
        `;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">${subjects[type]}</h2>
                
                <p>Hello <strong>${student.firstName}</strong>,</p>
                
                <p>${type === 'new' ? 'A new assignment has been posted' : 
                     type === 'updated' ? 'An assignment has been updated' : 
                     'Reminder: Assignment due soon'}</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Assignment Details:</h3>
                    <ul>
                        <li><strong>Title:</strong> ${assignment.title}</li>
                        <li><strong>Course:</strong> ${assignment.course.title} (${assignment.course.code})</li>
                        <li><strong>Due Date:</strong> ${new Date(assignment.dueDate).toLocaleDateString()}</li>
                        <li><strong>Total Points:</strong> ${assignment.totalPoints}</li>
                    </ul>
                </div>
                
                <div style="background-color: #fff; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
                    <p><strong>Description:</strong></p>
                    <p>${assignment.description}</p>
                </div>
                
                <p>Please log in to the portal to view full details and submit your work.</p>
                
                <p>Best regards,<br>
                <strong>Academic Portal Team</strong></p>
            </div>
        `;

        await sendEmail({
            to: student.email,
            subject,
            text,
            html
        });
    }
};

/**
 * Send grade notification email
 * @param {Object} student - Student object
 * @param {Object} assignment - Assignment object
 * @param {Object} submission - Submission object with grade
 */
const sendGradeNotification = async (student, assignment, submission) => {
    const subject = `Grade Posted: ${assignment.title}`;
    const percentage = ((submission.grade / assignment.totalPoints) * 100).toFixed(1);
    
    const text = `
        Hello ${student.firstName},
        
        Your assignment has been graded!
        
        Assignment: ${assignment.title}
        Course: ${assignment.course.title} (${assignment.course.code})
        
        Grade: ${submission.grade}/${assignment.totalPoints} (${percentage}%)
        
        ${submission.feedback ? `Feedback: ${submission.feedback}` : ''}
        
        Please log in to the portal to view detailed feedback.
        
        Best regards,
        Academic Portal Team
    `;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Grade Posted</h2>
            
            <p>Hello <strong>${student.firstName}</strong>,</p>
            
            <p>Your assignment has been graded!</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Grade Details:</h3>
                <ul>
                    <li><strong>Assignment:</strong> ${assignment.title}</li>
                    <li><strong>Course:</strong> ${assignment.course.title} (${assignment.course.code})</li>
                    <li><strong>Grade:</strong> ${submission.grade}/${assignment.totalPoints} (${percentage}%)</li>
                </ul>
            </div>
            
            ${submission.feedback ? `
                <div style="background-color: #fff; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
                    <p><strong>Feedback:</strong></p>
                    <p>${submission.feedback}</p>
                </div>
            ` : ''}
            
            <p>Please log in to the portal to view detailed feedback.</p>
            
            <p>Best regards,<br>
            <strong>Academic Portal Team</strong></p>
        </div>
    `;

    await sendEmail({
        to: student.email,
        subject,
        text,
        html
    });
};

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {string} resetToken - Password reset token
 */
const sendPasswordResetEmail = async (user, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const subject = 'Password Reset Request';
    
    const text = `
        Hello ${user.firstName},
        
        You have requested to reset your password for your Academic Portal account.
        
        Please click the following link to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour for security reasons.
        
        If you did not request this password reset, please ignore this email.
        
        Best regards,
        Academic Portal Team
    `;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            
            <p>Hello <strong>${user.firstName}</strong>,</p>
            
            <p>You have requested to reset your password for your Academic Portal account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #007bff; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                    Reset Password
                </a>
            </div>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            
            <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
            
            <p>If you did not request this password reset, please ignore this email.</p>
            
            <p>Best regards,<br>
            <strong>Academic Portal Team</strong></p>
        </div>
    `;

    await sendEmail({
        to: user.email,
        subject,
        text,
        html
    });
};

module.exports = {
    initializeEmailService,
    sendEmail,
    sendWelcomeEmail,
    sendRegistrationConfirmationEmail,
    notifyAdminsNewRegistration,
    sendRegistrationApprovalEmail,
    sendRegistrationRejectionEmail,
    sendAssignmentNotification,
    sendGradeNotification,
    sendPasswordResetEmail
};