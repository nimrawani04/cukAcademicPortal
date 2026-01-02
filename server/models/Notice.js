const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FacultyProfile',
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 200,
        trim: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 2000,
        trim: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    category: {
        type: String,
        enum: ['general', 'academic', 'exam', 'event', 'holiday', 'assignment', 'announcement'],
        required: true
    },
    targetGroup: {
        courses: [String],
        semesters: [Number],
        departments: [String],
        allStudents: { type: Boolean, default: false },
        specificStudents: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudentProfile'
        }]
    },
    attachments: [{
        filename: String,
        originalName: String,
        fileUrl: String,
        fileSize: Number,
        mimeType: String,
        uploadDate: { type: Date, default: Date.now }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    isDraft: {
        type: Boolean,
        default: false
    },
    expiryDate: {
        type: Date
    },
    publishDate: {
        type: Date,
        default: Date.now
    },
    viewCount: {
        type: Number,
        default: 0
    },
    viewedBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        viewedAt: {
            type: Date,
            default: Date.now
        }
    }],
    isImportant: {
        type: Boolean,
        default: false
    },
    acknowledgmentRequired: {
        type: Boolean,
        default: false
    },
    acknowledgedBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        acknowledgedAt: {
            type: Date,
            default: Date.now
        }
    }],
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
noticeSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Index for efficient queries
noticeSchema.index({ facultyId: 1, publishDate: -1 });
noticeSchema.index({ category: 1, isActive: 1 });
noticeSchema.index({ expiryDate: 1, isActive: 1 });
noticeSchema.index({ 'targetGroup.courses': 1, 'targetGroup.semesters': 1 });

// Method to check if notice is expired
noticeSchema.methods.isExpired = function() {
    return this.expiryDate && new Date() > this.expiryDate;
};

// Method to increment view count
noticeSchema.methods.incrementViewCount = async function(userId) {
    // Check if user has already viewed
    const alreadyViewed = this.viewedBy.some(view => 
        view.userId.toString() === userId.toString()
    );
    
    if (!alreadyViewed) {
        this.viewedBy.push({ userId });
        this.viewCount += 1;
        await this.save();
    }
};

// Static method to get notices for a student
noticeSchema.statics.getNoticesForStudent = async function(studentProfile) {
    const currentDate = new Date();
    
    return await this.find({
        isActive: true,
        isDraft: false,
        publishDate: { $lte: currentDate },
        $or: [
            { expiryDate: { $exists: false } },
            { expiryDate: null },
            { expiryDate: { $gte: currentDate } }
        ],
        $or: [
            { 'targetGroup.allStudents': true },
            { 'targetGroup.courses': studentProfile.course },
            { 'targetGroup.semesters': studentProfile.semester },
            { 'targetGroup.departments': studentProfile.department },
            { 'targetGroup.specificStudents': studentProfile._id }
        ]
    })
    .populate('facultyId', 'userId designation department')
    .populate('facultyId.userId', 'name email')
    .sort({ priority: -1, publishDate: -1 });
};

module.exports = mongoose.model('Notice', noticeSchema);