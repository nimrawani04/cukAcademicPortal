const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    totalClasses: {
        type: Number,
        required: true,
        default: 0
    },
    attendedClasses: {
        type: Number,
        required: true,
        default: 0
    },
    percentage: {
        type: Number,
        default: function() {
            return this.totalClasses > 0 ? (this.attendedClasses / this.totalClasses) * 100 : 0;
        }
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Calculate percentage before saving
attendanceSchema.pre('save', function(next) {
    if (this.totalClasses > 0) {
        this.percentage = (this.attendedClasses / this.totalClasses) * 100;
    } else {
        this.percentage = 0;
    }
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);