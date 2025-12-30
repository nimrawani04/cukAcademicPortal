// Student model - Defines the structure of student-specific data in MongoDB
const mongoose = require('mongoose');
const User = require('./User');

/**
 * Student Schema - Extends the base User model with student-specific fields
 * This uses Mongoose discriminators to create a specialized student model
 */
const studentSchema = new mongoose.Schema({
    // Student-specific identification
    rollNumber: {
        type: String,
        required: [true, 'Roll number is required'],
        unique: true,
        trim: true,
        uppercase: true,
        match: [/^[A-Z0-9]{6,15}$/, 'Roll number must be 6-15 characters long and contain only letters and numbers']
    },
    
    // Academic information
    course: {
        type: String,
        required: [true, 'Course is required'],
        trim: true,
        enum: {
            values: [
                'Computer Science Engineering',
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
                'English Literature',
                'Business Administration',
                'Economics',
                'Psychology',
                'Other'
            ],
            message: 'Please select a valid course'
        }
    },
    
    year: {
        type: Number,
        required: [true, 'Academic year is required'],
        min: [1, 'Year must be at least 1'],
        max: [6, 'Year cannot exceed 6'],
        validate: {
            validator: Number.isInteger,
            message: 'Year must be a whole number'
        }
    },
    
    // Academic details
    semester: {
        type: Number,
        required: [true, 'Current semester is required'],
        min: [1, 'Semester must be at least 1'],
        max: [12, 'Semester cannot exceed 12'],
        validate: {
            validator: Number.isInteger,
            message: 'Semester must be a whole number'
        }
    },
    
    batch: {
        type: String,
        required: [true, 'Batch year is required'],
        match: [/^\d{4}-\d{4}$/, 'Batch must be in format YYYY-YYYY (e.g., 2020-2024)']
    },
    
    section: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: [5, 'Section cannot exceed 5 characters'],
        default: 'A'
    },
    
    // Academic performance
    cgpa: {
        type: Number,
        min: [0, 'CGPA cannot be negative'],
        max: [10, 'CGPA cannot exceed 10'],
        default: null,
        validate: {
            validator: function(value) {
                return value === null || (value >= 0 && value <= 10);
            },
            message: 'CGPA must be between 0 and 10'
        }
    },
    
    totalCredits: {
        type: Number,
        min: [0, 'Total credits cannot be negative'],
        default: 0
    },
    
    // Contact and personal information
    parentName: {
        type: String,
        trim: true,
        maxlength: [100, 'Parent name cannot exceed 100 characters'],
        match: [/^[a-zA-Z\s]*$/, 'Parent name can only contain letters and spaces']
    },
    
    parentPhone: {
        type: String,
        trim: true,
        match: [/^[+]?[\d\s\-()]{10,15}$/, 'Please enter a valid parent phone number']
    },
    
    address: {
        street: {
            type: String,
            trim: true,
            maxlength: [200, 'Street address cannot exceed 200 characters']
        },
        city: {
            type: String,
            trim: true,
            maxlength: [50, 'City name cannot exceed 50 characters']
        },
        state: {
            type: String,
            trim: true,
            maxlength: [50, 'State name cannot exceed 50 characters']
        },
        zipCode: {
            type: String,
            trim: true,
            match: [/^\d{5,6}$/, 'ZIP code must be 5-6 digits']
        },
        country: {
            type: String,
            trim: true,
            maxlength: [50, 'Country name cannot exceed 50 characters'],
            default: 'India'
        }
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
            enum: ['Parent', 'Guardian', 'Sibling', 'Relative', 'Friend', 'Other'],
            default: 'Parent'
        },
        phone: {
            type: String,
            trim: true,
            match: [/^[+]?[\d\s\-()]{10,15}$/, 'Please enter a valid emergency contact phone number']
        }
    },
    
    // Academic status
    academicStatus: {
        type: String,
        enum: {
            values: ['Active', 'On Leave', 'Suspended', 'Graduated', 'Dropped Out', 'Transferred'],
            message: 'Invalid academic status'
        },
        default: 'Active'
    },
    
    // Enrollment information
    admissionDate: {
        type: Date,
        required: [true, 'Admission date is required'],
        validate: {
            validator: function(date) {
                return date <= new Date();
            },
            message: 'Admission date cannot be in the future'
        }
    },
    
    expectedGraduationDate: {
        type: Date,
        validate: {
            validator: function(date) {
                return !date || date > this.admissionDate;
            },
            message: 'Expected graduation date must be after admission date'
        }
    },
    
    // Additional student information
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        uppercase: true
    },
    
    dateOfBirth: {
        type: Date,
        validate: {
            validator: function(date) {
                if (!date) return true;
                const age = (new Date() - date) / (365.25 * 24 * 60 * 60 * 1000);
                return age >= 16 && age <= 50;
            },
            message: 'Age must be between 16 and 50 years'
        }
    },
    
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
        required: [true, 'Gender is required']
    },
    
    // Academic preferences
    specialization: {
        type: String,
        trim: true,
        maxlength: [100, 'Specialization cannot exceed 100 characters']
    },
    
    // Library and hostel information
    libraryCardNumber: {
        type: String,
        trim: true,
        unique: true,
        sparse: true // Allow null values but ensure uniqueness for non-null values
    },
    
    hostelInfo: {
        isHostelResident: {
            type: Boolean,
            default: false
        },
        hostelName: {
            type: String,
            trim: true
        },
        roomNumber: {
            type: String,
            trim: true
        }
    },
    
    // Scholarship and financial information
    scholarships: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        amount: {
            type: Number,
            min: 0
        },
        academicYear: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['Active', 'Completed', 'Suspended'],
            default: 'Active'
        }
    }],
    
    // Extracurricular activities
    activities: [{
        activityName: {
            type: String,
            required: true,
            trim: true
        },
        role: {
            type: String,
            trim: true
        },
        startDate: Date,
        endDate: Date,
        description: {
            type: String,
            maxlength: [500, 'Activity description cannot exceed 500 characters']
        }
    }]
}, {
    timestamps: true // Automatically manage createdAt and updatedAt
});

