const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    rollNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    course: {
        type: String,
        required: true,
        enum: [
            'B.Tech Computer Science',
            'B.Tech Civil Engineering',
            'B.Tech Mechanical Engineering',
            'B.Tech Electronics',
            'M.Tech Computer Science',
            'MBA',
            'BBA',
            'B.Sc Mathematics',
            'B.Sc Physics',
            'B.Sc Chemistry',
            'M.Sc Mathematics',
            'M.Sc Physics',
            'M.Sc Chemistry'
        ]
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
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
            'English'
        ]
    },
    enrollmentYear: {
        type: Number,
        required: true
    },
    selectedCourses: [{
        subjectName: String,
        subjectCode: String,
        facultyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FacultyProfile'
        },
        semester: Number,
        credits: Number
    }],
    cgpa: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    totalCredits: {
        type: Number,
        default: 0
    },
    currentSemesterCredits: {
        type: Number,
        default: 0
    },
    personalInfo: {
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other']
        },
        address: {
            street: String,
            city: String,
            state: String,
            pincode: String
        },
        guardianName: String,
        guardianPhone: String,
        emergencyContact: String
    },
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
studentProfileSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Generate roll number if not provided
studentProfileSchema.pre('save', async function(next) {
    if (!this.rollNumber) {
        const year = this.enrollmentYear || new Date().getFullYear();
        const count = await this.constructor.countDocuments({ enrollmentYear: year });
        this.rollNumber = `${year}CUK${String(count + 1).padStart(3, '0')}`;
    }
    next();
});

// Calculate CGPA from marks
studentProfileSchema.methods.calculateCGPA = async function() {
    const Marks = mongoose.model('Marks');
    const marks = await Marks.find({ studentId: this._id });
    
    if (marks.length === 0) {
        this.cgpa = 0;
        return 0;
    }
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    marks.forEach(mark => {
        const percentage = (mark.totalMarks / mark.maxMarks) * 100;
        let gradePoint = 0;
        
        if (percentage >= 90) gradePoint = 10;
        else if (percentage >= 80) gradePoint = 9;
        else if (percentage >= 70) gradePoint = 8;
        else if (percentage >= 60) gradePoint = 7;
        else if (percentage >= 50) gradePoint = 6;
        else if (percentage >= 40) gradePoint = 5;
        else gradePoint = 0;
        
        const credits = mark.credits || 3; // Default 3 credits
        totalPoints += gradePoint * credits;
        totalCredits += credits;
    });
    
    this.cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    this.totalCredits = totalCredits;
    await this.save();
    return this.cgpa;
};

module.exports = mongoose.model('StudentProfile', studentProfileSchema);