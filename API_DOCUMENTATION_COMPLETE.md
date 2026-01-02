# 🔌 COMPLETE API DOCUMENTATION

## 📋 API Overview

This document provides comprehensive documentation for all APIs in the Academic Management Portal, including authentication, admin, faculty, and student endpoints.

## 🔐 Authentication

### Base URL
```
http://localhost:3000/api
```

### Authentication Header
```javascript
Headers: {
    "Authorization": "Bearer <JWT_TOKEN>",
    "Content-Type": "application/json"
}
```

---

## 🔑 Authentication APIs

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "student|faculty",
    "course": "B.Tech Computer Science",    // For students
    "semester": 3,                          // For students
    "department": "Computer Science",       // For faculty
    "designation": "Professor"              // For faculty
}
```

**Response:**
```json
{
    "success": true,
    "message": "Registration successful. Awaiting admin approval.",
    "data": {
        "userId": "ObjectId",
        "email": "john@example.com",
        "role": "student",
        "status": "pending"
    }
}
```

### Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
    "email": "john@example.com",
    "password": "password123"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "id": "ObjectId",
            "name": "John Doe",
            "email": "john@example.com",
            "role": "student",
            "status": "approved"
        }
    }
}
```

---

## 👑 Admin APIs

### Get All Users
```http
GET /api/admin/users
```

**Query Parameters:**
- `status` (optional): pending|approved
- `role` (optional): admin|faculty|student
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
    "success": true,
    "data": {
        "users": [
            {
                "id": "ObjectId",
                "name": "John Doe",
                "email": "john@example.com",
                "role": "student",
                "status": "pending",
                "createdAt": "2024-01-01T00:00:00.000Z"
            }
        ],
        "total": 25,
        "pagination": {
            "current": 1,
            "pages": 3,
            "total": 25
        }
    }
}
```

### Approve User
```http
PATCH /api/admin/users/:userId/approve
```

**Response:**
```json
{
    "success": true,
    "message": "User approved successfully",
    "data": {
        "id": "ObjectId",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "student",
        "status": "approved"
    }
}
```

### Delete User
```http
DELETE /api/admin/users/:userId
```

**Response:**
```json
{
    "success": true,
    "message": "User deleted successfully"
}
```

### System Statistics
```http
GET /api/admin/stats
```

**Response:**
```json
{
    "success": true,
    "data": {
        "totalUsers": 150,
        "totalStudents": 120,
        "totalFaculty": 25,
        "totalAdmins": 5,
        "pendingApprovals": 8,
        "activeUsers": 142,
        "systemHealth": "good"
    }
}
```

---

## 👨‍🏫 Faculty APIs

### Get Assigned Students
```http
GET /api/faculty/students
```

**Response:**
```json
{
    "success": true,
    "data": {
        "students": [
            {
                "id": "ObjectId",
                "userId": {
                    "name": "John Doe",
                    "email": "john@example.com"
                },
                "rollNumber": "STU2024001",
                "course": "B.Tech Computer Science",
                "semester": 3,
                "cgpa": 8.5
            }
        ],
        "total": 25
    }
}
```

### Add Student Attendance
```http
POST /api/faculty/students/:studentId/attendance
```

**Request Body:**
```json
{
    "subject": "Data Structures",
    "subjectCode": "CS301",
    "date": "2024-01-15T10:00:00.000Z",
    "status": "present|absent|late",
    "classType": "lecture|lab|tutorial",
    "duration": 60
}
```

**Response:**
```json
{
    "success": true,
    "message": "Attendance recorded successfully",
    "data": {
        "id": "ObjectId",
        "studentId": "ObjectId",
        "subject": "Data Structures",
        "status": "present",
        "date": "2024-01-15T10:00:00.000Z"
    }
}
```

### Add Student Marks
```http
POST /api/faculty/students/:studentId/marks
```

**Request Body:**
```json
{
    "subject": "Data Structures",
    "subjectCode": "CS301",
    "examType": "mid-term|final|assignment|quiz|project",
    "totalMarks": 85,
    "maxMarks": 100,
    "credits": 4
}
```

**Response:**
```json
{
    "success": true,
    "message": "Marks added successfully",
    "data": {
        "id": "ObjectId",
        "studentId": "ObjectId",
        "subject": "Data Structures",
        "totalMarks": 85,
        "maxMarks": 100,
        "percentage": 85,
        "grade": "A",
        "gradePoints": 9
    }
}
```###
 Create Notice
```http
POST /api/faculty/notices
```

**Request Body:**
```json
{
    "title": "Mid-term Examination Schedule",
    "content": "Mid-term examinations will be conducted from March 15-25, 2024.",
    "priority": "urgent|important|normal",
    "category": "academic|administrative|event|general",
    "targetGroup": {
        "allStudents": false,
        "courses": ["B.Tech Computer Science"],
        "semesters": [3, 4],
        "departments": ["Computer Science"]
    },
    "expiryDate": "2024-03-30T23:59:59.000Z"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Notice created successfully",
    "data": {
        "id": "ObjectId",
        "title": "Mid-term Examination Schedule",
        "priority": "important",
        "publishDate": "2024-01-15T10:00:00.000Z",
        "isActive": true
    }
}
```

### Upload Resource
```http
POST /api/faculty/resources
```

**Request Body (multipart/form-data):**
```
file: [File]
title: "Data Structures Lecture Notes"
description: "Comprehensive notes covering all topics"
subject: "Data Structures"
subjectCode: "CS301"
resourceType: "notes|assignment|tutorial|reference|video|other"
semester: 3
targetGroup: {
    "allStudents": false,
    "courses": ["B.Tech Computer Science"],
    "semesters": [3],
    "departments": ["Computer Science"]
}
```

**Response:**
```json
{
    "success": true,
    "message": "Resource uploaded successfully",
    "data": {
        "id": "ObjectId",
        "title": "Data Structures Lecture Notes",
        "filename": "ds_notes_1642234567890.pdf",
        "originalName": "Data Structures Notes.pdf",
        "fileSize": 2048000,
        "uploadDate": "2024-01-15T10:00:00.000Z"
    }
}
```

### Get Faculty Statistics
```http
GET /api/faculty/stats
```

**Response:**
```json
{
    "success": true,
    "data": {
        "assignedStudents": 25,
        "totalSubjects": 3,
        "totalNotices": 12,
        "totalResources": 8,
        "pendingLeaves": 5,
        "attendanceRecords": 150,
        "marksRecords": 75
    }
}
```

---

## 🎓 Student APIs

### Get Own Profile
```http
GET /api/student/profile
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "ObjectId",
        "name": "John Doe",
        "email": "john@example.com",
        "rollNumber": "STU2024001",
        "course": "B.Tech Computer Science",
        "semester": 3,
        "department": "Computer Science",
        "cgpa": 8.5,
        "enrollmentYear": 2024,
        "selectedCourses": [
            {
                "subjectName": "Data Structures",
                "subjectCode": "CS301",
                "credits": 4,
                "facultyName": "Dr. Smith"
            }
        ],
        "isActive": true
    }
}
```

### Get Own Attendance
```http
GET /api/student/attendance
```

**Query Parameters:**
- `subject` (optional): Filter by subject
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
    "success": true,
    "data": {
        "attendance": [
            {
                "id": "ObjectId",
                "subject": "Data Structures",
                "subjectCode": "CS301",
                "date": "2024-01-15T10:00:00.000Z",
                "status": "present",
                "classType": "lecture",
                "duration": 60,
                "facultyName": "Dr. Smith"
            }
        ],
        "total": 45,
        "pagination": {
            "current": 1,
            "pages": 3,
            "total": 45
        }
    }
}
```

