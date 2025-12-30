// Assignment model - Defines the structure of assignment data in MongoDB
const mongoose = require('mongoose');

/**
 * Assignment Schema - Blueprint for assignment documents in the database
 */
const assignmentSchema = new mongoose.Schema({
    // Basic assignment information
    title: {
        type: String,
        required: [true, 'Assignment title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters long'],
        maxlength: [200, 'Assignment title cannot exceed 200 characters']
    },
    
    description: {
        type: String,
        required: [true, 'Assignment description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters long'],
        maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
        maxlength: [100, 'Subject name cannot exceed 100 characters']
    },
    
    deadline: {
        type: Date,
        required: [true, 'Deadline is required'],
        validate: {
            validator: function(value) {
                return value > new Date();
            },
            message: 'Deadline must be in the future'
        }
    },
    
    // Course this assignment belongs to
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course is required'],
        index: true
    },
    
    // Academic information
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
    
    // Assignment file information
    fileUrl: {
        type: String,
        trim: true
    },
    
    fileName: {
        type: String,
        trim: true
    },
    
    fileSize: {
        type: Number,
        min: [0, 'File size cannot be negative']
    },
    
    mimeType: {
        type: String,
        trim: true
    },
    
    // Who uploaded this assignment
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Uploaded by is required'],
        index: true
    },
    
    // Assignment details
    totalPoints: {
        type: Number,
        default: 100,
        min: [1, 'Total points must be at least 1'],
        max: [1000, 'Total points cannot exceed 1000']
    },
    
    // Assignment type
    type: {
        type: String,
        enum: ['homework', 'quiz', 'exam', 'project', 'lab', 'assignment', 'presentation'],
        default: 'assignment'
    },
    
    // Priority level
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    
    // Instructions and additional information
    instructions: {
        type: String,
        maxlength: [5000, 'Instructions cannot exceed 5000 characters'],
        trim: true
    },
    
    // Additional attachments
    attachments: [{
        filename: {
            type: String,
            required: true
        },
        filePath: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number,
            default: 0
        },
        mimeType: {
            type: String,
            default: 'application/octet-stream'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Submission settings
    allowLateSubmission: {
        type: Boolean,
        default: true
    },
    
    latePenalty: {
        type: Number,
        default: 10,
        min: [0, 'Late penalty cannot be negative'],
        max: [100, 'Late penalty cannot exceed 100%']
    },
    
    maxSubmissions: {
        type: Number,
        default: 1,
        min: [1, 'Maximum submissions must be at least 1']
    },
    
    // Student submissions
    submissions: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true
        },
        submissionDate: {
            type: Date,
            default: Date.now
        },
        files: [{
            filename: String,
            filePath: String,
            fileSize: Number,
            mimeType: String
        }],
        comments: {
            type: String,
            maxlength: [1000, 'Comments cannot exceed 1000 characters']
        },
        grade: {
            type: Number,
            min: 0
        },
        feedback: {
            type: String,
            maxlength: [2000, 'Feedback cannot exceed 2000 characters']
        },
        isLate: {
            type: Boolean,
            default: false
        },
        gradedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        gradedAt: Date,
        submissionNumber: {
            type: Number,
            default: 1
        }
    }],
    
    // Assignment status
    isPublished: {
        type: Boolean,
        default: true
    },
    
    isActive: {
        type: Boolean,
        default: true
    },
    
    // View tracking
    viewCount: {
        type: Number,
        default: 0
    },
    
    downloadCount: {
        type: Number,
        default: 0
    },
    
    // Metadata
    tags: [{
        type: String,
        trim: true,
        maxlength: [50, 'Tag cannot exceed 50 characters']
    }],
    
    remarks: {
        type: String,
        maxlength: [500, 'Remarks cannot exceed 500 characters'],
        trim: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for efficient queries
assignmentSchema.index({ courseId: 1, deadline: 1 });
assignmentSchema.index({ uploadedBy: 1, createdAt: -1 });
assignmentSchema.index({ academicYear: 1, semester: 1 });
assignmentSchema.index({ title: 'text', description: 'text', subject: 'text' });

// Virtual fields
assignmentSchema.virtual('isOverdue').get(function() {
    return new Date() > this.deadline;
});

assignmentSchema.virtual('submissionCount').get(function() {
    return this.submissions.length;
});

assignmentSchema.virtual('daysUntilDeadline').get(function() {
    const now = new Date();
    const diffTime = this.deadline - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

assignmentSchema.virtual('isUrgent').get(function() {
    return this.priority === 'urgent' || this.daysUntilDeadline <= 1;
});

assignmentSchema.virtual('formattedDeadline').get(function() {
    return this.deadline.toISOString().split('T')[0]; // YYYY-MM-DD format
});

// Instance methods
assignmentSchema.methods.incrementViewCount = function() {
    this.viewCount += 1;
    return this.save();
};

assignmentSchema.methods.incrementDownloadCount = function() {
    this.downloadCount += 1;
    return this.save();
};

assignmentSchema.methods.addSubmission = function(studentId, submissionData) {
    // Check if student already has submissions
    const existingSubmissions = this.submissions.filter(
        sub => sub.student.toString() === studentId.toString()
    );
    
    if (existingSubmissions.length >= this.maxSubmissions) {
        throw new Error(`Maximum ${this.maxSubmissions} submission(s) allowed`);
    }
    
    const isLate = new Date() > this.deadline;
    
    const submission = {
        student: studentId,
        submissionDate: new Date(),
        files: submissionData.files || [],
        comments: submissionData.comments || '',
        isLate,
        submissionNumber: existingSubmissions.length + 1
    };
    
    this.submissions.push(submission);
    return this.save();
};

assignmentSchema.methods.gradeSubmission = function(submissionId, grade, feedback, gradedBy) {
    const submission = this.submissions.id(submissionId);
    if (!submission) {
        throw new Error('Submission not found');
    }
    
    if (grade < 0 || grade > this.totalPoints) {
        throw new Error(`Grade must be between 0 and ${this.totalPoints}`);
    }
    
    submission.grade = grade;
    submission.feedback = feedback;
    submission.gradedBy = gradedBy;
    submission.gradedAt = new Date();
    
    return this.save();
};

// Static methods
assignmentSchema.statics.getAssignmentsByCourse = async function(courseId, options = {}) {
    const {
        academicYear,
        semester,
        type,
        priority,
        isPublished = true,
        populate = true
    } = options;

    let query = { courseId, isActive: true };
    
    if (isPublished !== null) query.isPublished = isPublished;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;
    if (type) query.type = type;
    if (priority) query.priority = priority;

    let assignmentQuery = this.find(query).sort({ deadline: 1, createdAt: -1 });
    
    if (populate) {
        assignmentQuery = assignmentQuery
            .populate('courseId', 'title code credits')
            .populate('uploadedBy', 'firstName lastName role')
            .populate('submissions.student', 'firstName lastName rollNumber')
            .populate('submissions.gradedBy', 'firstName lastName role');
    }

    return await assignmentQuery;
};

assignmentSchema.statics.getAssignmentsForStudent = async function(studentId, options = {}) {
    const {
        courseId,
        academicYear,
        semester,
        type,
        includeSubmitted = true,
        populate = true
    } = options;

    // First get all assignments the student has access to
    let query = { isActive: true, isPublished: true };
    
    if (courseId) query.courseId = courseId;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;
    if (type) query.type = type;

    let assignmentQuery = this.find(query).sort({ deadline: 1, createdAt: -1 });
    
    if (populate) {
        assignmentQuery = assignmentQuery
            .populate('courseId', 'title code credits')
            .populate('uploadedBy', 'firstName lastName role');
    }

    const assignments = await assignmentQuery;
    
    // Add submission status for each assignment
    return assignments.map(assignment => {
        const studentSubmissions = assignment.submissions.filter(
            sub => sub.student.toString() === studentId.toString()
        );
        
        const assignmentObj = assignment.toObject();
        assignmentObj.hasSubmitted = studentSubmissions.length > 0;
        assignmentObj.submissionCount = studentSubmissions.length;
        assignmentObj.latestSubmission = studentSubmissions.length > 0 ? 
            studentSubmissions[studentSubmissions.length - 1] : null;
        
        // Remove all submissions from response for privacy
        delete assignmentObj.submissions;
        
        return assignmentObj;
    });
};

assignmentSchema.statics.getUpcomingDeadlines = async function(courseId, days = 7) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return await this.find({
        courseId,
        deadline: { $gte: now, $lte: futureDate },
        isActive: true,
        isPublished: true
    })
    .populate('courseId', 'title code')
    .populate('uploadedBy', 'firstName lastName')
    .sort({ deadline: 1 });
};

assignmentSchema.statics.getAssignmentStatistics = async function(assignmentId) {
    const assignment = await this.findById(assignmentId);
    if (!assignment) {
        throw new Error('Assignment not found');
    }
    
    const submissions = assignment.submissions;
    const totalSubmissions = submissions.length;
    const gradedSubmissions = submissions.filter(sub => sub.grade !== undefined);
    const lateSubmissions = submissions.filter(sub => sub.isLate);
    
    let averageGrade = 0;
    let highestGrade = 0;
    let lowestGrade = assignment.totalPoints;
    
    if (gradedSubmissions.length > 0) {
        const grades = gradedSubmissions.map(sub => sub.grade);
        averageGrade = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
        highestGrade = Math.max(...grades);
        lowestGrade = Math.min(...grades);
    }
    
    return {
        totalSubmissions,
        gradedSubmissions: gradedSubmissions.length,
        pendingGrading: totalSubmissions - gradedSubmissions.length,
        lateSubmissions: lateSubmissions.length,
        onTimeSubmissions: totalSubmissions - lateSubmissions.length,
        averageGrade: parseFloat(averageGrade.toFixed(2)),
        highestGrade,
        lowestGrade,
        averagePercentage: assignment.totalPoints > 0 ? 
            ((averageGrade / assignment.totalPoints) * 100).toFixed(2) : 0
    };
};

// Pre-save middleware
assignmentSchema.pre('save', function(next) {
    // Update late submission status for existing submissions
    if (this.isModified('deadline')) {
        this.submissions.forEach(submission => {
            submission.isLate = submission.submissionDate > this.deadline;
        });
    }
    next();
});

// Create and export the Assignment model
module.exports = mongoose.model('Assignment', assignmentSchema);