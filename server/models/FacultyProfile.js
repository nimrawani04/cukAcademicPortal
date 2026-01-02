const mongoose = require('mongoose');

const facultyProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    facultyId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    designation: {
        type: String,
        required: true,
        enum: ['Professor', 'Assistant Professor', 'Lecturer', 'Guest Faculty']
    },
    department: {
        type: String,
        required: true,
        enum: [
            'Computer Science and Engineering',
            'Electronics and Communication Engineering', 
            'Mechanical Engineering',
            'Civil Engineering',
            'Mathematics',
            'Physics',
            'Chemistry',
            'Management Studies',
            'English',
            'Other'
        ]
    },
    joiningDate: {
        type: Date,
        required: true
    },
    qualifications: [{
        degree: String,
        field: String,
        institution: String,
        year: Number
    }],
    specialization: [String],
    officeLocation: {
        building: String,
        floor: String,
        roomNumber: String
    },
    subjects: [{
        subjectName: String,
        subjectCode: String,
        semester: Number,
        course: String
    }],
    assignedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentProfile'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
facultyProfileSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Generate faculty ID if not provided
facultyProfileSchema.pre('save', async function(next) {
    if (!this.facultyId) {
        const count = await this.constructor.countDocuments();
        this.facultyId = `FAC${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

module.exports = mongoose.model('FacultyProfile', facultyProfileSchema);