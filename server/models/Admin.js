// Admin model - Defines the structure of admin-specific data in MongoDB
const mongoose = require('mongoose');
const User = require('./User');

/**
 * Admin Schema - Extends the base User model with admin-specific fields
 * This uses Mongoose discriminators to create a specialized admin model
 */
const adminSchema = new mongoose.Schema({
    // Admin-specific identification
    adminId: {
        type: String,
        required: [true, 'Admin ID is required'],
        unique: true,
        trim: true,
        uppercase: true,
        match: [/^ADM[0-9]{4,8}$/, 'Admin ID must start with ADM followed by 4-8 digits (e.g., ADM12345)']
    },
    
    // Administrative information
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true,
        enum: {
            values: [
                'Academic Affairs',
                'Student Affairs',
                'Finance and Accounts',
                'Human Resources',
                'Information Technology',
                'Library Services',
                'Admissions',
                'Examination',
                'Research and Development',
                'International Relations',
                'Campus Facilities',
                'Security',
                'Transport',
                'Hostel Management',
                'Placement and Training',
                'Public Relations',
                'Legal Affairs',
                'Quality Assurance',
                'General Administration',
                'Other'
            ],
            message: 'Please select a valid department'
        }
    },
    
    designation: {
        type: String,
        required: [true, 'Designation is required'],
        trim: true,
        enum: {
            values: [
                'Super Admin',
                'System Administrator',
                'Academic Administrator',
                'Finance Administrator',
                'HR Administrator',
                'IT Administrator',
                'Registrar',
                'Deputy Registrar',
                'Assistant Registrar',
                'Administrative Officer',
                'Senior Administrative Officer',
                'Executive Officer',
                'Manager',
                'Assistant Manager',
                'Coordinator',
                'Supervisor',
                'Clerk',
                'Assistant',
                'Other'
            ],
            message: 'Please select a valid designation'
        }
    },
    
    // Access and permissions
    accessLevel: {
        type: String,
        required: [true, 'Access level is required'],
        enum: {
            values: ['Super Admin', 'High', 'Medium', 'Low', 'Read Only'],
            message: 'Invalid access level'
        },
        default: 'Low'
    },
    
    permissions: [{
        module: {
            type: String,
            required: true,
            enum: [
                'User Management',
                'Student Management',
                'Faculty Management',
                'Course Management',
                'Examination Management',
                'Fee Management',
                'Library Management',
                'Hostel Management',
                'Transport Management',
                'Placement Management',
                'Reports and Analytics',
                'System Settings',
                'Backup and Restore',
                'Audit Logs',
                'Notifications',
                'Content Management',
                'Academic Calendar',
                'Timetable Management',
                'Attendance Management',
                'Grade Management'
            ]
        },
        actions: [{
            type: String,
            enum: ['Create', 'Read', 'Update', 'Delete', 'Export', 'Import', 'Approve', 'Reject']
        }],
        granted: {
            type: Boolean,
            default: false
        },
        grantedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        grantedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Employment details
    employeeType: {
        type: String,
        required: [true, 'Employee type is required'],
        enum: {
            values: ['Permanent', 'Contract', 'Temporary', 'Consultant', 'Part-time'],
            message: 'Invalid employee type'
        }
    },
    
    joiningDate: {
        type: Date,
        required: [true, 'Joining date is required'],
        validate: {
            validator: function(date) {
                return date <= new Date();
            },
            message: 'Joining date cannot be in the future'
        }
    },
    
    contractEndDate: {
        type: Date,
        validate: {
            validator: function(date) {
                return !date || date > this.joiningDate;
            },
            message: 'Contract end date must be after joining date'
        }
    },
    
    // Reporting structure
    reportsTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        validate: {
            validator: function(value) {
                return !value || value.toString() !== this._id.toString();
            },
            message: 'Admin cannot report to themselves'
        }
    },
    
    subordinates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // Office and contact information
    officeLocation: {
        building: {
            type: String,
            trim: true,
            maxlength: [50, 'Building name cannot exceed 50 characters']
        },
        floor: {
            type: String,
            trim: true,
            maxlength: [10, 'Floor cannot exceed 10 characters']
        },
        roomNumber: {
            type: String,
            trim: true,
            maxlength: [20, 'Room number cannot exceed 20 characters']
        }
    },
    
    workingHours: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            required: true
        },
        startTime: {
            type: String,
            required: true,
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
        },
        endTime: {
            type: String,
            required: true,
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
        }
    }],
    
    // Qualifications and experience
    qualifications: [{
        degree: {
            type: String,
            required: [true, 'Degree is required'],
            trim: true,
            enum: ['Ph.D', 'M.Tech', 'M.E', 'M.Sc', 'M.A', 'MBA', 'MCA', 'B.Tech', 'B.E', 'B.Sc', 'B.A', 'BCA', 'Diploma', 'Other']
        },
        field: {
            type: String,
            required: [true, 'Field of study is required'],
            trim: true,
            maxlength: [100, 'Field of study cannot exceed 100 characters']
        },
        institution: {
            type: String,
            required: [true, 'Institution name is required'],
            trim: true,
            maxlength: [200, 'Institution name cannot exceed 200 characters']
        },
        year: {
            type: Number,
            required: [true, 'Graduation year is required'],
            min: [1950, 'Year must be after 1950'],
            max: [new Date().getFullYear(), 'Year cannot be in the future']
        },
        grade: {
            type: String,
            trim: true,
            maxlength: [20, 'Grade cannot exceed 20 characters']
        }
    }],
    
    experience: {
        totalYears: {
            type: Number,
            min: [0, 'Experience cannot be negative'],
            default: 0
        },
        adminYears: {
            type: Number,
            min: [0, 'Administrative experience cannot be negative'],
            default: 0
        },
        industryYears: {
            type: Number,
            min: [0, 'Industry experience cannot be negative'],
            default: 0
        },
        educationYears: {
            type: Number,
            min: [0, 'Education sector experience cannot be negative'],
            default: 0
        }
    },
    
    // Specialization and skills
    specialization: [{
        type: String,
        trim: true,
        maxlength: [100, 'Specialization cannot exceed 100 characters']
    }],
    
    technicalSkills: [{
        skill: {
            type: String,
            required: true,
            trim: true,
            maxlength: [50, 'Skill name cannot exceed 50 characters']
        },
        proficiency: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
            required: true
        },
        certifications: [{
            name: String,
            issuedBy: String,
            issuedDate: Date,
            expiryDate: Date
        }]
    }],
    
    // System access and security
    lastPasswordChange: {
        type: Date,
        default: Date.now
    },
    
    passwordExpiryDays: {
        type: Number,
        default: 90,
        min: [30, 'Password expiry cannot be less than 30 days'],
        max: [365, 'Password expiry cannot be more than 365 days']
    },
    
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    
    ipWhitelist: [{
        ip: {
            type: String,
            required: true,
            match: [/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, 'Invalid IP address format']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [100, 'IP description cannot exceed 100 characters']
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Activity tracking
    loginHistory: [{
        loginTime: {
            type: Date,
            required: true
        },
        logoutTime: Date,
        ipAddress: String,
        userAgent: String,
        location: {
            country: String,
            city: String,
            coordinates: {
                latitude: Number,
                longitude: Number
            }
        },
        sessionDuration: Number // in minutes
    }],
    
    activityLog: [{
        action: {
            type: String,
            required: true,
            maxlength: [200, 'Action description cannot exceed 200 characters']
        },
        module: String,
        targetId: String,
        targetType: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        ipAddress: String,
        details: mongoose.Schema.Types.Mixed
    }],
    
    // Personal information
    dateOfBirth: {
        type: Date,
        validate: {
            validator: function(date) {
                if (!date) return true;
                const age = (new Date() - date) / (365.25 * 24 * 60 * 60 * 1000);
                return age >= 18 && age <= 70;
            },
            message: 'Age must be between 18 and 70 years'
        }
    },
    
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
        required: [true, 'Gender is required']
    },
    
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        uppercase: true
    },
    
    // Emergency contact
    emergencyContact: {
        name: {
            type: String,
            trim: true,
            maxlength: [100, 'Emergency contact name cannot exceed 100 characters']
        },
        relationship: {
            type: String,
            trim: true,
            enum: ['Spouse', 'Parent', 'Sibling', 'Child', 'Relative', 'Friend', 'Other'],
            default: 'Spouse'
        },
        phone: {
            type: String,
            trim: true,
            match: [/^[+]?[\d\s\-()]{10,15}$/, 'Please enter a valid emergency contact phone number']
        }
    },
    
    // Employment status and HR information
    employmentStatus: {
        type: String,
        enum: {
            values: ['Active', 'On Leave', 'Suspended', 'Terminated', 'Resigned', 'Retired'],
            message: 'Invalid employment status'
        },
        default: 'Active'
    },
    
    salaryGrade: {
        type: String,
        trim: true,
        maxlength: [20, 'Salary grade cannot exceed 20 characters']
    },
    
    // Training and development
    trainings: [{
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: [200, 'Training title cannot exceed 200 characters']
        },
        provider: {
            type: String,
            required: true,
            trim: true,
            maxlength: [100, 'Training provider cannot exceed 100 characters']
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: Date,
        duration: {
            type: Number, // in hours
            min: [1, 'Training duration must be at least 1 hour']
        },
        status: {
            type: String,
            enum: ['Planned', 'In Progress', 'Completed', 'Cancelled'],
            default: 'Planned'
        },
        certificateUrl: String
    }]
}, {
    timestamps: true // Automatically manage createdAt and updatedAt
});

