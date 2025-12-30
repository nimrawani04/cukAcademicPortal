// Base User model - Defines the common structure for all user types in MongoDB
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Base User Schema - Common fields for all user types
 * This defines the shared fields that all users (Student, Faculty, Admin) will have
 */
const baseUserSchema = new mongoose.Schema({
    // Basic user information (common to all user types)
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [2, 'First name must be at least 2 characters'],
        maxlength: [50, 'First name cannot exceed 50 characters'],
        match: [/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces']
    },
    
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minlength: [2, 'Last name must be at least 2 characters'],
        maxlength: [50, 'Last name cannot exceed 50 characters'],
        match: [/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces']
    },
    
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true, // No two users can have the same email across all collections
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
    },
    
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[+]?[\d\s\-()]{10,15}$/, 'Please enter a valid phone number']
    },
    
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        validate: {
            validator: function(password) {
                // Password must contain at least one uppercase, one lowercase, one number, and one special character
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
            },
            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }
    },
    
    role: {
        type: String,
        required: [true, 'User role is required'],
        enum: {
            values: ['student', 'faculty', 'admin'],
            message: 'Role must be either student, faculty, or admin'
        }
    },
    
    // Profile information
    profilePicture: {
        type: String, // Store file path or URL
        default: null
    },
    
    // Account status and security
    isActive: {
        type: Boolean,
        default: false  // Changed: New registrations are inactive by default
    },
    
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    
    emailVerificationToken: {
        type: String,
        default: null
    },
    
    passwordResetToken: {
        type: String,
        default: null
    },
    
    passwordResetExpires: {
        type: Date,
        default: null
    },
    
    // Registration status and approval workflow
    registrationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    
    registrationDate: {
        type: Date,
        default: Date.now
    },
    
    approvalRequired: {
        type: Boolean,
        default: true
    },
    
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    approvedAt: {
        type: Date,
        default: null
    },
    
    approvalComments: {
        type: String,
        maxlength: [500, 'Approval comments cannot exceed 500 characters'],
        default: null
    },
    
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    rejectedAt: {
        type: Date,
        default: null
    },
    
    rejectionReason: {
        type: String,
        maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
        default: null
    },
    
    // Login tracking
    lastLogin: {
        type: Date,
        default: null
    },
    
    loginAttempts: {
        type: Number,
        default: 0
    },
    
    lockUntil: {
        type: Date,
        default: null
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    // Schema options
    discriminatorKey: 'userType', // This field will differentiate between user types
    collection: 'users', // All user types will be stored in the same collection
    timestamps: true // Automatically manage createdAt and updatedAt
});

/**
 * Pre-save middleware - Runs before saving a user to the database
 * This automatically hashes the password for security and updates timestamps
 */
baseUserSchema.pre('save', async function(next) {
    try {
        // Update the updatedAt field
        this.updatedAt = new Date();
        
        // Only hash the password if it has been modified (or is new)
        if (!this.isModified('password')) return next();
        
        // Hash the password with salt rounds from environment or default to 12
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        const salt = await bcrypt.genSalt(saltRounds);
        this.password = await bcrypt.hash(this.password, salt);
        
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Instance method to compare passwords
 * This method can be called on any user document to verify passwords
 */
baseUserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

/**
 * Instance method to check if account is locked
 */
baseUserSchema.methods.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

/**
 * Instance method to increment login attempts
 */
baseUserSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }
    
    return this.updateOne(updates);
};

/**
 * Instance method to reset login attempts
 */
baseUserSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

/**
 * Virtual field to get full name
 * This creates a computed property that combines first and last name
 */
baseUserSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

/**
 * Virtual field to get initials
 */
baseUserSchema.virtual('initials').get(function() {
    return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
});

/**
 * Virtual field to check if account is locked
 */
baseUserSchema.virtual('isAccountLocked').get(function() {
    return this.isLocked();
});

// Ensure virtual fields are included when converting to JSON
baseUserSchema.set('toJSON', { 
    virtuals: true,
    transform: function(doc, ret) {
        // Remove sensitive fields from JSON output
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.emailVerificationToken;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        return ret;
    }
});

// Ensure virtual fields are included when converting to Object
baseUserSchema.set('toObject', { virtuals: true });

// Create indexes for better performance
baseUserSchema.index({ email: 1 });
baseUserSchema.index({ role: 1 });
baseUserSchema.index({ isActive: 1 });
baseUserSchema.index({ registrationStatus: 1 });
baseUserSchema.index({ createdAt: -1 });
baseUserSchema.index({ registrationDate: -1 });

// Create and export the base User model
const User = mongoose.model('User', baseUserSchema);

module.exports = User;