const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
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
    description: {
        type: String,
        maxlength: 500,
        trim: true
    },
    subject: {
        type: String,
        required: true
    },
    subjectCode: {
        type: String,
        required: true
    },
    resourceType: {
        type: String,
        enum: ['lecture_notes', 'assignment', 'reference_material', 'syllabus', 'previous_papers', 'lab_manual', 'presentation', 'video', 'other'],
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
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
    downloadCount: {
        type: Number,
        default: 0
    },
    downloadedBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        downloadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    tags: [String],
    semester: {
        type: Number,
        required: true
    },
    academicYear: {
        type: String,
        required: true
    },
    expiryDate: {
        type: Date
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
resourceSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Index for efficient queries
resourceSchema.index({ facultyId: 1, uploadDate: -1 });
resourceSchema.index({ subject: 1, semester: 1, academicYear: 1 });
resourceSchema.index({ resourceType: 1, isActive: 1 });
resourceSchema.index({ 'targetGroup.courses': 1, 'targetGroup.semesters': 1 });

// Method to check if resource is expired
resourceSchema.methods.isExpired = function() {
    return this.expiryDate && new Date() > this.expiryDate;
};

// Method to increment download count
resourceSchema.methods.incrementDownloadCount = async function(userId) {
    // Check if user has already downloaded (optional tracking)
    const alreadyDownloaded = this.downloadedBy.some(download => 
        download.userId.toString() === userId.toString()
    );
    
    if (!alreadyDownloaded) {
        this.downloadedBy.push({ userId });
    }
    
    this.downloadCount += 1;
    await this.save();
};

// Static method to get resources for a student
resourceSchema.statics.getResourcesForStudent = async function(studentProfile) {
    const currentDate = new Date();
    
    return await this.find({
        isActive: true,
        $or: [
            { expiryDate: { $exists: false } },
            { expiryDate: null },
            { expiryDate: { $gte: currentDate } }
        ],
        $or: [
            { isPublic: true },
            { 'targetGroup.allStudents': true },
            { 'targetGroup.courses': studentProfile.course },
            { 'targetGroup.semesters': studentProfile.semester },
            { 'targetGroup.departments': studentProfile.department },
            { 'targetGroup.specificStudents': studentProfile._id }
        ]
    })
    .populate('facultyId', 'userId designation department')
    .populate('facultyId.userId', 'name email')
    .sort({ uploadDate: -1 });
};

// Static method to get resources by faculty
resourceSchema.statics.getResourcesByFaculty = async function(facultyId, filters = {}) {
    const query = { facultyId, isActive: true };
    
    if (filters.subject) query.subject = filters.subject;
    if (filters.semester) query.semester = filters.semester;
    if (filters.resourceType) query.resourceType = filters.resourceType;
    if (filters.academicYear) query.academicYear = filters.academicYear;
    
    return await this.find(query)
        .sort({ uploadDate: -1 });
};

module.exports = mongoose.model('Resource', resourceSchema);