/**
 * Pre-save middleware for admin-specific validations
 */
adminSchema.pre('save', function(next) {
    // Calculate total experience based on joining date
    if (this.joiningDate) {
        const yearsOfService = (new Date() - this.joiningDate) / (365.25 * 24 * 60 * 60 * 1000);
        if (yearsOfService > 0) {
            this.experience.totalYears = Math.max(this.experience.totalYears, Math.floor(yearsOfService));
        }
    }
    
    // Validate working hours
    for (const workingHour of this.workingHours) {
        const startTime = workingHour.startTime.split(':').map(Number);
        const endTime = workingHour.endTime.split(':').map(Number);
        const startMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];
        
        if (startMinutes >= endMinutes) {
            return next(new Error('Working hours end time must be after start time'));
        }
    }
    
    // Check password expiry
    if (this.lastPasswordChange) {
        const daysSinceChange = (new Date() - this.lastPasswordChange) / (24 * 60 * 60 * 1000);
        if (daysSinceChange > this.passwordExpiryDays) {
            // Password has expired - this could trigger a notification
            console.warn(`Password expired for admin: ${this.adminId}`);
        }
    }
    
    next();
});

/**
 * Instance method to check if admin has specific permission
 */
adminSchema.methods.hasPermission = function(module, action) {
    if (this.accessLevel === 'Super Admin') return true;
    
    const permission = this.permissions.find(p => p.module === module);
    return permission && permission.granted && permission.actions.includes(action);
};

