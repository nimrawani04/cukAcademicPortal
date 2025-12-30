# Attendance Management API Documentation

## Overview
The Attendance Management API provides comprehensive endpoints for managing student attendance, calculating attendance percentages, and generating attendance reports with role-based access control.

## Base URL
```
/api/attendance
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Attendance Model Structure

### Fields
- **studentId**: Reference to Student (required)
- **courseId**: Reference to Course (required)
- **subject**: Subject name (required, 2-100 chars)
- **date**: Attendance date (required, cannot be future)
- **status**: Attendance status (required)
  - `present`: Student was present
  - `absent`: Student was absent
  - `late`: Student was late
  - `excused`: Student was excused
- **markedBy**: Reference to User who marked attendance (required)
- **academicYear**: Format YYYY-YYYY (required, e.g., "2024-2025")
- **semester**: Integer 1-8 (required)
- **classType**: Type of class (lecture, lab, tutorial, seminar, practical)
- **duration**: Class duration in minutes (15-300, default: 60)
- **remarks**: Optional text (max 500 chars)

### Attendance Points System
- **Present**: 1 point
- **Excused**: 1 point
- **Late**: 0.5 points
- **Absent**: 0 points

## Endpoints

### 1. Mark Single Attendance
**POST** `/api/attendance`

Mark attendance for a single student.

**Headers:**
- `Authorization: Bearer <token>` (Required - Faculty/Admin only)
- `Content-Type: application/json`

**Body:**
```json
{
  "studentId": "507f1f77bcf86cd799439011",
  "courseId": "507f1f77bcf86cd799439012",
  "subject": "Mathematics",
  "date": "2024-01-15",
  "status": "present",
  "academicYear": "2024-2025",
  "semester": 1,
  "classType": "lecture",
  "duration": 60,
  "remarks": "Active participation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "attendance": {
      "id": "attendance_id",
      "studentId": {
        "firstName": "John",
        "lastName": "Doe",
        "rollNumber": "CS2024001"
      },
      "courseId": {
        "title": "Advanced Mathematics",
        "code": "MATH301"
      },
      "subject": "Mathematics",
      "date": "2024-01-15T00:00:00.000Z",
      "status": "present",
      "academicYear": "2024-2025",
      "semester": 1,
      "classType": "lecture",
      "duration": 60,
      "remarks": "Active participation",
      "markedBy": {
        "firstName": "Jane",
        "lastName": "Smith",
        "role": "faculty"
      },
      "attendancePoints": 1,
      "formattedDate": "2024-01-15",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

### 2. Mark Bulk Attendance
**POST** `/api/attendance/bulk`

Mark attendance for multiple students at once.

**Headers:**
- `Authorization: Bearer <token>` (Required - Faculty/Admin only)
- `Content-Type: application/json`

**Body:**
```json
{
  "attendanceData": [
    {
      "studentId": "507f1f77bcf86cd799439011",
      "courseId": "507f1f77bcf86cd799439012",
      "subject": "Mathematics",
      "date": "2024-01-15",
      "status": "present",
      "academicYear": "2024-2025",
      "semester": 1,
      "classType": "lecture",
      "duration": 60,
      "remarks": "Good"
    },
    {
      "studentId": "507f1f77bcf86cd799439013",
      "courseId": "507f1f77bcf86cd799439012",
      "subject": "Mathematics",
      "date": "2024-01-15",
      "status": "absent",
      "academicYear": "2024-2025",
      "semester": 1,
      "classType": "lecture",
      "duration": 60
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk attendance processing completed",
  "data": {
    "batchId": "uuid-string",
    "totalProcessed": 2,
    "successful": 1,
    "updated": 1,
    "errors": 0,
    "results": {
      "success": [
        {
          "row": 1,
          "studentId": "507f1f77bcf86cd799439011",
          "attendanceId": "attendance_id_1"
        }
      ],
      "duplicates": [
        {
          "row": 2,
          "studentId": "507f1f77bcf86cd799439013",
          "action": "updated",
          "attendanceId": "attendance_id_2"
        }
      ],
      "errors": []
    }
  }
}
```

### 3. Get Student Attendance
**GET** `/api/attendance/student/:studentId`

Retrieve attendance records for a specific student.

**Headers:**
- `Authorization: Bearer <token>` (Required)

**Parameters:**
- `studentId`: Student ID (MongoDB ObjectId)

**Query Parameters:**
- `courseId`: Filter by course (optional)
- `academicYear`: Filter by academic year (optional)
- `semester`: Filter by semester (optional)
- `startDate`: Filter from date (optional, ISO format)
- `endDate`: Filter to date (optional, ISO format)
- `status`: Filter by status (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (1-200, default: 50)

**Access Control:**
- Students can only view their own attendance
- Faculty and Admin can view any student's attendance

**Response:**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "student_id",
      "name": "John Doe",
      "rollNumber": "CS2024001"
    },
    "attendance": [
      {
        "id": "attendance_id",
        "courseId": {
          "title": "Advanced Mathematics",
          "code": "MATH301"
        },
        "subject": "Mathematics",
        "date": "2024-01-15T00:00:00.000Z",
        "status": "present",
        "academicYear": "2024-2025",
        "semester": 1,
        "classType": "lecture",
        "duration": 60,
        "remarks": "Good participation",
        "markedBy": {
          "firstName": "Jane",
          "lastName": "Smith",
          "role": "faculty"
        },
        "attendancePoints": 1,
        "formattedDate": "2024-01-15"
      }
    ],
    "courseStatistics": {
      "507f1f77bcf86cd799439012": {
        "totalClasses": 20,
        "attendedClasses": 18,
        "lateClasses": 1,
        "absentClasses": 1,
        "effectiveAttendance": 18.5,
        "percentage": 92.5,
        "status": "Excellent",
        "breakdown": {
          "present": 18,
          "absent": 1,
          "late": 1,
          "excused": 0
        }
      }
    },
    "overallStatistics": {
      "totalClasses": 45,
      "presentClasses": 40,
      "absentClasses": 3,
      "lateClasses": 2,
      "excusedClasses": 0,
      "overallPercentage": "91.11"
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalRecords": 45,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### 4. Get Course Attendance
**GET** `/api/attendance/course/:courseId`

Retrieve attendance records for all students in a course.

**Headers:**
- `Authorization: Bearer <token>` (Required)

**Parameters:**
- `courseId`: Course ID (MongoDB ObjectId)

**Query Parameters:**
- `date`: Filter by specific date (optional, ISO format)
- `academicYear`: Filter by academic year (optional)
- `semester`: Filter by semester (optional)
- `status`: Filter by status (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (1-200, default: 100)

**Access Control:**
- Faculty can only view attendance for courses they teach
- Admin can view attendance for any course

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
    "attendance": [
      {
        "id": "attendance_id",
        "studentId": {
          "firstName": "John",
          "lastName": "Doe",
          "rollNumber": "CS2024001",
          "year": 2
        },
        "subject": "Mathematics",
        "date": "2024-01-15T00:00:00.000Z",
        "status": "present",
        "academicYear": "2024-2025",
        "semester": 1,
        "classType": "lecture",
        "markedBy": {
          "firstName": "Jane",
          "lastName": "Smith",
          "role": "faculty"
        }
      }
    ],
    "statistics": {
      "totalClasses": 25,
      "totalStudentAttendances": 1200,
      "overallAttendancePercentage": 85.5,
      "statusBreakdown": {
        "present": 1026,
        "absent": 120,
        "late": 40,
        "excused": 14
      },
      "dailyAttendance": [
        {
          "date": "2024-01-15",
          "present": 42,
          "absent": 5,
          "late": 2,
          "excused": 1,
          "total": 50
        }
      ]
    },
    "dailySummary": null,
    "pagination": {
      "currentPage": 1,
      "totalPages": 12,
      "totalRecords": 1200,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 5. Get Attendance Percentage
**GET** `/api/attendance/percentage/:studentId/:courseId`

Calculate attendance percentage for a student in a specific course.

**Headers:**
- `Authorization: Bearer <token>` (Required)

**Parameters:**
- `studentId`: Student ID (MongoDB ObjectId)
- `courseId`: Course ID (MongoDB ObjectId)

**Query Parameters:**
- `academicYear`: Filter by academic year (optional)
- `semester`: Filter by semester (optional)
- `startDate`: Filter from date (optional)
- `endDate`: Filter to date (optional)

**Access Control:**
- Students can only view their own attendance percentage
- Faculty can view percentage for courses they teach
- Admin can view any attendance percentage

**Response:**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "student_id",
      "name": "John Doe",
      "rollNumber": "CS2024001"
    },
    "course": {
      "id": "course_id",
      "title": "Advanced Mathematics",
      "code": "MATH301"
    },
    "attendanceStats": {
      "totalClasses": 20,
      "attendedClasses": 18,
      "lateClasses": 1,
      "absentClasses": 1,
      "effectiveAttendance": 18.5,
      "percentage": 92.5,
      "status": "Excellent",
      "breakdown": {
        "present": 18,
        "absent": 1,
        "late": 1,
        "excused": 0
      }
    }
  }
}
```

### 6. Update Attendance
**PUT** `/api/attendance/:id`

Update an existing attendance record.

**Headers:**
- `Authorization: Bearer <token>` (Required - Faculty/Admin only)
- `Content-Type: application/json`

**Parameters:**
- `id`: Attendance record ID (MongoDB ObjectId)

**Body:**
```json
{
  "status": "late",
  "remarks": "Arrived 10 minutes late"
}
```

**Access Control:**
- Faculty can only edit attendance for courses they teach
- Admin can edit any attendance

**Response:**
```json
{
  "success": true,
  "message": "Attendance updated successfully",
  "data": {
    "attendance": {
      // Updated attendance object
    }
  }
}
```

### 7. Delete Attendance
**DELETE** `/api/attendance/:id`

Soft delete an attendance record (sets isActive to false).

**Headers:**
- `Authorization: Bearer <token>` (Required - Faculty/Admin only)

**Parameters:**
- `id`: Attendance record ID (MongoDB ObjectId)

**Access Control:**
- Faculty can only delete attendance for courses they teach
- Admin can delete any attendance

**Response:**
```json
{
  "success": true,
  "message": "Attendance deleted successfully"
}
```

### 8. Get My Attendance (Student Convenience Endpoint)
**GET** `/api/attendance/my-attendance`

Get attendance for the currently logged-in student.

**Headers:**
- `Authorization: Bearer <token>` (Required - Students only)

**Query Parameters:**
Same as "Get Student Attendance" endpoint

**Response:**
Same as "Get Student Attendance" endpoint but for the current user.

### 9. Get Course Attendance Summary
**GET** `/api/attendance/course/:courseId/summary`

Get detailed attendance summary for a course with daily breakdown.

**Headers:**
- `Authorization: Bearer <token>` (Required - Faculty/Admin only)

**Parameters:**
- `courseId`: Course ID (MongoDB ObjectId)

**Query Parameters:**
- `academicYear`: Filter by academic year (optional)
- `semester`: Filter by semester (optional)
- `startDate`: Filter from date (optional)
- `endDate`: Filter to date (optional)

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
    "summary": {
      "totalClasses": 25,
      "totalStudentAttendances": 1200,
      "overallAttendancePercentage": 85.5,
      "statusBreakdown": {
        "present": 1026,
        "absent": 120,
        "late": 40,
        "excused": 14
      },
      "dailyAttendance": [
        {
          "date": "2024-01-15",
          "present": 42,
          "absent": 5,
          "late": 2,
          "excused": 1,
          "total": 50
        }
      ]
    }
  }
}
```

### 10. Get Attendance Defaulters
**GET** `/api/attendance/course/:courseId/defaulters`

Get list of students with poor attendance (below threshold).

**Headers:**
- `Authorization: Bearer <token>` (Required - Faculty/Admin only)

**Parameters:**
- `courseId`: Course ID (MongoDB ObjectId)

**Query Parameters:**
- `threshold`: Attendance percentage threshold (0-100, default: 75)
- `academicYear`: Filter by academic year (optional)
- `semester`: Filter by semester (optional)
- `startDate`: Filter from date (optional)
- `endDate`: Filter to date (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "course": {
      "id": "course_id",
      "title": "Advanced Mathematics",
      "code": "MATH301"
    },
    "threshold": 75,
    "totalStudents": 50,
    "defaultersCount": 5,
    "defaulters": [
      {
        "studentId": "student_id",
        "studentName": "Jane Smith",
        "rollNumber": "CS2024002",
        "phone": "+1234567890",
        "email": "jane.smith@example.com",
        "attendanceStats": {
          "totalClasses": 20,
          "attendedClasses": 12,
          "lateClasses": 2,
          "absentClasses": 6,
          "effectiveAttendance": 13.0,
          "percentage": 65.0,
          "status": "Poor",
          "breakdown": {
            "present": 12,
            "absent": 6,
            "late": 2,
            "excused": 0
          }
        }
      }
    ]
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
      "field": "status",
      "message": "Status must be one of: present, absent, late, excused"
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
  "message": "Access denied. You can only view attendance for courses you teach.",
  "code": "COURSE_INSTRUCTOR_REQUIRED"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Attendance record not found"
}
```

## Usage Examples

### 1. Mark Single Attendance
```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "507f1f77bcf86cd799439011",
    "courseId": "507f1f77bcf86cd799439012",
    "subject": "Mathematics",
    "date": "2024-01-15",
    "status": "present",
    "academicYear": "2024-2025",
    "semester": 1
  }'