/**
 * Pre-save middleware for student-specific validations
 */
studentSchema.pre('save', function(next) {
    // Auto-generate library card number if not provided
    if (!this.libraryCardNumber && this.rollNumber) {
        this.libraryCardNumber = `LIB${this.rollNumber}`;
    }
    
    // Validate semester based on year
    const maxSemesterForYear = this.year * 2;
    if (this.semester > maxSemesterForYear) {
        return next(new Error(`Semester ${this.semester} is not valid for year ${this.year}`));
    }
    
    next();
});

/**
 * Instance method to calculate age
 */
studentSchema.methods.getAge = function() {
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
 * Instance method to get current academic year
 */
studentSchema.methods.getCurrentAcademicYear = function() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    
    // Academic year typically starts in July/August
    if (currentMonth >= 7) {
        return `${currentYear}-${currentYear + 1}`;
    } else {
        return `${currentYear - 1}-${currentYear}`;
    }
};

/**
 * Instance method to check if student is eligible for next semester
 */
studentSchema.methods.isEligibleForNextSemester = function() {
    // Basic eligibility: CGPA should be at least 5.0 and academic status should be Active
    return this.academicStatus === 'Active' && (this.cgpa === null || this.cgpa >= 5.0);
};

/**
 * Virtual field to get full address
 */
studentSchema.virtual('fullAddress').get(function() {
    if (!this.address || !this.address.street) return null;
    
    const addressParts = [
        this.address.street,
        this.address.city,
        this.address.state,
        this.address.zipCode,
        this.address.country
    ].filter(part => part && part.trim());
    
    return addressParts.join(', ');
});

/**
 * Virtual field to get years since admission
 */
studentSchema.virtual('yearsSinceAdmission').get(function() {
    if (!this.admissionDate) return 0;
    const today = new Date();
    const admissionDate = new Date(this.admissionDate);
    return Math.floor((today - admissionDate) / (365.25 * 24 * 60 * 60 * 1000));
});

// Create indexes for better query performance
studentSchema.index({ rollNumber: 1 });
studentSchema.index({ course: 1, year: 1 });
studentSchema.index({ batch: 1 });
studentSchema.index({ academicStatus: 1 });
studentSchema.index({ admissionDate: -1 });

// Ensure virtual fields are included when converting to JSON
studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

// Create the Student model as a discriminator of User
const Student = User.discriminator('Student', studentSchema);

module.exports = Student;