/**
 * Instance method to grant permission
 */
adminSchema.methods.grantPermission = function(module, actions, grantedBy) {
    const existingPermission = this.permissions.find(p => p.module === module);
    
    if (existingPermission) {
        existingPermission.actions = [...new Set([...existingPermission.actions, ...actions])];
        existingPermission.granted = true;
        existingPermission.grantedBy = grantedBy;
        existingPermission.grantedAt = new Date();
    } else {
        this.permissions.push({
            module,
            actions,
            granted: true,
            grantedBy,
            grantedAt: new Date()
        });
    }
};

/**
 * Instance method to revoke permission
 */
adminSchema.methods.revokePermission = function(module, actions = null) {
    const permissionIndex = this.permissions.findIndex(p => p.module === module);
    
    if (permissionIndex !== -1) {
        if (actions) {
            // Remove specific actions
            this.permissions[permissionIndex].actions = this.permissions[permissionIndex].actions.filter(
                action => !actions.includes(action)
            );
            
            // If no actions left, mark as not granted
            if (this.permissions[permissionIndex].actions.length === 0) {
                this.permissions[permissionIndex].granted = false;
            }
        } else {
            // Remove entire permission
            this.permissions.splice(permissionIndex, 1);
        }
    }
};

/**
 * Instance method to log activity
 */
