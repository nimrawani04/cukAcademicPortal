const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'excused'],
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    academicYear: {
        type: String,
        required: true
    },
    classType: {
        type: String,
        enum: ['lecture', 'lab', 'tutorial', 'seminar'],
        default: 'lecture'
    },
    duration: {
        type: Number, // in minutes
        default: 60
    },
    remarks: {
        type: String,
        maxlength: 200
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
attendanceSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Compound index for efficient queries
attendanceSchema.index({ studentId: 1, facultyId: 1, subject: 1, academicYear: 1 });
attendanceSchema.index({ facultyId: 1, date: -1 });
attendanceSchema.index({ studentId: 1, semester: 1, academicYear: 1 });

// Static method to calculate attendance percentage
attendanceSchema.statics.calculateAttendancePercentage = async function(studentId, facultyId, subject, academicYear) {
    const totalClasses = await this.countDocuments({
        studentId,
        facultyId,
        subject,
        academicYear
    });
    
    const attendedClasses = await this.countDocuments({
        studentId,
        facultyId,
        subject,
        academicYear,
        status: { $in: ['present', 'late'] }
    });
    
    return totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
};

// Static method to get attendance summary for a student
attendanceSchema.statics.getStudentAttendanceSummary = async function(studentId, academicYear) {
    const pipeline = [
        {
            $match: {
                studentId: new mongoose.Types.ObjectId(studentId),
                academicYear: academicYear
            }
        },
        {
            $group: {
                _id: {
                    subject: '$subject',
                    subjectCode: '$subjectCode',
                    facultyId: '$facultyId'
                },
                totalClasses: { $sum: 1 },
                attendedClasses: {
                    $sum: {
                        $cond: [
                            { $in: ['$status', ['present', 'late']] },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            $addFields: {
                percentage: {
                    $multiply: [
                        { $divide: ['$attendedClasses', '$totalClasses'] },
                        100
                    ]
                }
            }
        },
        {
            $lookup: {
                from: 'facultyprofiles',
                localField: '_id.facultyId',
                foreignField: '_id',
                as: 'faculty'
            }
        }
    ];
    
    return await this.aggregate(pipeline);
};

module.exports = mongoose.model('Attendance', attendanceSchema);