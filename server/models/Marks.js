const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    marks: {
        test1: { type: Number, default: 0 },
        test2: { type: Number, default: 0 },
        presentation: { type: Number, default: 0 },
        assignment: { type: Number, default: 0 },
        attendance: { type: Number, default: 0 }
    },
    total: {
        type: Number,
        default: 0
    },
    grade: {
        type: String,
        default: '-'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Calculate total and grade before saving
marksSchema.pre('save', function(next) {
    const marks = this.marks;
    this.total = (marks.test1 || 0) + (marks.test2 || 0) + (marks.presentation || 0) + (marks.assignment || 0) + (marks.attendance || 0);
    
    // Calculate grade based on total (out of 50)
    const percentage = (this.total / 50) * 100;
    if (percentage >= 90) this.grade = 'A+';
    else if (percentage >= 80) this.grade = 'A';
    else if (percentage >= 70) this.grade = 'B+';
    else if (percentage >= 60) this.grade = 'B';
    else if (percentage >= 50) this.grade = 'C';
    else if (percentage >= 40) this.grade = 'D';
    else this.grade = 'F';
    
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('Marks', marksSchema);