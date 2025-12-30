const transporter = require('../config/email');

class EmailService {
    constructor() {
        this.fromEmail = process.env.EMAIL_FROM || 'Central University of Kashmir <noreply@cukashmir.ac.in>';
    }

    // Send registration approval email
    async sendRegistrationApprovalEmail(userDetails) {
        const { email, firstName, lastName, userType, loginCredentials } = userDetails;
        
        const subject = 'Registration Approved - Central University of Kashmir';
        const htmlContent = this.getRegistrationApprovalTemplate({
            firstName,
            lastName,
            userType,
            loginCredentials
        });

        return this.sendEmail(email, subject, htmlContent);
    }

    // Send registration rejection email
    async sendRegistrationRejectionEmail(userDetails) {
        const { email, firstName, lastName, reason } = userDetails;
        
        const subject = 'Registration Status - Central University of Kashmir';
        const htmlContent = this.getRegistrationRejectionTemplate({
            firstName,
            lastName,
            reason
        });

        return this.sendEmail(email, subject, htmlContent);
    }

    // Send password reset email
    async sendPasswordResetEmail(userDetails) {
        const { email, firstName, resetToken, userType } = userDetails;
        
        const subject = 'Password Reset Request - Central University of Kashmir';
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&type=${userType}`;
        
        const htmlContent = this.getPasswordResetTemplate({
            firstName,
            resetLink,
            userType
        });

        return this.sendEmail(email, subject, htmlContent);
    }

    // Send important notice alert
    async sendNoticeAlert(recipients, noticeDetails) {
        const { title, content, priority, createdBy, expiryDate } = noticeDetails;
        
        const subject = `${priority === 'urgent' ? '🚨 URGENT' : priority === 'important' ? '⚠️ IMPORTANT' : '📢'} Notice: ${title}`;
        
        const htmlContent = this.getNoticeAlertTemplate({
            title,
            content,
            priority,
            createdBy,
            expiryDate
        });

        // Send to multiple recipients
        const emailPromises = recipients.map(recipient => 
            this.sendEmail(recipient.email, subject, htmlContent)
        );

        return Promise.allSettled(emailPromises);
    }

    // Send welcome email for new users
    async sendWelcomeEmail(userDetails) {
        const { email, firstName, lastName, userType } = userDetails;
        
        const subject = 'Welcome to Central University of Kashmir Academic Portal';
        const htmlContent = this.getWelcomeTemplate({
            firstName,
            lastName,
            userType
        });

        return this.sendEmail(email, subject, htmlContent);
    }

    // Generic email sender
    async sendEmail(to, subject, html, attachments = []) {
        try {
            const mailOptions = {
                from: this.fromEmail,
                to: to,
                subject: subject,
                html: html,
                attachments: attachments
            };

            const result = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Email sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Email Templates
    getRegistrationApprovalTemplate({ firstName, lastName, userType, loginCredentials }) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Registration Approved</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
                .credentials { background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0284c7; }
                .button { display: inline-block; background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Registration Approved!</h1>
                    <p>Central University of Kashmir</p>
                </div>
                <div class="content">
                    <h2>Dear ${firstName} ${lastName},</h2>
                    
                    <p>Congratulations! Your registration as a <strong>${userType}</strong> has been approved by the administration.</p>
                    
                    <div class="credentials">
                        <h3>🔐 Your Login Credentials:</h3>
                        <p><strong>Login ID:</strong> ${loginCredentials.loginId}</p>
                        <p><strong>Password:</strong> ${loginCredentials.password}</p>
                        <p><strong>User Type:</strong> ${userType.charAt(0).toUpperCase() + userType.slice(1)}</p>
                    </div>
                    
                    <p><strong>Important Security Notes:</strong></p>
                    <ul>
                        <li>Please change your password after first login</li>
                        <li>Keep your credentials secure and confidential</li>
                        <li>Never share your login details with anyone</li>
                    </ul>
                    
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">
                        Access Academic Portal
                    </a>
                    
                    <p>If you have any questions or need assistance, please contact our support team at <strong>support@cukashmir.ac.in</strong> or call <strong>+91-194-2424000</strong>.</p>
                    
                    <p>Welcome to the Central University of Kashmir family!</p>
                    
                    <p>Best regards,<br>
                    <strong>Academic Administration</strong><br>
                    Central University of Kashmir</p>
                </div>
                <div class="footer">
                    <p>This is an automated email. Please do not reply to this message.</p>
                    <p>© ${new Date().getFullYear()} Central University of Kashmir. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    getRegistrationRejectionTemplate({ firstName, lastName, reason }) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Registration Status</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
                .reason { background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
                .button { display: inline-block; background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Registration Status Update</h1>
                    <p>Central University of Kashmir</p>
                </div>
                <div class="content">
                    <h2>Dear ${firstName} ${lastName},</h2>
                    
                    <p>Thank you for your interest in Central University of Kashmir. After careful review, we regret to inform you that your registration application could not be approved at this time.</p>
                    
                    <div class="reason">
                        <h3>📋 Reason:</h3>
                        <p>${reason}</p>
                    </div>
                    
                    <p><strong>Next Steps:</strong></p>
                    <ul>
                        <li>Please review the reason mentioned above</li>
                        <li>You may reapply after addressing the mentioned issues</li>
                        <li>Contact our admissions office for clarification if needed</li>
                    </ul>
                    
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">
                        Apply Again
                    </a>
                    
                    <p>For any questions or assistance, please contact our admissions team at <strong>admissions@cukashmir.ac.in</strong> or call <strong>+91-194-2424000</strong>.</p>
                    
                    <p>Thank you for your understanding.</p>
                    
                    <p>Best regards,<br>
                    <strong>Admissions Office</strong><br>
                    Central University of Kashmir</p>
                </div>
                <div class="footer">
                    <p>This is an automated email. Please do not reply to this message.</p>
                    <p>© ${new Date().getFullYear()} Central University of Kashmir. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    getPasswordResetTemplate({ firstName, resetLink, userType }) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset Request</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
                .reset-info { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0284c7; }
                .button { display: inline-block; background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
                .warning { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Password Reset Request</h1>
                    <p>Central University of Kashmir</p>
                </div>
                <div class="content">
                    <h2>Dear ${firstName},</h2>
                    
                    <p>We received a request to reset the password for your <strong>${userType}</strong> account.</p>
                    
                    <div class="reset-info">
                        <h3>🔑 Reset Your Password:</h3>
                        <p>Click the button below to create a new password. This link will expire in <strong>1 hour</strong> for security reasons.</p>
                    </div>
                    
                    <a href="${resetLink}" class="button">
                        Reset Password
                    </a>
                    
                    <div class="warning">
                        <h3>⚠️ Security Notice:</h3>
                        <ul>
                            <li>If you didn't request this password reset, please ignore this email</li>
                            <li>Never share this reset link with anyone</li>
                            <li>The link will expire in 1 hour</li>
                            <li>You can only use this link once</li>
                        </ul>
                    </div>
                    
                    <p><strong>Alternative Link:</strong><br>
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <code style="background: #e2e8f0; padding: 5px; border-radius: 4px; word-break: break-all;">${resetLink}</code></p>
                    
                    <p>If you continue to have problems, please contact our IT support team at <strong>support@cukashmir.ac.in</strong> or call <strong>+91-194-2424000</strong>.</p>
                    
                    <p>Best regards,<br>
                    <strong>IT Support Team</strong><br>
                    Central University of Kashmir</p>
                </div>
                <div class="footer">
                    <p>This is an automated email. Please do not reply to this message.</p>
                    <p>© ${new Date().getFullYear()} Central University of Kashmir. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    getNoticeAlertTemplate({ title, content, priority, createdBy, expiryDate }) {
        const priorityColors = {
            urgent: { bg: '#dc2626', text: '🚨 URGENT' },
            important: { bg: '#f59e0b', text: '⚠️ IMPORTANT' },
            normal: { bg: '#1e40af', text: '📢 NOTICE' }
        };

        const priorityStyle = priorityColors[priority] || priorityColors.normal;

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Important Notice</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: ${priorityStyle.bg}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
                .notice-content { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${priorityStyle.bg}; }
                .priority-badge { display: inline-block; background: ${priorityStyle.bg}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; margin: 10px 0; }
                .button { display: inline-block; background: ${priorityStyle.bg}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
                .meta-info { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${priorityStyle.text}</h1>
                    <p>Central University of Kashmir</p>
                </div>
                <div class="content">
                    <div class="priority-badge">${priorityStyle.text}</div>
                    
                    <h2>${title}</h2>
                    
                    <div class="notice-content">
                        ${content.replace(/\n/g, '<br>')}
                    </div>
                    
                    <div class="meta-info">
                        <p><strong>📝 Published by:</strong> ${createdBy}</p>
                        <p><strong>📅 Published on:</strong> ${new Date().toLocaleDateString('en-IN', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</p>
                        ${expiryDate ? `<p><strong>⏰ Valid until:</strong> ${new Date(expiryDate).toLocaleDateString('en-IN', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric'
                        })}</p>` : ''}
                    </div>
                    
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">
                        View on Portal
                    </a>
                    
                    <p><strong>📱 Stay Updated:</strong><br>
                    Log in to the academic portal regularly to stay updated with the latest notices and announcements.</p>
                    
                    <p>For any questions regarding this notice, please contact the relevant department or call our main office at <strong>+91-194-2424000</strong>.</p>
                    
                    <p>Best regards,<br>
                    <strong>Academic Administration</strong><br>
                    Central University of Kashmir</p>
                </div>
                <div class="footer">
                    <p>This is an automated notification. Please do not reply to this message.</p>
                    <p>© ${new Date().getFullYear()} Central University of Kashmir. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    getWelcomeTemplate({ firstName, lastName, userType }) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to CUK</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
                .welcome-info { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
                .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎓 Welcome to CUK!</h1>
                    <p>Central University of Kashmir</p>
                </div>
                <div class="content">
                    <h2>Dear ${firstName} ${lastName},</h2>
                    
                    <p>Welcome to the Central University of Kashmir Academic Portal! We're excited to have you as part of our academic community.</p>
                    
                    <div class="welcome-info">
                        <h3>🚀 Getting Started:</h3>
                        <ul>
                            <li>Complete your profile information</li>
                            <li>Explore the academic portal features</li>
                            <li>Check for important notices and announcements</li>
                            <li>Contact support if you need any assistance</li>
                        </ul>
                    </div>
                    
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">
                        Access Your Portal
                    </a>
                    
                    <p>If you have any questions or need assistance, our support team is here to help:</p>
                    <ul>
                        <li><strong>Email:</strong> support@cukashmir.ac.in</li>
                        <li><strong>Phone:</strong> +91-194-2424000</li>
                        <li><strong>Office Hours:</strong> Monday - Friday, 9:00 AM - 5:00 PM</li>
                    </ul>
                    
                    <p>We look forward to supporting your academic journey!</p>
                    
                    <p>Best regards,<br>
                    <strong>Academic Administration</strong><br>
                    Central University of Kashmir</p>
                </div>
                <div class="footer">
                    <p>This is an automated email. Please do not reply to this message.</p>
                    <p>© ${new Date().getFullYear()} Central University of Kashmir. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

module.exports = new EmailService();