const nodemailer = require('nodemailer');
require('dotenv').config();

// Email configuration
const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify connection configuration
transporter.verify(function(error, success) {
    if (error) {
        console.log('Email configuration error:', error);
    } else {
        console.log('Email server is ready to take our messages');
    }
});

module.exports = transporter;