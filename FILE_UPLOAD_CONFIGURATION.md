# File Upload Configuration Documentation

## Overview
The Academic Portal supports comprehensive file upload functionality using Multer with organized storage, file type validation, and security features.

## Upload Directory Structure
```
server/uploads/
├── assignments/        # Assignment files (PDF, DOC, images, presentations)
│   ├── 2024/
│   │   ├── 01/        # Month-based organization
│   │   ├── 02/
│   │   └── ...
├── marks/             # Excel files for marks upload
│   ├── 2024/
│   │   ├── 01/
│   │   └── ...
├── notices/           # Notice attachments (PDF, images, documents)
├── profiles/          # Profile images
├── documents/         # General documents
└── temp/             # Temporary files
```

## Supported File Types

### Excel Files (for Marks Upload)
- **Extensions**: `.xlsx`, `.xls`, `.csv`
- **MIME Types**: 
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `application/vnd.ms-excel`
  - `text/csv`
- **Max Size**: 5MB
- **Use Case**: Bulk marks and attendance upload

### PDF Files
- **Extensions**: `.pdf`
- **MIME Types**: `application/pdf`
- **Max Size**: 25MB (assignments), 15MB (notices)
- **Use Case**: Assignment files, notice attachments, documents

### Images
- **Extensions**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp`
- **MIME Types**: 
  - `image/jpeg`, `image/jpg`, `image/png`
  - `image/gif`, `image/bmp`, `image/webp`
- **Max Size**: 2MB (profiles), 15MB (notices), 25MB (assignments)
- **Use Case**: Profile pictures, notice images, assignment diagrams

### Document Files
- **Extensions**: `.doc`, `.docx`, `.txt`, `.rtf`, `.odt`
- **MIME Types**:
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `text/plain`, `text/rtf`
  - `application/vnd.oasis.opendocument.text`
- **Max Size**: 25MB (assignments), 15MB (notices)
- **Use Case**: Assignment submissions, notice attachments

### Presentation Files
- **Extensions**: `.ppt`, `.pptx`, `.odp`
- **MIME Types**:
  - `application/vnd.ms-powerpoint`
  - `application/vnd.openxmlformats-officedocument.presentationml.presentation`
  - `application/vnd.oasis.opendocument.presentation`
- **Max Size**: 25MB
- **Use Case**: Assignment presentations

### Archive Files
- **Extensions**: `.zip`, `.rar`, `.7z`
- **MIME Types**:
  - `application/zip`
  - `application/x-rar-compressed`
  - `application/x-7z-compressed`
- **Max Size**: 20MB
- **Use Case**: Multiple file submissions

## Upload Instances

### 1. Excel Upload (`excelUpload`)
```javascript
const { excelUpload } = require('../config/multer');

// Usage in routes
router.post('/upload', excelUpload.single('excelFile'), controller.method);
```
- **Purpose**: Marks and attendance Excel file upload
- **Allowed Types**: Excel files only
- **Max Size**: 5MB
- **Max Files**: 1
- **Storage**: `server/uploads/marks/YYYY/MM/`

### 2. Assignment Upload (`assignmentUpload`)
```javascript
const { assignmentUpload } = require('../config/multer');

// Single file
router.post('/assignments', assignmentUpload.single('assignmentFile'), controller.method);

// Multiple files
router.post('/assignments', assignmentUpload.array('files', 5), controller.method);
```
- **Purpose**: Assignment file upload
- **Allowed Types**: PDF, documents, images, presentations
- **Max Size**: 25MB per file
- **Max Files**: 5
- **Storage**: `server/uploads/assignments/YYYY/MM/`

### 3. Notice Upload (`noticeUpload`)
```javascript
const { noticeUpload } = require('../config/multer');

// Multiple attachments
router.post('/notices', noticeUpload.array('attachments', 5), controller.method);
```
- **Purpose**: Notice attachments
- **Allowed Types**: PDF, documents, images
- **Max Size**: 15MB per file
- **Max Files**: 5
- **Storage**: `server/uploads/notices/YYYY/MM/`

### 4. Profile Upload (`profileUpload`)
```javascript
const { profileUpload } = require('../config/multer');

// Single profile image
router.post('/profile', profileUpload.single('profileImage'), controller.method);
```
- **Purpose**: User profile images
- **Allowed Types**: Images only
- **Max Size**: 2MB
- **Max Files**: 1
- **Storage**: `server/uploads/profiles/YYYY/MM/`

### 5. Document Upload (`documentUpload`)
```javascript
const { documentUpload } = require('../config/multer');

// General document upload
router.post('/documents', documentUpload.array('documents', 10), controller.method);
```
- **Purpose**: General document upload
- **Allowed Types**: All supported types
- **Max Size**: 20MB per file
- **Max Files**: 10
- **Storage**: `server/uploads/documents/YYYY/MM/`

## File Naming Convention

### Automatic Naming
Files are automatically renamed using the following pattern:
```
{sanitized_original_name}_{timestamp}_{random_number}.{extension}
```

**Example:**
- Original: `Assignment 1 - Math.pdf`
- Renamed: `Assignment_1___Math_1704067200000_123456789.pdf`

### Sanitization Rules
- Replace non-alphanumeric characters with underscores
- Remove multiple consecutive underscores
- Preserve file extension
- Maintain original base name for reference

## Error Handling

### Upload Errors
The system handles various upload errors with appropriate HTTP status codes:

#### File Size Exceeded (400)
```json
{
  "success": false,
  "message": "File too large",
  "error": "File size exceeds the maximum allowed limit"
}
```

#### Too Many Files (400)
```json
{
  "success": false,
  "message": "Too many files",
  "error": "Number of files exceeds the maximum allowed limit"
}
```

#### Invalid File Type (400)
```json
{
  "success": false,
  "message": "Invalid file type",
  "error": "Invalid file type. Allowed types: .pdf, .doc, .docx. Received: .exe (application/x-executable)"
}
```

#### Unexpected Field (400)
```json
{
  "success": false,
  "message": "Unexpected file field",
  "error": "Unexpected file field name"
}
```

## Usage Examples

### 1. Upload Excel File for Marks
```bash
curl -X POST http://localhost:5000/api/marks/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "excelFile=@marks_data.xlsx"
```

### 2. Upload Assignment with PDF
```bash
curl -X POST http://localhost:5000/api/assignments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "assignmentFile=@assignment.pdf" \
  -F "title=Mathematics Assignment 1" \
  -F "description=Solve the given problems" \
  -F "deadline=2024-02-15T23:59:59.000Z" \
  -F "courseId=507f1f77bcf86cd799439012"
