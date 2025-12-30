// Faculty model - Defines the structure of faculty-specific data in MongoDB
const mongoose = require('mongoose');
const User = require('./User');

/**
 * Faculty Schema - Extends the base User model with faculty-specific fields
 * This uses Mongoose discriminators to create a specialized faculty model
 */
const facultySchema = new mongoose.Schema({
    // Faculty-specific identification
    facultyId: {
        type: String,
        required: [true, 'Faculty ID is required'],
        unique: true,
        trim: true,
        uppercase: true,
        match: [/^FAC[0-9]{4,8}$/, 'Faculty ID must start with FAC followed by 4-8 digits (e.g., FAC12345)']
    },
    
    // Department and academic information
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true,
        enum: {
            values: [
                'Computer Science and Engineering',
                'Information Technology',
                'Electronics and Communication Engineering',
                'Mechanical Engineering',
                'Civil Engineering',
                'Electrical Engineering',
                'Chemical Engineering',
                'Biotechnology',
                'Mathematics',
                'Physics',
                'Chemistry',
                'Biology',
                'English',
                'Business Administration',
                'Economics',
                'Psychology',
                'Library Sciences',
                'Physical Education',
                'Administration',
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
                'Professor',
                'Associate Professor',
                'Assistant Professor',
                'Lecturer',
                'Senior Lecturer',
                'Visiting Faculty',
                'Guest Faculty',
                'Research Associate',
                'Lab Assistant',
                'Teaching Assistant',
                'Department Head',
                'Dean',
                'Director',
                'Principal',
                'Vice Principal',
                'Librarian',
                'Administrative Officer',
                'Other'
            ],
            message: 'Please select a valid designation'
        }
    },
    
    // Employment details
    employeeType: {
        type: String,
        required: [true, 'Employee type is required'],
        enum: {
            values: ['Permanent', 'Contract', 'Visiting', 'Guest', 'Part-time', 'Temporary'],
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
    
    // Academic qualifications
    qualifications: [{
        degree: {
            type: String,
            required: [true, 'Degree is required'],
            trim: true,
            enum: ['Ph.D', 'M.Tech', 'M.E', 'M.Sc', 'M.A', 'MBA', 'B.Tech', 'B.E', 'B.Sc', 'B.A', 'Diploma', 'Other']
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
    
    // Professional experience
    experience: {
        totalYears: {
            type: Number,
            min: [0, 'Experience cannot be negative'],
            default: 0
        },
        teachingYears: {
            type: Number,
            min: [0, 'Teaching experience cannot be negative'],
            default: 0
        },
        industryYears: {
            type: Number,
            min: [0, 'Industry experience cannot be negative'],
            default: 0
        },
        researchYears: {
            type: Number,
            min: [0, 'Research experience cannot be negative'],
            default: 0
        }
    },
    
    // Specialization and expertise
    specialization: [{
        type: String,
        trim: true,
        maxlength: [100, 'Specialization cannot exceed 100 characters']
    }],
    
    researchInterests: [{
        type: String,
        trim: true,
        maxlength: [100, 'Research interest cannot exceed 100 characters']
    }],
    
    // Contact and personal information
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
    
    officeHours: [{
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
    
    // Academic and administrative roles
    currentRoles: [{
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: [100, 'Role title cannot exceed 100 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Role description cannot exceed 500 characters']
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: Date,
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    
    // Publications and research
    publications: [{
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: [300, 'Publication title cannot exceed 300 characters']
        },
        type: {
            type: String,
            enum: ['Journal', 'Conference', 'Book', 'Chapter', 'Patent', 'Other'],
            required: true
        },
        journal: {
            type: String,
            trim: true,
            maxlength: [200, 'Journal name cannot exceed 200 characters']
        },
        year: {
            type: Number,
            min: [1950, 'Year must be after 1950'],
            max: [new Date().getFullYear() + 1, 'Year cannot be more than next year']
        },
        doi: {
            type: String,
            trim: true
        },
        url: {
            type: String,
            trim: true,
            match: [/^https?:\/\/.+/, 'URL must be a valid HTTP/HTTPS URL']
        }
    }],
    
    // Courses taught
    coursesTaught: [{
        courseCode: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },
        courseName: {
            type: String,
            required: true,
            trim: true
        },
        semester: {
            type: String,
            required: true,
            trim: true
        },
        academicYear: {
            type: String,
            required: true,
            match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
        },
        studentCount: {
            type: Number,
            min: [0, 'Student count cannot be negative'],
            default: 0
        }
    }],
    
    // Personal information
    dateOfBirth: {
        type: Date,
        validate: {
            validator: function(date) {
                if (!date) return true;
                const age = (new Date() - date) / (365.25 * 24 * 60 * 60 * 1000);
                return age >= 22 && age <= 70;
            },
            message: 'Age must be between 22 and 70 years'
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
    
    // Professional memberships
    professionalMemberships: [{
        organization: {
            type: String,
            required: true,
            trim: true,
            maxlength: [200, 'Organization name cannot exceed 200 characters']
        },
        membershipType: {
            type: String,
            enum: ['Student', 'Associate', 'Member', 'Senior Member', 'Fellow', 'Life Member'],
            required: true
        },
        membershipId: {
            type: String,
            trim: true
        },
        startDate: Date,
        endDate: Date,
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    
    // Awards and recognitions
    awards: [{
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: [200, 'Award title cannot exceed 200 characters']
        },
        organization: {
            type: String,
            required: true,
            trim: true,
            maxlength: [200, 'Organization name cannot exceed 200 characters']
        },
        year: {
            type: Number,
            min: [1950, 'Year must be after 1950'],
            max: [new Date().getFullYear(), 'Year cannot be in the future']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Award description cannot exceed 500 characters']
        }
    }],
    
    // Employment status
    employmentStatus: {
        type: String,
        enum: {
            values: ['Active', 'On Leave', 'Sabbatical', 'Suspended', 'Retired', 'Terminated', 'Resigned'],
            message: 'Invalid employment status'
        },
        default: 'Active'
    },
    
    // Salary information (optional, for HR purposes)
    salaryGrade: {
        type: String,
        trim: true,
        maxlength: [20, 'Salary grade cannot exceed 20 characters']
    }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt
});

/**
 * Pre-save middleware for faculty-specific validations
 */
facultySchema.pre('save', function(next) {
    // Calculate total experience based on joining date
    if (this.joiningDate) {
        const yearsOfService = (new Date() - this.joiningDate) / (365.25 * 24 * 60 * 60 * 1000);
        if (yearsOfService > 0) {
            this.experience.totalYears = Math.max(this.experience.totalYears, Math.floor(yearsOfService));
        }
    }
    
    // Validate office hours
    for (const officeHour of this.officeHours) {
        const startTime = officeHour.startTime.split(':').map(Number);
        const endTime = officeHour.endTime.split(':').map(Number);
        const startMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];
        
        if (startMinutes >= endMinutes) {
            return next(new Error('Office hours end time must be after start time'));
        }
    }
    
    next();
});

/**
 * Instance method to calculate age
 */
facultySchema.methods.getAge = function() {
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
facultySchema.methods.getYearsOfService = function() {
    if (!this.joiningDate) return 0;
    const today = new Date();
    const joiningDate = new Date(this.joiningDate);
    return Math.floor((today - joiningDate) / (365.25 * 24 * 60 * 60 * 1000));
};

/**
 * Instance method to get active publications count
 */
facultySchema.methods.getPublicationsCount = function() {
    return {
        total: this.publications.length,
        byType: this.publications.reduce((acc, pub) => {
            acc[pub.type] = (acc[pub.type] || 0) + 1;
            return acc;
        }, {}),
        recentYears: this.publications.filter(pub => 
            pub.year && pub.year >= new Date().getFullYear() - 5
        ).length
    };
};

/**
 * Instance method to check if faculty is eligible for promotion
 */
facultySchema.methods.isEligibleForPromotion = function() {
    const yearsOfService = this.getYearsOfService();
    const publicationsCount = this.publications.length;
    
    // Basic eligibility criteria (can be customized based on institution policies)
    switch (this.designation) {
        case 'Assistant Professor':
            return yearsOfService >= 3 && publicationsCount >= 5;
        case 'Associate Professor':
            return yearsOfService >= 6 && publicationsCount >= 10;
        case 'Professor':
            return false; // Already at highest academic rank
        default:
            return yearsOfService >= 2;
    }
};

/**
 * Virtual field to get full office location
 */
facultySchema.virtual('fullOfficeLocation').get(function() {
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
facultySchema.virtual('highestQualification').get(function() {
    if (!this.qualifications || this.qualifications.length === 0) return null;
    
    const degreeHierarchy = ['Ph.D', 'M.Tech', 'M.E', 'M.Sc', 'M.A', 'MBA', 'B.Tech', 'B.E', 'B.Sc', 'B.A', 'Diploma'];
    
    let highest = this.qualifications[0];
    for (const qualification of this.qualifications) {
        if (degreeHierarchy.indexOf(qualification.degree) < degreeHierarchy.indexOf(highest.degree)) {
            highest = qualification;
        }
    }
    
    return highest;
});

/**
 * Virtual field to get current academic year courses
 */
facultySchema.virtual('currentCourses').get(function() {
    const currentAcademicYear = this.getCurrentAcademicYear();
    return this.coursesTaught.filter(course => course.academicYear === currentAcademicYear);
});

/**
 * Instance method to get current academic year
 */
facultySchema.methods.getCurrentAcademicYear = function() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    if (currentMonth >= 7) {
        return `${currentYear}-${currentYear + 1}`;
    } else {
        return `${currentYear - 1}-${currentYear}`;
    }
};

// Create indexes for better query performance
facultySchema.index({ facultyId: 1 });
facultySchema.index({ department: 1, designation: 1 });
facultySchema.index({ employmentStatus: 1 });
facultySchema.index({ joiningDate: -1 });
facultySchema.index({ 'qualifications.degree': 1 });

// Ensure virtual fields are included when converting to JSON
facultySchema.set('toJSON', { virtuals: true });
facultySchema.set('toObject', { virtuals: true });

// Create the Faculty model as a discriminator of User
const Faculty = User.discriminator('Faculty', facultySchema);

module.exports = Faculty;