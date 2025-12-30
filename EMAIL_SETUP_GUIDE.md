# Email Notifications Setup Guide

This guide explains how to configure email notifications for the Academic Management Portal using nodemailer.

## 📧 Email Features Implemented

### 1. Registration Approval/Rejection Emails
- **Approval Email**: Sent when admin approves a registration with login credentials
- **Rejection Email**: Sent when admin rejects a registration with reason
- **Welcome Email**: Sent immediately after registration submission

### 2. Password Reset Emails
- **Reset Request**: Secure password reset link with 1-hour expiry
- **Token Verification**: Validates reset tokens before allowing password change
- **Security Notifications**: Includes security tips and warnings

### 3. Important Notice Alerts
- **Urgent Notices**: Immediate email alerts for urgent announcements
- **Important Notices**: Email notifications for important updates
- **Targeted Notifications**: Sends to specific audiences (all, students, faculty, courses, years)

## 🔧 Configuration Setup

### 1. Environment Variables

Add these variables to your `.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Central University of Kashmir <noreply@cukashmir.ac.in>

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Password Reset Configuration
RESET_TOKEN_EXPIRES_IN=1h
```

### 2. Gmail Setup (Recommended)

#### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Enable 2-Factor Authentication

#### Step 2: Generate App Password
1. Go to Security → App passwords
2. Select "Mail" and your device
3. Copy the generated 16-character password
4. Use this password in `EMAIL_PASS` (not your regular Gmail password)

#### Step 3: Update Environment Variables
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_character_app_password
```

### 3. Other Email Providers

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_password
```

#### Yahoo Mail
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your_email@yahoo.com
EMAIL_PASS=your_app_password
```

#### Custom SMTP Server
```env
EMAIL_HOST=your_smtp_server.com
EMAIL_PORT=587
EMAIL_USER=your_username
EMAIL_PASS=your_password
```

## 📋 API Endpoints

### Registration Emails
- `POST /api/registration/register` - Sends welcome email
- `PUT /api/registration/approve/:id` - Sends approval email with credentials
- `PUT /api/registration/reject/:id` - Sends rejection email with reason

### Password Reset Emails
- `POST /api/auth/forgot-password` - Sends password reset email
- `POST /api/auth/reset-password` - Completes password reset
- `GET /api/auth/verify-reset-token/:token` - Verifies reset token

### Notice Alert Emails
- `POST /api/notices` - Sends email alerts for important/urgent notices

## 🎨 Email Templates

### Template Features
- **Responsive Design**: Works on all devices and email clients
- **University Branding**: Consistent with CUK branding
- **Security Focused**: Clear security warnings and instructions
- **Professional Layout**: Clean, modern design with proper typography

### Template Types
1. **Registration Approval**: Welcome message with login credentials
2. **Registration Rejection**: Polite rejection with next steps
3. **Password Reset**: Secure reset link with expiry information
4. **Notice Alerts**: Priority-based styling (urgent, important, normal)
5. **Welcome Email**: Initial welcome message for new registrations

## 🔒 Security Features

### Password Reset Security
- **Token Expiry**: Reset tokens expire in 1 hour
- **Single Use**: Tokens can only be used once
- **Secure Generation**: Cryptographically secure random tokens
- **User Verification**: Validates user exists and is active

### Email Security
- **No Sensitive Data**: Passwords never sent in plain text
- **Secure Links**: All links use HTTPS in production
- **Anti-Phishing**: Clear sender identification and warnings
- **Rate Limiting**: Prevents email spam and abuse

## 🚀 Usage Examples

### 1. Registration Approval
```javascript
// Admin approves registration
const approvalResult = await registrationController.approveRegistration(req, res);
// Automatically sends approval email with login credentials
```

### 2. Password Reset Request
```javascript
// User requests password reset
const resetResult = await authController.forgotPassword(req, res);
// Sends secure reset link to user's email
```

### 3. Important Notice Alert
```javascript
// Create urgent notice
const notice = await noticeController.createNotice({
  title: "Emergency: Classes Cancelled",
  content: "Due to weather conditions...",
  priority: "urgent",
  targetAudience: "all"
});
// Automatically sends email alerts to all users
```

## 📊 Email Monitoring

### Success/Failure Logging
- All email attempts are logged with status
- Failed emails are logged with error details
- Success rates are tracked for monitoring

### Console Output Examples
```
📧 Welcome email sent to student@example.com
📧 Approval email sent to faculty@example.com
📧 Password reset email sent to user@example.com
📧 Notice email notifications: 150 sent, 2 failed
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Authentication Failed
**Problem**: "Invalid login" or "Authentication failed"
**Solution**: 
- Use app password instead of regular password
- Enable 2-factor authentication
- Check EMAIL_USER and EMAIL_PASS values

#### 2. Connection Timeout
**Problem**: "Connection timeout" or "ETIMEDOUT"
**Solution**:
- Check EMAIL_HOST and EMAIL_PORT
- Verify firewall settings
- Try different port (465 for SSL, 587 for TLS)

#### 3. Emails Not Received
**Problem**: Emails sent but not received
**Solution**:
- Check spam/junk folders
- Verify recipient email addresses
- Check email provider limits
- Verify EMAIL_FROM address

#### 4. SSL/TLS Errors
**Problem**: "SSL/TLS connection failed"
**Solution**:
```javascript
// Add to email config if needed
{
  secure: false, // true for 465, false for other ports
  requireTLS: true,
  tls: {
    rejectUnauthorized: false // Only for development
  }
}
```

### Testing Email Configuration

```javascript
// Test email configuration
const emailService = require('./server/services/emailService');

// Send test email
emailService.sendEmail(
  'test@example.com',
  'Test Email',
  '<h1>Test successful!</h1>'
).then(result => {
  console.log('Email test result:', result);
}).catch(error => {
  console.error('Email test failed:', error);
});
```

## 📈 Production Considerations

### 1. Email Service Providers
For production, consider using dedicated email services:
- **SendGrid**: Reliable with good deliverability
- **Mailgun**: Developer-friendly with APIs
- **Amazon SES**: Cost-effective for high volume
- **Postmark**: Excellent for transactional emails

### 2. Rate Limiting
Implement rate limiting for email endpoints:
```javascript
// Limit password reset requests
app.use('/api/auth/forgot-password', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3 // limit each IP to 3 requests per windowMs
}));
```

### 3. Email Queue
For high volume, implement email queuing:
```javascript
// Using Bull Queue (example)
const Queue = require('bull');
const emailQueue = new Queue('email processing');

emailQueue.process(async (job) => {
  const { to, subject, html } = job.data;
  return await emailService.sendEmail(to, subject, html);
});
```

### 4. Monitoring and Analytics
- Track email delivery rates
- Monitor bounce rates
- Set up alerts for failed emails
- Log email metrics for analysis

## 🎯 Best Practices

1. **Always use HTTPS** for email links in production
2. **Validate email addresses** before sending
3. **Implement retry logic** for failed emails
4. **Use templates** for consistent branding
5. **Test thoroughly** with different email providers
6. **Monitor delivery rates** and adjust as needed
7. **Respect user preferences** for email notifications
8. **Include unsubscribe options** where appropriate

## 📞 Support

If you encounter issues with email configuration:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Test with a simple email first
4. Check server logs for detailed error messages
5. Contact your email provider for specific configuration help

---

**Note**: Always test email functionality in a development environment before deploying to production. Keep your email credentials secure and never commit them to version control.