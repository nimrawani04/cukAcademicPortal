const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
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
    // Individual assessment components
    test1: {
        type: Number,
        default: 0,
        min: [0, 'Test 1 marks cannot be negative'],
        max: [25, 'Test 1 marks cannot exceed 25']
    },
    test2: {
        type: Number,
        default: 0,
        min: [0, 'Test 2 marks cannot be negative'],
        max: [25, 'Test 2 marks cannot exceed 25']
    },
    assignment: {
        type: Number,
        default: 0,
        min: [0, 'Assignment marks cannot be negative'],
        max: [20, 'Assignment marks cannot exceed 20']
    },
    presentation: {
        type: Number,
        default: 0,
        min: [0, 'Presentation marks cannot be negative'],
        max: [15, 'Presentation marks cannot exceed 15']
    },
    attendanceMarks: {
        type: Number,
        default: 0,
        min: [0, 'Attendance marks cannot be negative'],
        max: [15, 'Attendance marks cannot exceed 15']
    },
    // Calculated fields
    total: {
        type: Number,
        default: 0,
        min: [0, 'Total marks cannot be negative'],
        max: [100, 'Total marks cannot exceed 100']
    },
    grade: {
        type: String,
        enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
        default: 'F'
    },
    // Additional metadata
    enteredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Entered by is required']
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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
    // Upload tracking
    uploadBatch: {
        type: String, // UUID for tracking bulk uploads
        index: true
    },
    uploadSource: {
        type: String,
        enum: ['manual', 'excel', 'api'],
        default: 'manual'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound indexes for efficient queries
marksSchema.index({ studentId: 1, courseId: 1, academicYear: 1, semester: 1 }, { unique: true });
marksSchema.index({ courseId: 1, academicYear: 1, semester: 1 });
marksSchema.index({ enteredBy: 1, createdAt: -1 });

// Virtual for percentage
marksSchema.virtual('percentage').get(function() {
    return this.total > 0 ? ((this.total / 100) * 100).toFixed(2) : 0;
});

// Virtual for pass/fail status
marksSchema.virtual('isPassed').get(function() {
    return this.total >= 40; // Assuming 40% is passing marks
});

// Pre-save middleware to calculate total and grade
marksSchema.pre('save', function(next) {
    // Calculate total marks
    this.total = (this.test1 || 0) + 
                 (this.test2 || 0) + 
                 (this.assignment || 0) + 
                 (this.presentation || 0) + 
                 (this.attendanceMarks || 0);
    
    // Calculate grade based on total marks
    this.grade = this.calculateGrade(this.total);
    
    next();
});

// Instance method to calculate grade
marksSchema.methods.calculateGrade = function(total) {
    if (total >= 90) return 'A+';
    if (total >= 80) return 'A';
    if (total >= 70) return 'B+';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C+';
    if (total >= 40) return 'C';
    if (total >= 30) return 'D';
    return 'F';
};

// Instance method to update marks
marksSchema.methods.updateMarks = function(marksData, modifiedBy) {
    const allowedFields = ['test1', 'test2', 'assignment', 'presentation', 'attendanceMarks', 'remarks'];
    
    allowedFields.forEach(field => {
        if (marksData[field] !== undefined) {
            this[field] = marksData[field];
        }
    });
    
    this.lastModifiedBy = modifiedBy;
    return this.save();
};

// Static method to get marks by student
marksSchema.statics.getMarksByStudent = async function(studentId, options = {}) {
    const {
        academicYear,
        semester,
        courseId,
        populate = true
    } = options;

    let query = { studentId, isActive: true };
    
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;
    if (courseId) query.courseId = courseId;

    let marksQuery = this.find(query).sort({ academicYear: -1, semester: -1, createdAt: -1 });
    
    if (populate) {
        marksQuery = marksQuery
            .populate('studentId', 'firstName lastName rollNumber')
            .populate('courseId', 'title code credits')
            .populate('enteredBy', 'firstName lastName role')
            .populate('lastModifiedBy', 'firstName lastName role');
    }

    return await marksQuery;
};

// Static method to get marks by course
marksSchema.statics.getMarksByCourse = async function(courseId, options = {}) {
    const {
        academicYear,
        semester,
        studentId,
        populate = true
    } = options;

    let query = { courseId, isActive: true };
    
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;
    if (studentId) query.studentId = studentId;

    let marksQuery = this.find(query).sort({ 'studentId.rollNumber': 1, createdAt: -1 });
    
    if (populate) {
        marksQuery = marksQuery
            .populate('studentId', 'firstName lastName rollNumber year')
            .populate('courseId', 'title code credits')
            .populate('enteredBy', 'firstName lastName role');
    }

    return await marksQuery;
};

// Static method for bulk insert with validation
marksSchema.statics.bulkInsertMarks = async function(marksArray, enteredBy, uploadBatch) {
    const session = await mongoose.startSession();
    
    try {
        session.startTransaction();
        
        const results = {
            success: [],
            errors: [],
            duplicates: []
        };

        for (let i = 0; i < marksArray.length; i++) {
            const markData = marksArray[i];
            
            try {
                // Check for existing marks
                const existing = await this.findOne({
                    studentId: markData.studentId,
                    courseId: markData.courseId,
                    academicYear: markData.academicYear,
                    semester: markData.semester
                }).session(session);

                if (existing) {
                    results.duplicates.push({
                        row: i + 1,
                        studentId: markData.studentId,
                        message: 'Marks already exist for this student in this course/semester'
                    });
                    continue;
                }

                // Create new marks record
                const marks = new this({
                    ...markData,
                    enteredBy,
                    uploadBatch,
                    uploadSource: 'excel'
                });

                await marks.save({ session });
                results.success.push({
                    row: i + 1,
                    marksId: marks._id,
                    studentId: markData.studentId
                });

            } catch (error) {
                results.errors.push({
                    row: i + 1,
                    studentId: markData.studentId,
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

// Static method to get class statistics
marksSchema.statics.getClassStatistics = async function(courseId, academicYear, semester) {
    const marks = await this.find({
        courseId,
        academicYear,
        semester,
        isActive: true
    });

    if (marks.length === 0) {
        return {
            totalStudents: 0,
            averageMarks: 0,
            highestMarks: 0,
            lowestMarks: 0,
            passedStudents: 0,
            failedStudents: 0,
            gradeDistribution: {}
        };
    }

    const totals = marks.map(m => m.total);
    const passedCount = marks.filter(m => m.isPassed).length;
    
    // Grade distribution
    const gradeDistribution = marks.reduce((acc, mark) => {
        acc[mark.grade] = (acc[mark.grade] || 0) + 1;
        return acc;
    }, {});

    return {
        totalStudents: marks.length,
        averageMarks: (totals.reduce((sum, total) => sum + total, 0) / marks.length).toFixed(2),
        highestMarks: Math.max(...totals),
        lowestMarks: Math.min(...totals),
        passedStudents: passedCount,
        failedStudents: marks.length - passedCount,
        passPercentage: ((passedCount / marks.length) * 100).toFixed(2),
        gradeDistribution
    };
};

// Static method to validate Excel data
marksSchema.statics.validateExcelData = function(data) {
    const errors = [];
    const validData = [];

    data.forEach((row, index) => {
        const rowErrors = [];
        const rowNumber = index + 1;

        // Required field validation
        if (!row.studentId) rowErrors.push('Student ID is required');
        if (!row.courseId) rowErrors.push('Course ID is required');
        if (!row.subject) rowErrors.push('Subject is required');
        if (!row.academicYear) rowErrors.push('Academic year is required');
        if (row.semester === undefined || row.semester === null) rowErrors.push('Semester is required');

        // Marks validation
        const marksFields = ['test1', 'test2', 'assignment', 'presentation', 'attendanceMarks'];
        marksFields.forEach(field => {
            const value = row[field];
            if (value !== undefined && value !== null && value !== '') {
                const numValue = Number(value);
                if (isNaN(numValue) || numValue < 0) {
                    rowErrors.push(`${field} must be a non-negative number`);
                }
            }
        });

        if (rowErrors.length > 0) {
            errors.push({
                row: rowNumber,
                errors: rowErrors,
                data: row
            });
        } else {
            validData.push({
                ...row,
                test1: Number(row.test1) || 0,
                test2: Number(row.test2) || 0,
                assignment: Number(row.assignment) || 0,
                presentation: Number(row.presentation) || 0,
                attendanceMarks: Number(row.attendanceMarks) || 0
            });
        }
    });

    return { validData, errors };
};

module.exports = mongoose.model('Marks', marksSchema);