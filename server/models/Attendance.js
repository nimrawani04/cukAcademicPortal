const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student ID is required'],
        index: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course ID is required'],
        index: true
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
        maxlength: [100, 'Subject name cannot exceed 100 characters']
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        index: true,
        validate: {
            validator: function(value) {
                // Date should not be in the future
                return value <= new Date();
            },
            message: 'Attendance date cannot be in the future'
        }
    },
    status: {
        type: String,
        enum: {
            values: ['present', 'absent', 'late', 'excused'],
            message: 'Status must be present, absent, late, or excused'
        },
        required: [true, 'Attendance status is required'],
        default: 'absent'
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Marked by is required']
    },
    // Additional metadata
    academicYear: {
        type: String,
        required: [true, 'Academic year is required'],
        match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY (e.g., 2024-2025)']
    },
    semester: {
        type: Number,
        required: [true, 'Semester is required'],
        min: [1, 'Semester must be at least 1'],
        max: [8, 'Semester cannot exceed 8']
    },
    classType: {
        type: String,
        enum: ['lecture', 'lab', 'tutorial', 'seminar', 'practical'],
        default: 'lecture'
    },
    duration: {
        type: Number, // Duration in minutes
        default: 60,
        min: [15, 'Class duration must be at least 15 minutes'],
        max: [300, 'Class duration cannot exceed 300 minutes']
    },
    remarks: {
        type: String,
        maxlength: [500, 'Remarks cannot exceed 500 characters'],
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Bulk operation tracking
    batchId: {
        type: String, // UUID for tracking bulk attendance marking
        index: true
    },
    markingSource: {
        type: String,
        enum: ['manual', 'bulk', 'api', 'import'],
        default: 'manual'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound indexes for efficient queries
attendanceSchema.index({ studentId: 1, courseId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ courseId: 1, date: 1, status: 1 });
attendanceSchema.index({ studentId: 1, academicYear: 1, semester: 1 });
attendanceSchema.index({ markedBy: 1, createdAt: -1 });

// Virtual for formatted date
attendanceSchema.virtual('formattedDate').get(function() {
    return this.date.toISOString().split('T')[0]; // YYYY-MM-DD format
});

// Virtual for attendance points (for calculation purposes)
attendanceSchema.virtual('attendancePoints').get(function() {
    switch (this.status) {
        case 'present': return 1;
        case 'late': return 0.5;
        case 'excused': return 1;
        case 'absent': return 0;
        default: return 0;
    }
});

// Instance methods
attendanceSchema.methods.updateStatus = function(newStatus, markedBy, remarks) {
    this.status = newStatus;
    this.markedBy = markedBy;
    if (remarks) this.remarks = remarks;
    return this.save();
};

// Static method to mark attendance for multiple students
attendanceSchema.statics.markBulkAttendance = async function(attendanceData, markedBy, batchId) {
    const session = await mongoose.startSession();
    
    try {
        session.startTransaction();
        
        const results = {
            success: [],
            errors: [],
            duplicates: []
        };

        for (let i = 0; i < attendanceData.length; i++) {
            const data = attendanceData[i];
            
            try {
                // Check for existing attendance record
                const existing = await this.findOne({
                    studentId: data.studentId,
                    courseId: data.courseId,
                    date: data.date
                }).session(session);

                if (existing) {
                    // Update existing record
                    existing.status = data.status;
                    existing.markedBy = markedBy;
                    existing.batchId = batchId;
                    existing.markingSource = 'bulk';
                    if (data.remarks) existing.remarks = data.remarks;
                    
                    await existing.save({ session });
                    results.duplicates.push({
                        row: i + 1,
                        studentId: data.studentId,
                        action: 'updated',
                        attendanceId: existing._id
                    });
                } else {
                    // Create new record
                    const attendance = new this({
                        ...data,
                        markedBy,
                        batchId,
                        markingSource: 'bulk'
                    });

                    await attendance.save({ session });
                    results.success.push({
                        row: i + 1,
                        studentId: data.studentId,
                        attendanceId: attendance._id
                    });
                }

            } catch (error) {
                results.errors.push({
                    row: i + 1,
                    studentId: data.studentId,
                    error: error.message
                });
            }
        }

        await session.commitTransaction();
        return results;

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

// Static method to get attendance by student
attendanceSchema.statics.getAttendanceByStudent = async function(studentId, options = {}) {
    const {
        courseId,
        academicYear,
        semester,
        startDate,
        endDate,
        status,
        populate = true
    } = options;

    let query = { studentId, isActive: true };
    
    if (courseId) query.courseId = courseId;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;
    if (status) query.status = status;
    
    // Date range filter
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    let attendanceQuery = this.find(query).sort({ date: -1 });
    
    if (populate) {
        attendanceQuery = attendanceQuery
            .populate('studentId', 'firstName lastName rollNumber')
            .populate('courseId', 'title code credits')
            .populate('markedBy', 'firstName lastName role');
    }

    return await attendanceQuery;
};

// Static method to get attendance by course
attendanceSchema.statics.getAttendanceByCourse = async function(courseId, options = {}) {
    const {
        date,
        academicYear,
        semester,
        status,
        populate = true
    } = options;

    let query = { courseId, isActive: true };
    
    if (date) query.date = new Date(date);
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;
    if (status) query.status = status;

    let attendanceQuery = this.find(query).sort({ date: -1, 'studentId.rollNumber': 1 });
    
    if (populate) {
        attendanceQuery = attendanceQuery
            .populate('studentId', 'firstName lastName rollNumber year')
            .populate('courseId', 'title code credits')
            .populate('markedBy', 'firstName lastName role');
    }

    return await attendanceQuery;
};

// Static method to calculate attendance percentage
attendanceSchema.statics.calculateAttendancePercentage = async function(studentId, courseId, options = {}) {
    const {
        academicYear,
        semester,
        startDate,
        endDate
    } = options;

    let query = { studentId, courseId, isActive: true };
    
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;
    
    // Date range filter
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendanceRecords = await this.find(query);
    
    if (attendanceRecords.length === 0) {
        return {
            totalClasses: 0,
            attendedClasses: 0,
            percentage: 0,
            status: 'No records found'
        };
    }

    const totalClasses = attendanceRecords.length;
    const attendedClasses = attendanceRecords.filter(record => 
        record.status === 'present' || record.status === 'excused'
    ).length;
    const lateClasses = attendanceRecords.filter(record => 
        record.status === 'late'
    ).length;
    
    // Calculate percentage (late attendance counts as 0.5)
    const effectiveAttendance = attendedClasses + (lateClasses * 0.5);
    const percentage = ((effectiveAttendance / totalClasses) * 100).toFixed(2);

    // Determine status based on percentage
    let status = 'Good';
    if (percentage < 75) status = 'Poor';
    else if (percentage < 85) status = 'Average';
    else if (percentage >= 95) status = 'Excellent';

    return {
        totalClasses,
        attendedClasses,
        lateClasses,
        absentClasses: totalClasses - attendedClasses - lateClasses,
        effectiveAttendance: parseFloat(effectiveAttendance.toFixed(1)),
        percentage: parseFloat(percentage),
        status,
        breakdown: {
            present: attendanceRecords.filter(r => r.status === 'present').length,
            absent: attendanceRecords.filter(r => r.status === 'absent').length,
            late: attendanceRecords.filter(r => r.status === 'late').length,
            excused: attendanceRecords.filter(r => r.status === 'excused').length
        }
    };
};

// Static method to get class attendance summary
attendanceSchema.statics.getClassAttendanceSummary = async function(courseId, date, options = {}) {
    const {
        academicYear,
        semester
    } = options;

    let query = { courseId, date: new Date(date), isActive: true };
    
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;

    const attendanceRecords = await this.find(query)
        .populate('studentId', 'firstName lastName rollNumber year');

    const summary = {
        date: date,
        totalStudents: attendanceRecords.length,
        present: attendanceRecords.filter(r => r.status === 'present').length,
        absent: attendanceRecords.filter(r => r.status === 'absent').length,
        late: attendanceRecords.filter(r => r.status === 'late').length,
        excused: attendanceRecords.filter(r => r.status === 'excused').length,
        attendancePercentage: 0,
        records: attendanceRecords
    };

    if (summary.totalStudents > 0) {
        const effectivePresent = summary.present + summary.excused + (summary.late * 0.5);
        summary.attendancePercentage = ((effectivePresent / summary.totalStudents) * 100).toFixed(2);
    }

    return summary;
};

// Static method to get attendance statistics for a course
attendanceSchema.statics.getCourseAttendanceStatistics = async function(courseId, options = {}) {
    const {
        academicYear,
        semester,
        startDate,
        endDate
    } = options;

    let query = { courseId, isActive: true };
    
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;
    
    // Date range filter
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendanceRecords = await this.find(query);
    
    if (attendanceRecords.length === 0) {
        return {
            totalClasses: 0,
            totalStudentAttendances: 0,
            overallAttendancePercentage: 0,
            statusBreakdown: {},
            dailyAttendance: []
        };
    }

    // Group by date to get daily statistics
    const dailyStats = {};
    attendanceRecords.forEach(record => {
        const dateKey = record.formattedDate;
        if (!dailyStats[dateKey]) {
            dailyStats[dateKey] = {
                date: dateKey,
                present: 0,
                absent: 0,
                late: 0,
                excused: 0,
                total: 0
            };
        }
        dailyStats[dateKey][record.status]++;
        dailyStats[dateKey].total++;
    });

    // Calculate overall statistics
    const totalRecords = attendanceRecords.length;
    const statusBreakdown = {
        present: attendanceRecords.filter(r => r.status === 'present').length,
        absent: attendanceRecords.filter(r => r.status === 'absent').length,
        late: attendanceRecords.filter(r => r.status === 'late').length,
        excused: attendanceRecords.filter(r => r.status === 'excused').length
    };

    const effectivePresent = statusBreakdown.present + statusBreakdown.excused + (statusBreakdown.late * 0.5);
    const overallPercentage = ((effectivePresent / totalRecords) * 100).toFixed(2);

    return {
        totalClasses: Object.keys(dailyStats).length,
        totalStudentAttendances: totalRecords,
        overallAttendancePercentage: parseFloat(overallPercentage),
        statusBreakdown,
        dailyAttendance: Object.values(dailyStats).sort((a, b) => new Date(b.date) - new Date(a.date))
    };
};

// Pre-save middleware
attendanceSchema.pre('save', function(next) {
    // Ensure date is set to start of day for consistency
    if (this.date) {
        const date = new Date(this.date);
        date.setHours(0, 0, 0, 0);
        this.date = date;
    }
    next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);