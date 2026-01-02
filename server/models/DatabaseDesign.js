/**
 * EXACT DATABASE DESIGN - NO SHORTCUTS
 * Following the specified requirements exactly
 */

const mongoose = require('mongoose');

// User Collection - Exact specification
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'faculty', 'student']
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'approved'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// FacultyProfile Collection - Exact specification
const FacultyProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    designation: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    subjects: [{
        type: String,
        required: true
    }],
    assignedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentProfile'
    }]
}, {
    timestamps: true
});

// StudentProfile Collection - Exact specification
const StudentProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    course: {
        type: String,
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    selectedCourses: [{
        subjectName: {
            type: String,
            required: true
        },
        subjectCode: {
            type: String,
            required: true
        },
        credits: {
            type: Number,
            required: true
        },
        facultyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FacultyProfile'
        }
    }],
    cgpa: {
        type: Number,
        default: 0.0,
        min: 0,
        max: 10
    }
}, {
    timestamps: true
});

// Attendance Collection - Exact specification
const AttendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentProfile',
        required: true
    },
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FacultyProfile',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    totalClasses: {
        type: Number,
        required: true,
        default: 1
    },
    attendedClasses: {
        type: Number,
        required: true,
        default: 0
    }
}, {
    timestamps: true
});

// Marks Collection - Exact specification
const MarksSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentProfile',
        required: true
    },
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FacultyProfile',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    marks: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

// Leave Collection - Exact specification
const LeaveSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Notice Collection - Exact specification
const NoticeSchema = new mongoose.Schema({
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FacultyProfile',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    targetGroup: {
        allStudents: {
            type: Boolean,
            default: false
        },
        courses: [{
            type: String
        }],
        semesters: [{
            type: Number
        }],
        departments: [{
            type: String
        }]
    }
}, {
    timestamps: true
});

// Resource Collection - Exact specification
const ResourceSchema = new mongoose.Schema({
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FacultyProfile',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Create models
const User = mongoose.model('User', UserSchema);
const FacultyProfile = mongoose.model('FacultyProfile', FacultyProfileSchema);
const StudentProfile = mongoose.model('StudentProfile', StudentProfileSchema);
const Attendance = mongoose.model('Attendance', AttendanceSchema);
const Marks = mongoose.model('Marks', MarksSchema);
const Leave = mongoose.model('Leave', LeaveSchema);
const Notice = mongoose.model('Notice', NoticeSchema);
const Resource = mongoose.model('Resource', ResourceSchema);

module.exports = {
    User,
    FacultyProfile,
    StudentProfile,
    Attendance,
    Marks,
    Leave,
    Notice,
    Resource
};