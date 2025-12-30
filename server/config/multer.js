// File upload configuration using Multer
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Ensure upload directories exist
 */
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Created directory: ${dirPath}`);
    }
};

// Create upload directories
const uploadDirs = {
    assignments: 'server/uploads/assignments',
    marks: 'server/uploads/marks',
    notices: 'server/uploads/notices',
    profiles: 'server/uploads/profiles',
    documents: 'server/uploads/documents',
    temp: 'server/uploads/temp'
};

// Ensure all directories exist
Object.values(uploadDirs).forEach(dir => {
    ensureDirectoryExists(dir);
});

/**
 * Configure storage for uploaded files with organized folder structure
 */
const createStorage = (subfolder = 'documents') => {
    return multer.diskStorage({
        // Destination folder based on file type
        destination: function (req, file, cb) {
            let uploadPath = `server/uploads/${subfolder}`;
            
            // Create date-based subfolders for better organization
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            uploadPath = `${uploadPath}/${year}/${month}`;
            
            ensureDirectoryExists(uploadPath);
            cb(null, uploadPath);
        },
        
        // Generate unique filename while preserving original extension
        filename: function (req, file, cb) {
            // Sanitize original filename
            const sanitizedName = file.originalname
                .replace(/[^a-zA-Z0-9.-]/g, '_')
                .replace(/_{2,}/g, '_');
            
            // Create unique filename: timestamp + random + sanitized name
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path.extname(sanitizedName);
            const baseName = path.basename(sanitizedName, extension);
            
            cb(null, `${baseName}_${uniqueSuffix}${extension}`);
        }
    });
};

/**
 * Comprehensive file filter for different file types
 */
const createFileFilter = (allowedTypes = 'all') => {
    return (req, file, cb) => {
        const fileExtension = path.extname(file.originalname).toLowerCase();
        const mimeType = file.mimetype.toLowerCase();
        
        // Define allowed file types by category
        const fileTypes = {
            // Excel files for marks upload
            excel: {
                extensions: ['.xlsx', '.xls', '.csv'],
                mimeTypes: [
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel',
                    'text/csv'
                ]
            },
            
            // PDF files for assignments and documents
            pdf: {
                extensions: ['.pdf'],
                mimeTypes: ['application/pdf']
            },
            
            // Image files for profiles and notices
            images: {
                extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
                mimeTypes: [
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'image/gif',
                    'image/bmp',
                    'image/webp'
                ]
            },
            
            // Document files for assignments and notices
            documents: {
                extensions: ['.doc', '.docx', '.txt', '.rtf', '.odt'],
                mimeTypes: [
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'text/plain',
                    'text/rtf',
                    'application/vnd.oasis.opendocument.text'
                ]
            },
            
            // Archive files
            archives: {
                extensions: ['.zip', '.rar', '.7z'],
                mimeTypes: [
                    'application/zip',
                    'application/x-rar-compressed',
                    'application/x-7z-compressed'
                ]
            },
            
            // Presentation files
            presentations: {
                extensions: ['.ppt', '.pptx', '.odp'],
                mimeTypes: [
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'application/vnd.oasis.opendocument.presentation'
                ]
            }
        };
        
        // Determine which file types to allow
        let allowedExtensions = [];
        let allowedMimeTypes = [];
        
        if (allowedTypes === 'all') {
            // Allow all defined file types
            Object.values(fileTypes).forEach(type => {
                allowedExtensions.push(...type.extensions);
                allowedMimeTypes.push(...type.mimeTypes);
            });
        } else if (Array.isArray(allowedTypes)) {
            // Allow specific categories
            allowedTypes.forEach(category => {
                if (fileTypes[category]) {
                    allowedExtensions.push(...fileTypes[category].extensions);
                    allowedMimeTypes.push(...fileTypes[category].mimeTypes);
                }
            });
        } else if (fileTypes[allowedTypes]) {
            // Allow single category
            allowedExtensions = fileTypes[allowedTypes].extensions;
            allowedMimeTypes = fileTypes[allowedTypes].mimeTypes;
        }
        
        // Check if file is allowed
        const isExtensionAllowed = allowedExtensions.includes(fileExtension);
        const isMimeTypeAllowed = allowedMimeTypes.includes(mimeType);
        
        if (isExtensionAllowed && isMimeTypeAllowed) {
            cb(null, true);
        } else {
            const error = new Error(
                `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}. ` +
                `Received: ${fileExtension} (${mimeType})`
            );
            error.code = 'INVALID_FILE_TYPE';
            cb(error, false);
        }
    };
};

/**
 * Create multer upload instance with specific configuration
 */
const createUpload = (options = {}) => {
    const {
        subfolder = 'documents',
        allowedTypes = 'all',
        maxFileSize = 10 * 1024 * 1024, // 10MB default
        maxFiles = 5
    } = options;
    
    return multer({
        storage: createStorage(subfolder),
        limits: {
            fileSize: maxFileSize,
            files: maxFiles
        },
        fileFilter: createFileFilter(allowedTypes)
    });
};

// Pre-configured upload instances for different use cases

/**
 * Excel file upload for marks and attendance
 */
const excelUpload = createUpload({
    subfolder: 'marks',
    allowedTypes: ['excel'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1
});

/**
 * Assignment file upload (PDF, documents)
 */
const assignmentUpload = createUpload({
    subfolder: 'assignments',
    allowedTypes: ['pdf', 'documents', 'images', 'presentations'],
    maxFileSize: 25 * 1024 * 1024, // 25MB
    maxFiles: 5
});

/**
 * Notice file upload (images, PDF, documents)
 */
const noticeUpload = createUpload({
    subfolder: 'notices',
    allowedTypes: ['pdf', 'documents', 'images'],
    maxFileSize: 15 * 1024 * 1024, // 15MB
    maxFiles: 5
});

/**
 * Profile image upload
 */
const profileUpload = createUpload({
    subfolder: 'profiles',
    allowedTypes: ['images'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
    maxFiles: 1
});

/**
 * General document upload
 */
const documentUpload = createUpload({
    subfolder: 'documents',
    allowedTypes: 'all',
    maxFileSize: 20 * 1024 * 1024, // 20MB
    maxFiles: 10
});

/**
 * Default upload instance (backward compatibility)
 */
const upload = createUpload({
    subfolder: 'documents',
    allowedTypes: 'all',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
});

/**
 * Utility function to get file info
 */
const getFileInfo = (file) => {
    return {
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype,
        extension: path.extname(file.originalname).toLowerCase(),
        uploadDate: new Date()
    };
};

/**
 * Utility function to delete uploaded file
 */
const deleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Deleted file: ${filePath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};

/**
 * Middleware to handle upload errors
 */
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    message: 'File too large',
                    error: 'File size exceeds the maximum allowed limit'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    message: 'Too many files',
                    error: 'Number of files exceeds the maximum allowed limit'
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    message: 'Unexpected file field',
                    error: 'Unexpected file field name'
                });
            default:
                return res.status(400).json({
                    success: false,
                    message: 'File upload error',
                    error: error.message
                });
        }
    } else if (error.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
            success: false,
            message: 'Invalid file type',
            error: error.message
        });
    }
    
    next(error);
};

module.exports = {
    // Default upload instance
    upload,
    
    // Specialized upload instances
    excelUpload,
    assignmentUpload,
    noticeUpload,
    profileUpload,
    documentUpload,
    
    // Utility functions
    createUpload,
    getFileInfo,
    deleteFile,
    handleUploadError,
    
    // Directory paths
    uploadDirs
};