### Get Own Marks
```http
GET /api/student/marks
```

**Query Parameters:**
- `subject` (optional): Filter by subject
- `examType` (optional): Filter by exam type
- `semester` (optional): Filter by semester

**Response:**
```json
{
    "success": true,
    "data": {
        "marks": [
            {
                "id": "ObjectId",
                "subject": "Data Structures",
                "subjectCode": "CS301",
                "examType": "mid-term",
                "totalMarks": 85,
                "maxMarks": 100,
                "percentage": 85,
                "grade": "A",
                "gradePoints": 9,
                "credits": 4,
                "facultyName": "Dr. Smith",
                "dateRecorded": "2024-01-15T10:00:00.000Z"
            }
        ],
        "total": 12
    }
}
```

### Get Relevant Notices
```http
GET /api/student/notices
```

**Query Parameters:**
- `category` (optional): Filter by category
- `priority` (optional): Filter by priority

**Response:**
```json
{
    "success": true,
    "data": {
        "notices": [
            {
                "id": "ObjectId",
                "title": "Mid-term Examination Schedule",
                "content": "Mid-term examinations will be conducted from March 15-25, 2024.",
                "priority": "important",
                "category": "academic",
                "publishDate": "2024-01-15T10:00:00.000Z",
                "expiryDate": "2024-03-30T23:59:59.000Z",
                "facultyName": "Dr. Smith"
            }
        ],
        "total": 8
    }
}
```

### Get Accessible Resources
```http
GET /api/student/resources
```

**Query Parameters:**
- `subject` (optional): Filter by subject
- `resourceType` (optional): Filter by resource type
- `semester` (optional): Filter by semester

