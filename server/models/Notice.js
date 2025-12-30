const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Notice title is required'],
        trim: true,
        minlength: [5, 'Title must be at least 5 characters long'],
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
        type: String,
        required: [true, 'Notice content is required'],
        trim: true,
        minlength: [10, 'Content must be at least 10 characters long'],
        maxlength: [5000, 'Content cannot exceed 5000 characters']
    },
    priority: {
        type: String,
        enum: ['normal', 'important', 'urgent'],
        default: 'normal',
        required: true
    },
    targetAudience: {
        type: String,
        enum: ['all', 'students', 'faculty', 'admin', 'specific_course', 'specific_year'],
        default: 'all',
        required: true
    },
    expiryDate: {
        type: Date,
        default: null,
        validate: {
            validator: function(value) {
                return !value || value > new Date();
            },
            message: 'Expiry date must be in the future'
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required']
    },
    // Additional fields for enhanced functionality
    targetCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    targetYears: [{
        type: Number,
        min: 1,
        max: 6
    }],
    type: {
        type: String,
        enum: ['general', 'academic', 'exam', 'event', 'holiday', 'announcement'],
        default: 'general'
    },
    publishDate: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    attachments: [{
        filename: String,
        filePath: String,
        fileSize: Number,
        mimeType: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    viewCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
noticeSchema.index({ createdBy: 1, createdAt: -1 });
noticeSchema.index({ targetAudience: 1, priority: -1, publishDate: -1 });
noticeSchema.index({ expiryDate: 1, isActive: 1 });
noticeSchema.index({ title: 'text', content: 'text' });

// Virtual fields
noticeSchema.virtual('isUrgent').get(function() {
    return this.priority === 'urgent';
});

noticeSchema.virtual('daysUntilExpiry').get(function() {
    if (!this.expiryDate) return null;
    const now = new Date();
    const diffTime = this.expiryDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

noticeSchema.virtual('readCount').get(function() {
    return this.readBy.length;
});

// Instance methods
noticeSchema.methods.isVisible = function() {
    const now = new Date();
    return this.isActive && 
           this.publishDate <= now && 
           (!this.expiryDate || this.expiryDate >= now);
};

noticeSchema.methods.markAsRead = function(userId) {
    const alreadyRead = this.readBy.some(read => 
        read.user.toString() === userId.toString()
    );
    
    if (!alreadyRead) {
        this.readBy.push({
            user: userId,
            readAt: new Date()
        });
        return this.save();
    }
    return Promise.resolve(this);
};

noticeSchema.methods.incrementViewCount = function() {
    this.viewCount += 1;
    return this.save();
};

// Static methods
noticeSchema.statics.getNoticesForUser = async function(userId, userRole, options = {}) {
    const {
        page = 1,
        limit = 10,
        priority,
        type,
        search
    } = options;

    // Build base query
    let query = {
        isActive: true,
        publishDate: { $lte: new Date() },
        $or: [
            { expiryDate: null },
            { expiryDate: { $gte: new Date() } }
        ]
    };

    // Add role-based filtering
    if (userRole === 'admin') {
        // Admin can see all notices
    } else if (userRole === 'student') {
        // Students see notices targeted to all, students, or their specific courses/years
        const Student = require('./Student');
        const student = await Student.findById(userId).populate('enrolledCourses');
        
        const courseIds = student ? student.enrolledCourses.map(c => c._id) : [];
        const studentYear = student ? student.year : null;

        query.$and = [{
            $or: [
                { targetAudience: 'all' },
                { targetAudience: 'students' },
                { 
                    targetAudience: 'specific_course',
                    targetCourses: { $in: courseIds }
                },
                {
                    targetAudience: 'specific_year',
                    targetYears: studentYear
                }
            ]
        }];
    } else if (userRole === 'faculty') {
        // Faculty see notices targeted to all, faculty, or their courses
        const Course = require('./Course');
        const courses = await Course.find({ instructor: userId });
        const courseIds = courses.map(c => c._id);

        query.$and = [{
            $or: [
                { targetAudience: 'all' },
                { targetAudience: 'faculty' },
                { 
                    targetAudience: 'specific_course',
                    targetCourses: { $in: courseIds }
                }
            ]
        }];
    }

    // Add additional filters
    if (priority) query.priority = priority;
    if (type) query.type = type;
    if (search) {
        query.$text = { $search: search };
    }

    // Execute query with pagination
    const notices = await this.find(query)
        .populate('createdBy', 'firstName lastName role')
        .populate('targetCourses', 'title code')
        .sort({ priority: -1, publishDate: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await this.countDocuments(query);

    return {
        notices,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalNotices: total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
        }
    };
};

noticeSchema.statics.getUrgentNotices = function(userRole, userId) {
    return this.getNoticesForUser(userId, userRole, { 
        priority: 'urgent',
        limit: 20 
    });
};

// Pre-save middleware
noticeSchema.pre('save', function(next) {
    // Ensure publishDate is not in the future for immediate notices
    if (this.isNew && !this.publishDate) {
        this.publishDate = new Date();
    }
    next();
});

module.exports = mongoose.model('Notice', noticeSchema);