adminSchema.methods.logActivity = function(action, module, targetId, targetType, details, ipAddress) {
    this.activityLog.push({
        action,
        module,
        targetId,
        targetType,
        details,
        ipAddress,
        timestamp: new Date()
    });
    
    // Keep only last 1000 activity logs to prevent document size issues
    if (this.activityLog.length > 1000) {
        this.activityLog = this.activityLog.slice(-1000);
    }
};

/**
 * Instance method to calculate age
 */
adminSchema.methods.getAge = function() {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
};

/**
 * Instance method to calculate years of service
 */
adminSchema.methods.getYearsOfService = function() {
    if (!this.joiningDate) return 0;
    const today = new Date();
    const joiningDate = new Date(this.joiningDate);
    return Math.floor((today - joiningDate) / (365.25 * 24 * 60 * 60 * 1000));
};

/**
 * Instance method to check if password needs to be changed
 */
adminSchema.methods.isPasswordExpired = function() {
    if (!this.lastPasswordChange) return true;
    const daysSinceChange = (new Date() - this.lastPasswordChange) / (24 * 60 * 60 * 1000);
    return daysSinceChange > this.passwordExpiryDays;
};

/**
 * Virtual field to get full office location
 */
adminSchema.virtual('fullOfficeLocation').get(function() {
    if (!this.officeLocation || !this.officeLocation.building) return null;
    
    const locationParts = [
        this.officeLocation.roomNumber,
        this.officeLocation.floor ? `Floor ${this.officeLocation.floor}` : null,
        this.officeLocation.building
    ].filter(part => part);
    
    return locationParts.join(', ');
});

/**
 * Virtual field to get highest qualification
 */
adminSchema.virtual('highestQualification').get(function() {
    if (!this.qualifications || this.qualifications.length === 0) return null;
    
    const degreeHierarchy = ['Ph.D', 'M.Tech', 'M.E', 'M.Sc', 'M.A', 'MBA', 'MCA', 'B.Tech', 'B.E', 'B.Sc', 'B.A', 'BCA', 'Diploma'];
    
    let highest = this.qualifications[0];
    for (const qualification of this.qualifications) {
        if (degreeHierarchy.indexOf(qualification.degree) < degreeHierarchy.indexOf(highest.degree)) {
            highest = qualification;
        }
    }
    
    return highest;
});

/**
 * Virtual field to get active permissions count
 */
adminSchema.virtual('activePermissionsCount').get(function() {
    return this.permissions.filter(p => p.granted).length;
});

// Create indexes for better query performance
adminSchema.index({ adminId: 1 });
adminSchema.index({ department: 1, designation: 1 });
adminSchema.index({ accessLevel: 1 });
adminSchema.index({ employmentStatus: 1 });
adminSchema.index({ joiningDate: -1 });
adminSchema.index({ 'permissions.module': 1 });

// Ensure virtual fields are included when converting to JSON
adminSchema.set('toJSON', { 
    virtuals: true,
    transform: function(doc, ret) {
        // Remove sensitive fields from JSON output
        delete ret.loginHistory;
        delete ret.activityLog;
        delete ret.ipWhitelist;
        return ret;
    }
});
adminSchema.set('toObject', { virtuals: true });

// Create the Admin model as a discriminator of User
const Admin = User.discriminator('Admin', adminSchema);

module.exports = Admin;