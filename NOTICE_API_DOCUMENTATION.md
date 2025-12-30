# Notice Management API Documentation

## Overview
The Notice Management API provides endpoints for creating, reading, updating, and deleting notices and announcements in the academic portal system.

## Base URL
```
/api/notices
```

## Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Create Notice
**POST** `/api/notices`

Creates a new notice. Only faculty and admin can create notices.

**Headers:**
- `Authorization: Bearer <token>` (Required)
- `Content-Type: multipart/form-data` (for file uploads)

**Body Parameters:**
```json
{
  "title": "string (5-200 chars, required)",
  "content": "string (10-5000 chars, required)",
  "priority": "normal|important|urgent (optional, default: normal)",
  "targetAudience": "all|students|faculty|admin|specific_course|specific_year (optional, default: all)",
  "expiryDate": "ISO date string (optional, must be future date)",
  "targetCourses": ["courseId1", "courseId2"] (optional, array of course IDs)",
  "targetYears": [1, 2, 3] (optional, array of years 1-6)",
  "type": "general|academic|exam|event|holiday|announcement (optional, default: general)",
  "publishDate": "ISO date string (optional, default: now)"
}
```

**File Upload:**
- Field name: `attachments`
- Max files: 5
- Supported formats: All common file types

**Response:**
```json
{
  "success": true,
  "message": "Notice created successfully",
  "data": {
    "notice": {
      "id": "notice_id",
      "title": "Notice Title",
      "content": "Notice content...",
      "priority": "normal",
      "targetAudience": "all",
      "createdBy": {
        "firstName": "John",
        "lastName": "Doe",
        "role": "faculty"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 2. Get All Notices
**GET** `/api/notices`

Retrieves notices based on user role and targeting. Authenticated users see notices targeted to them.

**Headers:**
- `Authorization: Bearer <token>` (Required)

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (1-50, default: 10)
- `priority`: Filter by priority (normal|important|urgent)
- `type`: Filter by type (general|academic|exam|event|holiday|announcement)
- `search`: Search in title and content (2-100 chars)

**Response:**
```json
{
  "success": true,
  "data": {
    "notices": [
      {
        "id": "notice_id",
        "title": "Notice Title",
        "content": "Notice content...",
        "priority": "normal",
        "targetAudience": "all",
        "createdBy": {
          "firstName": "John",
          "lastName": "Doe",
          "role": "faculty"
        },
        "isRead": false,
        "viewCount": 5,
        "readCount": 2,
        "isUrgent": false,
        "daysUntilExpiry": 30,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalNotices": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 3. Get Notices for Students (Public)
**GET** `/api/notices/students`

Public endpoint to get notices targeted to students. No authentication required.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (1-50, default: 10)
- `priority`: Filter by priority (normal|important|urgent)
- `year`: Filter by student year (1-6)
- `courseId`: Filter by course ID
- `search`: Search in title and content

**Response:**
```json
{
  "success": true,
  "data": {
    "notices": [
      {
        "id": "notice_id",
        "title": "Student Notice",
        "content": "Important information for students...",
        "priority": "important",
        "targetAudience": "students",
        "createdBy": {
          "firstName": "Jane",
          "lastName": "Smith",
          "role": "admin"
        },
        "type": "academic",
        "publishDate": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "viewCount": 15,
        "isUrgent": false,
        "daysUntilExpiry": null
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalNotices": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 4. Get Notice by ID
**GET** `/api/notices/:id`

Retrieves a specific notice by ID. Users can only view notices they have access to.

**Headers:**
- `Authorization: Bearer <token>` (Required)

**Parameters:**
- `id`: Notice ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "data": {
    "notice": {
      "id": "notice_id",
      "title": "Notice Title",
      "content": "Full notice content...",
      "priority": "urgent",
      "targetAudience": "all",
      "expiryDate": "2024-12-31T23:59:59.000Z",
      "createdBy": {
        "firstName": "John",
        "lastName": "Doe",
        "role": "faculty"
      },
      "type": "announcement",
      "attachments": [
        {
          "filename": "document.pdf",
          "filePath": "/uploads/notices/document.pdf",
          "fileSize": 1024000,
          "mimeType": "application/pdf"
        }
      ],
      "publishDate": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "viewCount": 10,
      "readCount": 5
    }
  }
}
```

### 5. Update Notice
**PUT** `/api/notices/:id`

Updates an existing notice. Only the creator or admin can update notices.

**Headers:**
- `Authorization: Bearer <token>` (Required)
- `Content-Type: multipart/form-data` (for file uploads)

**Parameters:**
- `id`: Notice ID (MongoDB ObjectId)

**Body Parameters:** (All optional)
```json
{
  "title": "string (5-200 chars)",
  "content": "string (10-5000 chars)",
  "priority": "normal|important|urgent",
  "targetAudience": "all|students|faculty|admin|specific_course|specific_year",
  "expiryDate": "ISO date string (must be future date)",
  "targetCourses": ["courseId1", "courseId2"],
  "targetYears": [1, 2, 3],
  "type": "general|academic|exam|event|holiday|announcement"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notice updated successfully",
  "data": {
    "notice": {
      // Updated notice object
    }
  }
}
```

### 6. Delete Notice
**DELETE** `/api/notices/:id`

Soft deletes a notice (sets isActive to false). Only the creator or admin can delete notices.

**Headers:**
- `Authorization: Bearer <token>` (Required)

**Parameters:**
- `id`: Notice ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Notice deleted successfully"
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
      "field": "title",
      "message": "Title must be between 5 and 200 characters"
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
  "message": "Access denied. Only faculty and administrators can upload notices.",
  "code": "FACULTY_OR_ADMIN_REQUIRED"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Notice not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Server error while creating notice"
}
```

## Usage Examples

### Create a General Notice
```bash
curl -X POST http://localhost:5000/api/notices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Important Announcement",
    "content": "This is an important announcement for all users.",
    "priority": "important",
    "targetAudience": "all"
  }'
```

### Create a Course-Specific Notice
```bash
curl -X POST http://localhost:5000/api/notices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Assignment Deadline Extended",
    "content": "The assignment deadline has been extended to next Friday.",
    "priority": "normal",
    "targetAudience": "specific_course",
    "targetCourses": ["course_id_1", "course_id_2"],
    "type": "academic"
  }'
```

### Get Student Notices (Public)
```bash
curl -X GET "http://localhost:5000/api/notices/students?page=1&limit=10&priority=urgent"
```

### Get All Notices (Authenticated)
```bash
curl -X GET "http://localhost:5000/api/notices?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Features

### Role-Based Access Control
- **Admin**: Can create, read, update, and delete all notices
- **Faculty**: Can create, read, update, and delete their own notices; can read notices targeted to them
- **Students**: Can read notices targeted to them; cannot create, update, or delete notices

### Targeting Options
- **All**: Visible to all users
- **Students**: Visible only to students
- **Faculty**: Visible only to faculty
- **Admin**: Visible only to admin
- **Specific Course**: Visible to students enrolled in and faculty teaching specific courses
- **Specific Year**: Visible to students in specific academic years

### Advanced Features
- **File Attachments**: Support for multiple file attachments per notice
- **Priority Levels**: Normal, Important, Urgent with visual indicators
- **Expiry Dates**: Automatic hiding of expired notices
- **Read Tracking**: Track which users have read each notice
- **View Counting**: Track how many times a notice has been viewed
- **Search**: Full-text search in title and content
- **Pagination**: Efficient pagination for large notice lists
- **Soft Delete**: Notices are soft-deleted (marked inactive) rather than permanently removed

### Security Features
- JWT-based authentication
- Role-based authorization
- Input validation and sanitization
- File upload security
- Rate limiting
- Security logging for unauthorized access attempts