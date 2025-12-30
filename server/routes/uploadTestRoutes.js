const express = require('express');
const authMiddleware = require('../middleware/auth');
const { 
    excelUpload, 
    assignmentUpload, 
    noticeUpload, 
    profileUpload, 
    documentUpload,
    getFileInfo,
    deleteFile
} = require('../config/multer');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Test Excel file upload
 * POST /api/upload-test/excel
 */
router.post('/excel', excelUpload.single('excelFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No Excel file uploaded'
            });
        }

        const fileInfo = getFileInfo(req.file);
        
        res.json({
            success: true,
            message: 'Excel file uploaded successfully',
            data: {
                fileInfo,
                uploadType: 'excel',
                allowedTypes: ['xlsx', 'xls', 'csv'],
                maxSize: '5MB'
            }
        });

    } catch (error) {
        console.error('Excel upload test error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during Excel upload test'
        });
    }
});

/**
 * Test assignment file upload
 * POST /api/upload-test/assignment
 */
router.post('/assignment', assignmentUpload.single('assignmentFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No assignment file uploaded'
            });
        }

        const fileInfo = getFileInfo(req.file);
        
        res.json({
            success: true,
            message: 'Assignment file uploaded successfully',
            data: {
                fileInfo,
                uploadType: 'assignment',
                allowedTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png', 'ppt', 'pptx'],
                maxSize: '25MB'
            }
        });

    } catch (error) {
        console.error('Assignment upload test error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during assignment upload test'
        });
    }
});

/**
 * Test notice attachments upload
 * POST /api/upload-test/notice
 */
router.post('/notice', noticeUpload.array('attachments', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No notice attachments uploaded'
            });
        }

        const filesInfo = req.files.map(file => getFileInfo(file));
        
        res.json({
            success: true,
            message: `${req.files.length} notice attachment(s) uploaded successfully`,
            data: {
                filesInfo,
                uploadType: 'notice',
                allowedTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png', 'gif'],
                maxSize: '15MB per file',
                maxFiles: 5
            }
        });

    } catch (error) {
        console.error('Notice upload test error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during notice upload test'
        });
    }
});

/**
 * Test profile image upload
 * POST /api/upload-test/profile
 */
router.post('/profile', profileUpload.single('profileImage'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No profile image uploaded'
            });
        }

        const fileInfo = getFileInfo(req.file);
        
        res.json({
            success: true,
            message: 'Profile image uploaded successfully',
            data: {
                fileInfo,
                uploadType: 'profile',
                allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
                maxSize: '2MB'
            }
        });

    } catch (error) {
        console.error('Profile upload test error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during profile upload test'
        });
    }
});

/**
 * Test general document upload
 * POST /api/upload-test/document
 */
router.post('/document', documentUpload.array('documents', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No documents uploaded'
            });
        }

        const filesInfo = req.files.map(file => getFileInfo(file));
        
        res.json({
            success: true,
            message: `${req.files.length} document(s) uploaded successfully`,
            data: {
                filesInfo,
                uploadType: 'document',
                allowedTypes: 'all supported types',
                maxSize: '20MB per file',
                maxFiles: 10
            }
        });

    } catch (error) {
        console.error('Document upload test error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during document upload test'
        });
    }
});

/**
 * Test file deletion
 * DELETE /api/upload-test/file
 */
router.delete('/file', (req, res) => {
    try {
        const { filePath } = req.body;
        
        if (!filePath) {
            return res.status(400).json({
                success: false,
                message: 'File path is required'
            });
        }

        const deleted = deleteFile(filePath);
        
        res.json({
            success: true,
            message: deleted ? 'File deleted successfully' : 'File not found or already deleted',
            data: {
                filePath,
                deleted
            }
        });

    } catch (error) {
        console.error('File deletion test error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during file deletion test'
        });
    }
});

/**
 * Get upload configuration info
 * GET /api/upload-test/config
 */
router.get('/config', (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Upload configuration retrieved successfully',
            data: {
                uploadTypes: {
                    excel: {
                        allowedTypes: ['xlsx', 'xls', 'csv'],
                        maxSize: '5MB',
                        maxFiles: 1,
                        directory: 'server/uploads/marks'
                    },
                    assignment: {
                        allowedTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png', 'ppt', 'pptx'],
                        maxSize: '25MB',
                        maxFiles: 5,
                        directory: 'server/uploads/assignments'
                    },
                    notice: {
                        allowedTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png', 'gif'],
                        maxSize: '15MB',
                        maxFiles: 5,
                        directory: 'server/uploads/notices'
                    },
                    profile: {
                        allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
                        maxSize: '2MB',
                        maxFiles: 1,
                        directory: 'server/uploads/profiles'
                    },
                    document: {
                        allowedTypes: 'all supported types',
                        maxSize: '20MB',
                        maxFiles: 10,
                        directory: 'server/uploads/documents'
                    }
                },
                directoryStructure: {
                    base: 'server/uploads',
                    subfolders: ['assignments', 'marks', 'notices', 'profiles', 'documents', 'temp'],
                    organization: 'YYYY/MM (year/month based)'
                },
                security: {
                    fileTypeValidation: 'Extension + MIME type',
                    fileNameSanitization: 'Special characters replaced',
                    uniqueNaming: 'Timestamp + random number',
                    accessControl: 'Authentication required'
                }
            }
        });

    } catch (error) {
        console.error('Get config error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while retrieving configuration'
        });
    }
});

module.exports = router;