**Response:**
```json
{
    "success": true,
    "data": {
        "resources": [
            {
                "id": "ObjectId",
                "title": "Data Structures Lecture Notes",
                "description": "Comprehensive notes covering all topics",
                "subject": "Data Structures",
                "subjectCode": "CS301",
                "resourceType": "notes",
                "filename": "ds_notes.pdf",
                "fileSize": 2048000,
                "uploadDate": "2024-01-15T10:00:00.000Z",
                "downloadCount": 25,
                "facultyName": "Dr. Smith"
            }
        ],
        "total": 15
    }
}
```

### Download Resource
```http
GET /api/student/resource/:resourceId/download
```

**Response:**
- File stream with proper headers
- Content-Type: application/pdf (or appropriate MIME type)
- Content-Disposition: attachment; filename="filename.pdf"

### Apply for Leave
```http
POST /api/student/leave
```

**Request Body:**
```json
{
    "leaveType": "sick|personal|emergency|medical|family",
    "reason": "Medical appointment with specialist",
    "fromDate": "2024-01-20T00:00:00.000Z",
    "toDate": "2024-01-22T00:00:00.000Z",
    "totalDays": 3,
    "priority": "normal|urgent",
    "contactInfo": "9876543210"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Leave application submitted successfully",
    "data": {
        "id": "ObjectId",
        "leaveType": "medical",
        "fromDate": "2024-01-20T00:00:00.000Z",
        "toDate": "2024-01-22T00:00:00.000Z",
        "totalDays": 3,
        "status": "pending",
        "appliedDate": "2024-01-15T10:00:00.000Z"
    }
}
```

### Get Own Leave Applications
```http
GET /api/student/leaves
```

**Query Parameters:**
- `status` (optional): Filter by status
- `leaveType` (optional): Filter by leave type

**Response:**
```json
{
    "success": true,
    "data": {
        "leaves": [
            {
                "id": "ObjectId",
                "leaveType": "medical",
                "reason": "Medical appointment with specialist",
                "fromDate": "2024-01-20T00:00:00.000Z",
                "toDate": "2024-01-22T00:00:00.000Z",
                "totalDays": 3,
                "status": "approved",
                "priority": "normal",
                "appliedDate": "2024-01-15T10:00:00.000Z",
                "reviewDate": "2024-01-16T09:00:00.000Z",
                "reviewComments": "Approved for medical reasons",
                "reviewedBy": "Dr. Smith"
            }
        ],
        "total": 5
    }
}
```

---

## 🔄 Cross-Role APIs

### Review Leave Application
```http
PATCH /api/leave/:leaveId/review
```

**Access:** Faculty and Admin only

**Request Body:**
```json
{
    "status": "approved|rejected",
    "reviewComments": "Approved for medical reasons"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Leave application reviewed successfully",
    "data": {
        "id": "ObjectId",
        "status": "approved",
        "reviewDate": "2024-01-16T09:00:00.000Z",
        "reviewComments": "Approved for medical reasons"
    }
}
```

### Edit Marks
```http
PUT /api/marks/:markId
```

**Access:** Faculty and Admin only

**Request Body:**
```json
{
    "totalMarks": 90,
    "maxMarks": 100
}
```

**Response:**
```json
{
    "success": true,
    "message": "Marks updated successfully",
    "data": {
        "id": "ObjectId",
        "totalMarks": 90,
        "percentage": 90,
        "grade": "A+",
        "gradePoints": 10,
        "lastModified": "2024-01-16T10:00:00.000Z"
    }
}
```

---

## 🚨 Error Responses

### Common Error Formats

**401 Unauthorized:**
```json
{
    "success": false,
    "message": "Access token required"
}
```

**403 Forbidden:**
```json
{
    "success": false,
    "message": "Access denied - insufficient permissions"
}
```

**404 Not Found:**
```json
{
    "success": false,
    "message": "Resource not found"
}
```

**422 Validation Error:**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        {
            "field": "email",
            "message": "Valid email is required"
        }
    ]
}
```

**500 Internal Server Error:**
```json
{
    "success": false,
    "message": "Internal server error"
}
```

---

## 📊 API Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Internal Server Error | Server error |

---

## 🔐 Security Notes

1. **Authentication Required:** All APIs except registration and login require JWT token
2. **Role-based Access:** APIs enforce role-based permissions
3. **Data Isolation:** Users can only access their own data or assigned data
4. **Input Validation:** All inputs are validated and sanitized
5. **Rate Limiting:** APIs have rate limiting to prevent abuse
6. **HTTPS Only:** Production APIs should use HTTPS only
7. **Token Expiry:** JWT tokens expire after 24 hours

## 📝 API Testing

### Using cURL
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}'

# Get student profile (with token)
curl -X GET http://localhost:3000/api/student/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman
1. Import the API collection
2. Set environment variables for base URL and token
3. Use the authentication endpoint to get token
4. Test other endpoints with the token

**🔌 COMPLETE API DOCUMENTATION DELIVERED**