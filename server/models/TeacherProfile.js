const mongoose = require('mongoose');

const facultyProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    employeeId: {
        type: String,
        required: true,
        unique: true
    },
    designation: {
        type: String,
        enum: ['Professor', 'Assistant Professor', 'Lecturer', 'Guest Faculty'],
        required: true
    },
    department: {
        type: String,
        required: true
    },
    qualification: {
        type: String,
        required: true
    },
    experience: {
        type: Number,
        default: 0
    },
    subjects: [{
        name: String,
        code: String,
        semester: Number,
        course: String
    }],
    assignedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentProfile'
    }],
    joiningDate: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('FacultyProfile', facultyProfileSchema);