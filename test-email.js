// Email Testing Script
// Run this script to test email configuration
// Usage: node test-email.js

require('dotenv').config();
const emailService = require('./server/services/emailService');

async function testEmailConfiguration() {
    console.log('🧪 Testing Email Configuration...\n');
    
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'Not set');
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT || 'Not set');
    console.log('EMAIL_USER:', process.env.EMAIL_USER || 'Not set');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***hidden***' : 'Not set');
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'Not set');
    console.log('');

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('❌ Email configuration incomplete. Please set EMAIL_USER and EMAIL_PASS in .env file');
        return;
    }

    // Test 1: Registration Approval Email
    console.log('📧 Test 1: Registration Approval Email');
    try {
        const approvalResult = await emailService.sendRegistrationApprovalEmail({
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            userType: 'student',
            loginCredentials: {
                loginId: 'ST001',
                password: 'TempPass123!'
            }
        });
        console.log('✅ Registration approval email test:', approvalResult.success ? 'PASSED' : 'FAILED');
        if (!approvalResult.success) {
            console.log('❌ Error:', approvalResult.error);
        }
    } catch (error) {
        console.log('❌ Registration approval email test: FAILED');
        console.log('Error:', error.message);
    }
    console.log('');

    // Test 2: Password Reset Email
    console.log('📧 Test 2: Password Reset Email');
    try {
        const resetResult = await emailService.sendPasswordResetEmail({
            email: 'test@example.com',
            firstName: 'John',
            resetToken: 'test-reset-token-123',
            userType: 'student'
        });
        console.log('✅ Password reset email test:', resetResult.success ? 'PASSED' : 'FAILED');
        if (!resetResult.success) {
            console.log('❌ Error:', resetResult.error);
        }
    } catch (error) {
        console.log('❌ Password reset email test: FAILED');
        console.log('Error:', error.message);
    }
    console.log('');

    // Test 3: Notice Alert Email
    console.log('📧 Test 3: Notice Alert Email');
    try {
        const noticeResult = await emailService.sendNoticeAlert(
            [{ email: 'test@example.com', firstName: 'John', lastName: 'Doe' }],
            {
                title: 'Test Notice',
                content: 'This is a test notice to verify email functionality.',
                priority: 'important',
                createdBy: 'System Administrator',
                expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            }
        );
        console.log('✅ Notice alert email test:', noticeResult.length > 0 ? 'PASSED' : 'FAILED');
        if (noticeResult.length > 0 && noticeResult[0].status === 'rejected') {
            console.log('❌ Error:', noticeResult[0].reason);
        }
    } catch (error) {
        console.log('❌ Notice alert email test: FAILED');
        console.log('Error:', error.message);
    }
    console.log('');

    // Test 4: Welcome Email
    console.log('📧 Test 4: Welcome Email');
    try {
        const welcomeResult = await emailService.sendWelcomeEmail({
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            userType: 'student'
        });
        console.log('✅ Welcome email test:', welcomeResult.success ? 'PASSED' : 'FAILED');
        if (!welcomeResult.success) {
            console.log('❌ Error:', welcomeResult.error);
        }
    } catch (error) {
        console.log('❌ Welcome email test: FAILED');
        console.log('Error:', error.message);
    }
    console.log('');

    console.log('🏁 Email testing completed!');
    console.log('');
    console.log('📝 Notes:');
    console.log('- All emails are sent to test@example.com (change this for real testing)');
    console.log('- Check your email provider logs for actual delivery status');
    console.log('- For Gmail, make sure you use an App Password, not your regular password');
    console.log('- Check spam/junk folders if emails are not received');
}

// Run the test
testEmailConfiguration().catch(error => {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
});