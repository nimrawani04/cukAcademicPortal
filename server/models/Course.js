// Course model - Defines the structure of course data in MongoDB
const mongoose = require('mongoose');

/**
 * Course Schema - Blueprint for course documents in the database
 * This defines what fields a course can have and their validation rules
 */
const courseSchema = new mongoose.Schema({
    // Basic course information
    title: {
        type: String,
        required: [true, 'Course title is required'],
        trim: true,
        maxlength: [100, 'Course title cannot exceed 100 characters']
    },
    
    code: {
        type: String,
        required: [true, 'Course code is required'],
        unique: true, // Each course must have a unique code
        uppercase: true,
        match: [/^[A-Z]{2,4}\d{3,4}$/, 'Course code must be in format like CS101 or MATH1001']
    },
    
    description: {
        type: String,
        required: [true, 'Course description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    
    // Course details
    credits: {
        type: Number,
        required: [true, 'Course credits are required'],
        min: [1, 'Credits must be at least 1'],
        max: [6, 'Credits cannot exceed 6']
    },
    
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History']
    },
    
    // Teacher assigned to this course
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to User model
        required: [true, 'Instructor is required']
    },
    
    // Students enrolled in this course
    enrolledStudents: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        enrollmentDate: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['active', 'dropped', 'completed'],
            default: 'active'
        }
    }],
    
    // Course schedule
    schedule: {
        days: [{
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        }],
        startTime: {
            type: String,
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
        },
        endTime: {
            type: String,
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
        },
        room: {
            type: String,
            maxlength: [20, 'Room number cannot exceed 20 characters']
        }
    },
    
    // Course dates
    startDate: {
        type: Date,
        required: [true, 'Course start date is required']
    },
    
    endDate: {
        type: Date,
        required: [true, 'Course end date is required']
    },
    
    // Course materials and resources
    syllabus: {
        type: String, // File path to syllabus document
        default: null
    },
    
    materials: [{
        title: String,
        description: String,
        filePath: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Course status
    isActive: {
        type: Boolean,
        default: true
    },
    
    maxEnrollment: {
        type: Number,
        default: 30,
        min: [1, 'Maximum enrollment must be at least 1']
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
});

/**
 * Pre-save middleware to update the updatedAt field
 */
courseSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

/**
 * Virtual field to get current enrollment count
 */
courseSchema.virtual('currentEnrollment').get(function() {
    return this.enrolledStudents.filter(enrollment => enrollment.status === 'active').length;
});

/**
 * Virtual field to check if course is full
 */
courseSchema.virtual('isFull').get(function() {
    return this.currentEnrollment >= this.maxEnrollment;
});

// Ensure virtual fields are included when converting to JSON
courseSchema.set('toJSON', { virtuals: true });

// Create and export the Course model
module.exports = mongoose.model('Course', courseSchema);