```

### 2. Mark Bulk Attendance
```bash
curl -X POST http://localhost:5000/api/attendance/bulk \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attendanceData": [
      {
        "studentId": "507f1f77bcf86cd799439011",
        "courseId": "507f1f77bcf86cd799439012",
        "subject": "Mathematics",
        "date": "2024-01-15",
        "status": "present",
        "academicYear": "2024-2025",
        "semester": 1
      }
    ]
  }'
```

### 3. Get Student Attendance
```bash
curl -X GET "http://localhost:5000/api/attendance/student/507f1f77bcf86cd799439011?academicYear=2024-2025&semester=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Get Attendance Percentage
```bash
curl -X GET "http://localhost:5000/api/attendance/percentage/507f1f77bcf86cd799439011/507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Get Attendance Defaulters
```bash
curl -X GET "http://localhost:5000/api/attendance/course/507f1f77bcf86cd799439012/defaulters?threshold=70" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Features

### Role-Based Access Control
- **Admin**: Full access to all attendance operations
- **Faculty**: Can manage attendance for courses they teach
- **Students**: Can only view their own attendance

### Automatic Calculations
- **Attendance Percentage**: Calculated with weighted scoring (late = 0.5 points)
- **Status Classification**: Excellent (95%+), Good (85-94%), Average (75-84%), Poor (<75%)
- **Effective Attendance**: Considers late attendance as partial credit

### Bulk Operations
- **Bulk Marking**: Mark attendance for multiple students at once
- **Batch Tracking**: UUID-based tracking for bulk operations
- **Update Handling**: Automatically updates existing records if duplicate date/student/course

### Statistics and Analytics
- **Course Statistics**: Overall attendance trends and daily breakdowns
- **Student Analytics**: Individual performance tracking across courses
- **Defaulter Identification**: Automatic identification of students below threshold
- **Grade Distribution**: Attendance status distribution across classes

### Data Integrity
- **Validation**: Comprehensive input validation with proper error messages
- **Constraints**: Database-level constraints and unique indexes
- **Soft Delete**: Records are deactivated rather than permanently deleted
- **Audit Trail**: Track who marked attendance and when

### Advanced Features
- **Date Validation**: Prevents future date attendance marking
- **Class Types**: Support for different class types (lecture, lab, tutorial, etc.)
- **Duration Tracking**: Track class duration for better analytics
- **Flexible Filtering**: Filter by date ranges, academic year, semester, status
- **Pagination**: Efficient handling of large attendance datasets

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role Authorization**: Granular permission control based on user roles
- **Input Sanitization**: Protection against injection attacks
- **Access Logging**: Security logging for unauthorized access attempts