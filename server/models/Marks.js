const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
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
    subjectCode: {
        type: String,
        required: true
    },
    examType: {
        type: String,
        enum: ['midterm', 'final', 'assignment', 'quiz', 'practical', 'internal', 'test1', 'test2', 'presentation'],
        required: true
    },
    totalMarks: {
        type: Number,
        required: true,
        min: 0
    },
    maxMarks: {
        type: Number,
        required: true,
        min: 1
    },
    percentage: {
        type: Number,
        default: function() {
            return (this.totalMarks / this.maxMarks) * 100;
        }
    },
    grade: {
        type: String,
        default: function() {
            const percentage = (this.totalMarks / this.maxMarks) * 100;
            if (percentage >= 90) return 'A+';
            if (percentage >= 80) return 'A';
            if (percentage >= 70) return 'B+';
            if (percentage >= 60) return 'B';
            if (percentage >= 50) return 'C';
            if (percentage >= 40) return 'D';
            return 'F';
        }
    },
    gradePoints: {
        type: Number,
        default: function() {
            const percentage = (this.totalMarks / this.maxMarks) * 100;
            if (percentage >= 90) return 10;
            if (percentage >= 80) return 9;
            if (percentage >= 70) return 8;
            if (percentage >= 60) return 7;
            if (percentage >= 50) return 6;
            if (percentage >= 40) return 5;
            return 0;
        }
    },
    credits: {
        type: Number,
        default: 3,
        min: 1,
        max: 6
    },
    semester: {
        type: Number,
        required: true
    },
    academicYear: {
        type: String,
        required: true
    },
    examDate: {
        type: Date
    },
    remarks: {
        type: String,
        maxlength: 200
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dateRecorded: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Calculate percentage, grade, and grade points before saving
marksSchema.pre('save', function(next) {
    this.percentage = (this.totalMarks / this.maxMarks) * 100;
    
    const percentage = this.percentage;
    if (percentage >= 90) {
        this.grade = 'A+';
        this.gradePoints = 10;
    } else if (percentage >= 80) {
        this.grade = 'A';
        this.gradePoints = 9;
    } else if (percentage >= 70) {
        this.grade = 'B+';
        this.gradePoints = 8;
    } else if (percentage >= 60) {
        this.grade = 'B';
        this.gradePoints = 7;
    } else if (percentage >= 50) {
        this.grade = 'C';
        this.gradePoints = 6;
    } else if (percentage >= 40) {
        this.grade = 'D';
        this.gradePoints = 5;
    } else {
        this.grade = 'F';
        this.gradePoints = 0;
    }
    
    this.updatedAt = new Date();
    next();
});

// Compound indexes for efficient queries
marksSchema.index({ studentId: 1, semester: 1, academicYear: 1 });
marksSchema.index({ facultyId: 1, subject: 1, academicYear: 1 });
marksSchema.index({ studentId: 1, facultyId: 1, subject: 1 });

// Static method to calculate semester GPA
marksSchema.statics.calculateSemesterGPA = async function(studentId, semester, academicYear) {
    const marks = await this.find({
        studentId,
        semester,
        academicYear,
        isPublished: true
    });
    
    if (marks.length === 0) return 0;
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    marks.forEach(mark => {
        totalPoints += mark.gradePoints * mark.credits;
        totalCredits += mark.credits;
    });
    
    return totalCredits > 0 ? totalPoints / totalCredits : 0;
};

// Static method to get student marks summary
marksSchema.statics.getStudentMarksSummary = async function(studentId, academicYear) {
    const pipeline = [
        {
            $match: {
                studentId: new mongoose.Types.ObjectId(studentId),
                academicYear: academicYear,
                isPublished: true
            }
        },
        {
            $group: {
                _id: {
                    subject: '$subject',
                    subjectCode: '$subjectCode',
                    semester: '$semester'
                },
                marks: {
                    $push: {
                        examType: '$examType',
                        totalMarks: '$totalMarks',
                        maxMarks: '$maxMarks',
                        percentage: '$percentage',
                        grade: '$grade',
                        gradePoints: '$gradePoints',
                        credits: '$credits'
                    }
                },
                totalCredits: { $first: '$credits' },
                averageGradePoints: { $avg: '$gradePoints' }
            }
        },
        {
            $sort: { '_id.semester': 1, '_id.subject': 1 }
        }
    ];
    
    return await this.aggregate(pipeline);
};

module.exports = mongoose.model('Marks', marksSchema);