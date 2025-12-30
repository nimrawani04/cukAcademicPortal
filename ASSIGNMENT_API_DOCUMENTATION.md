# Assignment Management API Documentation

## Overview
The Assignment Management API provides comprehensive endpoints for managing assignments, file uploads, downloads, and submissions with role-based access control. Faculty can upload assignments and students can view/download them.

## Base URL
```
/api/assignments
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Assignment Model Structure

### Fields
- **title**: Assignment title (required, 3-200 chars)
- **description**: Assignment description (required, 10-5000 chars)
- **subject**: Subject name (required, 2-100 chars)
- **deadline**: Assignment deadline (required, must be future date)
- **courseId**: Reference to Course (required)
- **academicYear**: Format YYYY-YYYY (required, e.g., "2024-2025")
- **semester**: Integer 1-8 (required)
- **fileUrl**: Path to uploaded assignment file (optional)
- **fileName**: Original filename (optional)
- **fileSize**: File size in bytes (optional)
- **mimeType**: File MIME type (optional)
- **uploadedBy**: Reference to User who uploaded (required)
- **totalPoints**: Maximum points (default: 100, 1-1000)
- **type**: Assignment type (homework, quiz, exam, project, lab, assignment, presentation)
- **priority**: Priority level (low, medium, high, urgent)
- **instructions**: Additional instructions (max 5000 chars)
- **allowLateSubmission**: Allow late submissions (default: true)
- **latePenalty**: Late penalty percentage (0-100, default: 10)
- **maxSubmissions**: Maximum submissions per student (default: 1)
- **isPublished**: Whether assignment is published (default: true)
- **tags**: Array of tags for categorization
- **remarks**: Additional remarks (max 500 chars)

### Virtual Fields
- **isOverdue**: Boolean indicating if deadline has passed
- **submissionCount**: Number of submissions received
- **daysUntilDeadline**: Days remaining until deadline
- **isUrgent**: Boolean indicating urgent priority or near deadline
- **formattedDeadline**: Deadline in YYYY-MM-DD format

## Endpoints

### 1. Create/Upload Assignment
**POST** `/api/assignments`

Create a new assignment with optional file upload.

**Headers:**
- `Authorization: Bearer <token>` (Required - Faculty/Admin only)
- `Content-Type: multipart/form-data` (for file uploads)

**Body Parameters:**
```json
{
  "title": "Mathematics Assignment 1",
  "description": "Solve the given mathematical problems and submit your solutions.",
  "subject": "Mathematics",
  "deadline": "2024-02-15T23:59:59.000Z",
  "courseId": "507f1f77bcf86cd799439012",
  "academicYear": "2024-2025",
  "semester": 1,
  "totalPoints": 100,
  "type": "assignment",
  "priority": "medium",
  "instructions": "Please show all your work and provide detailed explanations.",
  "allowLateSubmission": true,
  "latePenalty": 10,
  "maxSubmissions": 1,
  "tags": "mathematics,algebra,homework",
  "remarks": "This is the first assignment of the semester"
}
```

**File Upload:**
- Field name: `assignmentFile`
- Supported formats: PDF, DOC, DOCX, TXT, images, etc.
- Max file size: Configured in multer settings

**Response:**
```json
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "assignment": {
      "id": "assignment_id",
      "title": "Mathematics Assignment 1",
      "description": "Solve the given mathematical problems...",
      "subject": "Mathematics",
      "deadline": "2024-02-15T23:59:59.000Z",
      "courseId": {
        "id": "course_id",
        "title": "Advanced Mathematics",
        "code": "MATH301",
        "credits": 4
      },
      "academicYear": "2024-2025",
      "semester": 1,
      "fileUrl": "/uploads/assignments/assignment_file.pdf",
      "fileName": "assignment_1.pdf",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "uploadedBy": {
        "firstName": "Jane",
        "lastName": "Smith",
        "role": "faculty"
      },
      "totalPoints": 100,
      "type": "assignment",
      "priority": "medium",
      "instructions": "Please show all your work...",
      "allowLateSubmission": true,
      "latePenalty": 10,
      "maxSubmissions": 1,
      "tags": ["mathematics", "algebra", "homework"],
      "isPublished": true,
      "isOverdue": false,
      "daysUntilDeadline": 15,
      "isUrgent": false,
      "formattedDeadline": "2024-02-15",
      "viewCount": 0,
      "downloadCount": 0,
      "createdAt": "2024-01-31T10:00:00.000Z",
      "updatedAt": "2024-01-31T10:00:00.000Z"
    }
  }
}
```

### 2. Get Course Assignments
**GET** `/api/assignments/course/:courseId`

Retrieve all assignments for a specific course.

**Headers:**
- `Authorization: Bearer <token>` (Required)

**Parameters:**
- `courseId`: Course ID (MongoDB ObjectId)

**Query Parameters:**
- `academicYear`: Filter by academic year (optional)
- `semester`: Filter by semester (optional)
- `type`: Filter by assignment type (optional)
- `priority`: Filter by priority (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (1-50, default: 20)

**Access Control:**
- Faculty can view all assignments for courses they teach
- Students can view published assignments for courses they're enrolled in
- Admin can view all assignments

**Response:**
```json
{
  "success": true,
  "data": {
    "course": {
      "id": "course_id",
      "title": "Advanced Mathematics",
      "code": "MATH301",
      "credits": 4
    },
    "assignments": [
      {
        "id": "assignment_id",
        "title": "Mathematics Assignment 1",
        "description": "Solve the given mathematical problems...",
        "subject": "Mathematics",
        "deadline": "2024-02-15T23:59:59.000Z",
        "academicYear": "2024-2025",
        "semester": 1,
        "fileUrl": "/uploads/assignments/assignment_file.pdf",
        "fileName": "assignment_1.pdf",
        "uploadedBy": {
          "firstName": "Jane",
          "lastName": "Smith",
          "role": "faculty"
        },
        "totalPoints": 100,
        "type": "assignment",
        "priority": "medium",
        "isOverdue": false,
        "daysUntilDeadline": 15,
        "isUrgent": false,
        "hasSubmitted": false,
        "submissionCount": 0,
        "createdAt": "2024-01-31T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalAssignments": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 3. Get My Assignments (Student Endpoint)
**GET** `/api/assignments/my-assignments`

Get assignments for the currently logged-in student.

**Headers:**
- `Authorization: Bearer <token>` (Required - Students only)

**Query Parameters:**
- `courseId`: Filter by course (optional)
- `academicYear`: Filter by academic year (optional)
- `semester`: Filter by semester (optional)
- `type`: Filter by assignment type (optional)
- `status`: Filter by status - 'pending', 'submitted', 'overdue' (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (1-50, default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "id": "assignment_id",
        "title": "Mathematics Assignment 1",
        "description": "Solve the given mathematical problems...",
        "subject": "Mathematics",
        "deadline": "2024-02-15T23:59:59.000Z",
        "courseId": {
          "title": "Advanced Mathematics",
          "code": "MATH301"
        },
        "totalPoints": 100,
        "type": "assignment",
        "priority": "medium",
        "isOverdue": false,
        "daysUntilDeadline": 15,
        "hasSubmitted": false,
        "submissionCount": 0,
        "latestSubmission": null
      }
    ],
    "summary": {
      "total": 10,
      "submitted": 6,
      "pending": 3,
      "overdue": 1
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalAssignments": 10,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### 4. Get Assignment by ID
**GET** `/api/assignments/:id`

Retrieve a specific assignment by its ID.

**Headers:**
- `Authorization: Bearer <token>` (Required)

**Parameters:**
- `id`: Assignment ID (MongoDB ObjectId)

**Access Control:**
- Faculty can view assignments for courses they teach
- Students can view published assignments
- Admin can view all assignments

**Response:**
```json
{
  "success": true,
  "data": {
    "assignment": {
      "id": "assignment_id",
      "title": "Mathematics Assignment 1",
      "description": "Solve the given mathematical problems and submit your solutions.",
      "subject": "Mathematics",
      "deadline": "2024-02-15T23:59:59.000Z",
      "courseId": {
        "id": "course_id",
        "title": "Advanced Mathematics",
        "code": "MATH301",
        "credits": 4
      },
      "academicYear": "2024-2025",
      "semester": 1,
      "fileUrl": "/uploads/assignments/assignment_file.pdf",
      "fileName": "assignment_1.pdf",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "uploadedBy": {
        "firstName": "Jane",
        "lastName": "Smith",
        "role": "faculty"
      },
      "totalPoints": 100,
      "type": "assignment",
      "priority": "medium",
      "instructions": "Please show all your work and provide detailed explanations.",
      "allowLateSubmission": true,
      "latePenalty": 10,
      "maxSubmissions": 1,
      "tags": ["mathematics", "algebra", "homework"],
      "remarks": "This is the first assignment of the semester",
      "isPublished": true,
      "attachments": [],
      "submissions": [], // For faculty/admin, or student's own submissions
      "isOverdue": false,
      "submissionCount": 0,
      "daysUntilDeadline": 15,
      "isUrgent": false,
      "formattedDeadline": "2024-02-15",
      "viewCount": 5,
      "downloadCount": 3,
      "createdAt": "2024-01-31T10:00:00.000Z",
      "updatedAt": "2024-01-31T10:00:00.000Z"
    }
  }
}
```

### 5. Download Assignment File
**GET** `/api/assignments/:id/download`

Download the assignment file.

**Headers:**
- `Authorization: Bearer <token>` (Required)

**Parameters:**
- `id`: Assignment ID (MongoDB ObjectId)

**Access Control:**
- Faculty can download assignments for courses they teach
- Students can download published assignments
- Admin can download all assignments

**Response:**
- File download with appropriate headers
- Content-Type: Based on file MIME type
- Content-Disposition: attachment; filename="original_filename"

**Usage:**
```bash
curl -X GET http://localhost:5000/api/assignments/507f1f77bcf86cd799439013/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output assignment_file.pdf
```

### 6. Update Assignment
**PUT** `/api/assignments/:id`

Update an existing assignment.

**Headers:**
- `Authorization: Bearer <token>` (Required - Faculty/Admin only)
- `Content-Type: multipart/form-data` (for file uploads)

**Parameters:**
- `id`: Assignment ID (MongoDB ObjectId)

**Body Parameters:** (All optional)
```json
{
  "title": "Updated Mathematics Assignment 1",
  "description": "Updated description...",
  "deadline": "2024-02-20T23:59:59.000Z",
  "totalPoints": 120,
  "priority": "high",
  "instructions": "Updated instructions...",
  "allowLateSubmission": false,
  "isPublished": true,
  "tags": "mathematics,algebra,updated",
  "remarks": "Updated remarks"
}
```

**File Upload:**
- Field name: `assignmentFile`
- Replaces existing file if provided

**Access Control:**
- Faculty can only edit assignments for courses they teach
- Admin can edit any assignment

**Response:**
```json
{
  "success": true,
  "message": "Assignment updated successfully",
  "data": {
    "assignment": {
      // Updated assignment object
    }
  }
}
```

### 7. Delete Assignment
**DELETE** `/api/assignments/:id`

Soft delete an assignment (sets isActive to false).

**Headers:**
- `Authorization: Bearer <token>` (Required - Faculty/Admin only)

**Parameters:**
- `id`: Assignment ID (MongoDB ObjectId)

**Access Control:**
- Faculty can only delete assignments for courses they teach
- Admin can delete any assignment

**Response:**
```json
{
  "success": true,
  "message": "Assignment deleted successfully"
}
```

### 8. Get Upcoming Deadlines
**GET** `/api/assignments/upcoming-deadlines`

Get assignments with upcoming deadlines.

**Headers:**
- `Authorization: Bearer <token>` (Required)

**Query Parameters:**
- `courseId`: Course ID (required)
- `days`: Number of days ahead to look (1-30, default: 7)

**Response:**
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "id": "assignment_id",
        "title": "Mathematics Assignment 2",
        "deadline": "2024-02-05T23:59:59.000Z",
        "courseId": {
          "title": "Advanced Mathematics",
          "code": "MATH301"
        },
        "uploadedBy": {
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "daysUntilDeadline": 3,
        "isUrgent": true,
        "hasSubmitted": false
      }
    ],
    "daysAhead": 7
  }
}
```

### 9. Get Assignment Statistics
**GET** `/api/assignments/:id/statistics`

Get detailed statistics for an assignment.

**Headers:**
- `Authorization: Bearer <token>` (Required - Faculty/Admin only)

**Parameters:**
- `id`: Assignment ID (MongoDB ObjectId)

**Access Control:**
- Faculty can view statistics for assignments in courses they teach
- Admin can view statistics for any assignment

**Response:**
```json
{
  "success": true,
  "data": {
    "assignment": {
      "id": "assignment_id",
      "title": "Mathematics Assignment 1",
      "totalPoints": 100,
      "deadline": "2024-02-15T23:59:59.000Z"
    },
    "statistics": {
      "totalSubmissions": 45,
      "gradedSubmissions": 40,
      "pendingGrading": 5,
      "lateSubmissions": 8,
      "onTimeSubmissions": 37,
      "averageGrade": 78.5,
      "highestGrade": 98,
      "lowestGrade": 45,
      "averagePercentage": "78.50"
    }
  }
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "deadline",
      "message": "Deadline must be in the future"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "Access denied. You can only create assignments for courses you teach.",
  "code": "COURSE_INSTRUCTOR_REQUIRED"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Assignment not found"
}
```

### File Not Found (404)
```json
{
  "success": false,
  "message": "Assignment file not found on server"
}
```

## Usage Examples

### 1. Create Assignment with File Upload
```bash
curl -X POST http://localhost:5000/api/assignments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "assignmentFile=@assignment.pdf" \
  -F "title=Mathematics Assignment 1" \
  -F "description=Solve the given mathematical problems" \
  -F "subject=Mathematics" \
  -F "deadline=2024-02-15T23:59:59.000Z" \
  -F "courseId=507f1f77bcf86cd799439012" \
  -F "academicYear=2024-2025" \
  -F "semester=1"
```

### 2. Get Course Assignments
```bash
curl -X GET "http://localhost:5000/api/assignments/course/507f1f77bcf86cd799439012?academicYear=2024-2025&semester=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Get My Assignments (Student)
```bash
curl -X GET "http://localhost:5000/api/assignments/my-assignments?status=pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Download Assignment
```bash
curl -X GET http://localhost:5000/api/assignments/507f1f77bcf86cd799439013/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output assignment.pdf
```

### 5. Update Assignment
```bash
curl -X PUT http://localhost:5000/api/assignments/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Assignment Title",
    "deadline": "2024-02-20T23:59:59.000Z",
    "priority": "high"
  }'
```

### 6. Get Upcoming Deadlines
```bash
curl -X GET "http://localhost:5000/api/assignments/upcoming-deadlines?courseId=507f1f77bcf86cd799439012&days=7" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Features

### Role-Based Access Control
- **Admin**: Full access to all assignment operations
- **Faculty**: Can manage assignments for courses they teach
- **Students**: Can view and download published assignments

### File Management
- **Upload Support**: Single file upload per assignment with additional attachments
- **Download Tracking**: Track download counts and view counts
- **File Validation**: Secure file handling with type and size validation
- **File Streaming**: Efficient file download with proper headers

### Assignment Features
- **Deadline Management**: Automatic overdue detection and deadline tracking
- **Priority System**: Low, medium, high, urgent priority levels
- **Late Submissions**: Configurable late submission policies with penalties
- **Multiple Submissions**: Support for multiple submissions per student
- **Tagging System**: Categorize assignments with tags
- **Publishing Control**: Draft and publish workflow

### Advanced Features
- **Statistics**: Comprehensive assignment and submission statistics
- **Search and Filter**: Filter by multiple criteria (type, priority, status, etc.)
- **Pagination**: Efficient handling of large assignment lists
- **Upcoming Deadlines**: Proactive deadline notifications
- **Submission Tracking**: Track student submission status and history

### Data Integrity
- **Validation**: Comprehensive input validation with detailed error messages
- **Soft Delete**: Assignments are deactivated rather than permanently deleted
- **Audit Trail**: Track who created/modified assignments and when
- **File Cleanup**: Automatic file management and cleanup

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role Authorization**: Granular permission control based on user roles
- **File Security**: Secure file upload and download with access control
- **Input Sanitization**: Protection against injection attacks

### Performance Features
- **Efficient Queries**: Optimized database queries with proper indexing
- **File Streaming**: Memory-efficient file downloads
- **Caching**: Virtual fields for calculated values
- **Pagination**: Efficient data loading for large datasets