```

### 3. Upload Notice with Multiple Attachments
```bash
curl -X POST http://localhost:5000/api/notices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "attachments=@notice_image.jpg" \
  -F "attachments=@notice_document.pdf" \
  -F "title=Important Notice" \
  -F "content=Please read the attached documents"
```

### 4. Upload Profile Image
```bash
curl -X POST http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "profileImage=@profile.jpg"
```

## Utility Functions

### Get File Information
```javascript
const { getFileInfo } = require('../config/multer');

// In controller
const fileInfo = getFileInfo(req.file);
console.log(fileInfo);
// Output:
// {
//   originalName: 'document.pdf',
//   filename: 'document_1704067200000_123456789.pdf',
//   path: 'server/uploads/documents/2024/01/document_1704067200000_123456789.pdf',
//   size: 1024000,
//   mimeType: 'application/pdf',
//   extension: '.pdf',
//   uploadDate: '2024-01-01T10:00:00.000Z'
// }
```

### Delete File
```javascript
const { deleteFile } = require('../config/multer');

// Delete uploaded file
const deleted = deleteFile('server/uploads/documents/2024/01/file.pdf');
console.log(deleted); // true if successful, false otherwise
```

### Create Custom Upload Instance
```javascript
const { createUpload } = require('../config/multer');

// Custom upload configuration
const customUpload = createUpload({
  subfolder: 'custom',
  allowedTypes: ['pdf', 'images'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 3
});

// Use in route
router.post('/custom', customUpload.array('files', 3), controller.method);
```

## Security Features

### File Type Validation
- **Double Validation**: Both file extension and MIME type are checked
- **Whitelist Approach**: Only explicitly allowed file types are accepted
- **MIME Type Verification**: Prevents file type spoofing

### File Size Limits
- **Per-File Limits**: Different limits for different use cases
- **Total Upload Limits**: Prevents excessive resource usage
- **Configurable Limits**: Easy to adjust based on requirements

### File Name Sanitization
- **Special Character Removal**: Prevents path traversal attacks
- **Unique Naming**: Prevents file name conflicts
- **Extension Preservation**: Maintains file type information

### Storage Security
- **Organized Structure**: Date-based folder organization
- **Access Control**: Files served through controlled endpoints
- **Path Validation**: Prevents directory traversal

## Configuration Options

### Environment Variables
You can configure upload settings via environment variables:

```env
# Maximum file sizes (in bytes)
MAX_ASSIGNMENT_SIZE=26214400    # 25MB
MAX_NOTICE_SIZE=15728640        # 15MB
MAX_PROFILE_SIZE=2097152        # 2MB
MAX_EXCEL_SIZE=5242880          # 5MB

# Upload directories
UPLOAD_BASE_DIR=server/uploads
ASSIGNMENT_DIR=assignments
MARKS_DIR=marks
NOTICES_DIR=notices
PROFILES_DIR=profiles
```

### Custom Configuration
```javascript
// In your route file
const { createUpload } = require('../config/multer');

const specialUpload = createUpload({
  subfolder: 'special',
  allowedTypes: ['pdf'],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 1
});
```

## Best Practices

### 1. Use Appropriate Upload Instance
- Use `excelUpload` for Excel files
- Use `assignmentUpload` for assignment files
- Use `noticeUpload` for notice attachments
- Use `profileUpload` for profile images

### 2. Handle Errors Gracefully
```javascript
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  // Process file...
});
```

### 3. Validate File Content
```javascript
// Additional validation after upload
if (req.file.mimetype !== 'application/pdf') {
  deleteFile(req.file.path); // Clean up
  return res.status(400).json({
    success: false,
    message: 'Only PDF files are allowed'
  });
}
```

### 4. Clean Up on Errors
```javascript
try {
  // Process file...
} catch (error) {
  // Clean up uploaded file on error
  if (req.file) {
    deleteFile(req.file.path);
  }
  throw error;
}
```

### 5. Store File Metadata
```javascript
// Store file information in database
const fileData = {
  originalName: req.file.originalname,
  filename: req.file.filename,
  path: req.file.path,
  size: req.file.size,
  mimeType: req.file.mimetype,
  uploadedBy: req.user.userId,
  uploadedAt: new Date()
};
```

## Monitoring and Maintenance

### File System Monitoring
- Monitor disk space usage in upload directories
- Implement file cleanup policies for old files
- Set up alerts for storage thresholds

### Performance Optimization
- Use streaming for large file downloads
- Implement file compression where appropriate
- Consider CDN integration for static files

### Backup and Recovery
- Regular backup of upload directories
- Implement file versioning if needed
- Document recovery procedures