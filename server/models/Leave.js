const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    leaveType: {
        type: String,
        enum: ['sick', 'personal', 'emergency', 'family', 'medical', 'academic', 'casual', 'maternity', 'paternity'],
        required: true
    },
    reason: {
        type: String,
        required: true,
        maxlength: 500,
        trim: true
    },
    fromDate: {
        type: Date,
        required: true
    },
    toDate: {
        type: Date,
        required: true
    },
    totalDays: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        default: 'pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewComments: {
        type: String,
        maxlength: 300,
        trim: true
    },
    reviewDate: {
        type: Date
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    attachments: [{
        filename: String,
        originalName: String,
        fileUrl: String,
        fileSize: Number,
        mimeType: String,
        uploadDate: { type: Date, default: Date.now }
    }],
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String
    },
    isHalfDay: {
        type: Boolean,
        default: false
    },
    halfDayPeriod: {
        type: String,
        enum: ['morning', 'afternoon'],
        required: function() { return this.isHalfDay; }
    },
    appliedDate: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Calculate total days before saving
leaveSchema.pre('save', function(next) {
    if (this.fromDate && this.toDate) {
        const timeDiff = this.toDate.getTime() - this.fromDate.getTime();
        let days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        
        // If it's a half day, count as 0.5
        if (this.isHalfDay) {
            days = 0.5;
        }
        
        this.totalDays = days;
    }
    
    this.updatedAt = new Date();
    next();
});

// Validation: fromDate should not be greater than toDate
leaveSchema.pre('save', function(next) {
    if (this.fromDate > this.toDate) {
        next(new Error('From date cannot be greater than to date'));
    } else {
        next();
    }
});

// Index for efficient queries
leaveSchema.index({ userId: 1, appliedDate: -1 });
leaveSchema.index({ status: 1, appliedDate: -1 });
leaveSchema.index({ reviewedBy: 1, reviewDate: -1 });
leaveSchema.index({ fromDate: 1, toDate: 1 });

// Method to check if leave is in the past
leaveSchema.methods.isPastLeave = function() {
    return new Date() > this.toDate;
};

// Method to check if leave is current
leaveSchema.methods.isCurrentLeave = function() {
    const now = new Date();
    return now >= this.fromDate && now <= this.toDate;
};

// Static method to get leave statistics for a user
leaveSchema.statics.getLeaveStats = async function(userId, academicYear) {
    const startDate = new Date(`${academicYear.split('-')[0]}-07-01`);
    const endDate = new Date(`${academicYear.split('-')[1]}-06-30`);
    
    const stats = await this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                fromDate: { $gte: startDate, $lte: endDate },
                status: 'approved'
            }
        },
        {
            $group: {
                _id: '$leaveType',
                totalDays: { $sum: '$totalDays' },
                count: { $sum: 1 }
            }
        }
    ]);
    
    const totalApprovedDays = await this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                fromDate: { $gte: startDate, $lte: endDate },
                status: 'approved'
            }
        },
        {
            $group: {
                _id: null,
                totalDays: { $sum: '$totalDays' }
            }
        }
    ]);
    
    return {
        byType: stats,
        totalApprovedDays: totalApprovedDays[0]?.totalDays || 0
    };
};

// Static method to get pending leaves for review
leaveSchema.statics.getPendingLeaves = async function(filters = {}) {
    const query = { status: 'pending' };
    
    if (filters.leaveType) query.leaveType = filters.leaveType;
    if (filters.priority) query.priority = filters.priority;
    if (filters.fromDate) query.fromDate = { $gte: new Date(filters.fromDate) };
    
    return await this.find(query)
        .populate('userId', 'name email role')
        .sort({ priority: -1, appliedDate: 1 });
};

module.exports = mongoose.model('Leave', leaveSchema);