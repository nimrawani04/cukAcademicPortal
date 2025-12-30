# Marks Management API Documentation

## Overview
The Marks Management API provides comprehensive endpoints for managing student marks, grades, and academic assessments. It supports manual entry, Excel bulk upload, and detailed reporting with role-based access control.

## Base URL
```
/api/marks
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Marks Model Structure

### Fields
- **studentId**: Reference to Student (required)
- **courseId**: Reference to Course (required)
- **subject**: Subject name (required, 2-100 chars)
- **academicYear**: Format YYYY-YYYY (required, e.g., "2024-2025")
- **semester**: Integer 1-8 (required)
- **test1**: Marks out of 25 (0-25, default: 0)
- **test2**: Marks out of 25 (0-25, default: 0)
- **assignment**: Marks out of 20 (0-20, default: 0)
- **presentation**: Marks out of 15 (0-15, default: 0)
- **attendanceMarks**: Marks out of 15 (0-15, default: 0)
- **total**: Auto-calculated sum of all components (0-100)
- **grade**: Auto-calculated grade (A+, A, B+, B, C+, C, D, F)
- **remarks**: Optional text (max 500 chars)

### Grade Calculation
- **A+**: 90-100 marks
- **A**: 80-89 marks
- **B+**: 70-79 marks
- **B**: 60-69 marks
- **C+**: 50-59 marks
- **C**: 40-49 marks
- **D**: 30-39 marks
- **F**: Below 30 marks

## Endpoints

### 1. Download Excel Template
**GET** `/api/marks/template`

Downloads an Excel template for bulk marks upload.

**Headers:**
- `Authorization: Bearer <token>` (Required - Faculty/Admin only)

**Response:**
- Excel file download with sample data and proper column headers

**Usage:**
```bash
curl -X GET http://localhost:5000/api/marks/template \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output marks_template.xlsx
```

### 2. Upload Marks via Excel
**POST** `/api/marks/upload`

Bulk upload marks using Excel file.

**Headers:**
- `Authorization: Bearer <token>` (Required - Faculty/Admin only)
- `Content-Type: multipart/form-data`

**Body:**
- `excelFile`: Excel file (required)

**Excel Format:**
| studentId | courseId | subject | academicYear | semester | test1 | test2 | assignment | presentation | attendanceMarks | remarks |
|-----------|----------|---------|--------------|----------|-------|-------|------------|--------------|-----------------|---------|
| 507f1f77bcf86cd799439011 | 507f1f77bcf86cd799439012 | Mathematics | 2024-2025 | 1 | 20 | 18 | 15 | 12 | 14 | Good work |

**Response:**
```json
{
  "success": true,
  "message": "Excel upload completed",
  "data": {
    "uploadBatch": "uuid-string",
    "totalProcessed": 50,
    "successful": 45,
    "errors": 2,
    "duplicates": 3,
    "results": {
      "success": [
        {
          "row": 1,
          "marksId": "marks_id",
          "studentId": "student_id"
        }
      ],
      "errors": [
        {
          "row": 3,
          "studentId": "student_id",
          "error": "Student not found"
        }
      ],
      "duplicates": [
        {
          "row": 5,
          "studentId": "student_id",
          "message": "Marks already exist for this student in this course/semester"
        }
      ]
    }
  }
}
```

### 3. Create Marks Manually
**POST** `/api/marks`

Create marks record manually.

**Headers:**
- `Authorization: Bearer <token>` (Required - Faculty/Admin only)
- `Content-Type: application/json`

**Body:**
```json
{
  "studentId": "507f1f77bcf86cd799439011",
  "courseId": "507f1f77bcf86cd799439012",
  "subject": "Mathematics",
  "academicYear": "2024-2025",
  "semester": 1,
  "test1": 20,
  "test2": 18,
  "assignment": 15,
  "presentation": 12,
  "attendanceMarks": 14,
  "remarks": "Good performance"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Marks created successfully",
  "data": {
    "marks": {
      "id": "marks_id",
      "studentId": {
        "firstName": "John",
        "lastName": "Doe",
        "rollNumber": "CS2024001"
      },
      "courseId": {
        "title": "Advanced Mathematics",
        "code": "MATH301",
        "credits": 4
      },
      "subject": "Mathematics",
      "academicYear": "2024-2025",
      "semester": 1,
      "test1": 20,
      "test2": 18,
      "assignment": 15,
      "presentation": 12,
      "attendanceMarks": 14,
      "total": 79,
      "grade": "B+",
      "percentage": "79.00",
      "isPassed": true,
      "enteredBy": {
        "firstName": "Jane",
        "lastName": "Smith",
        "role": "faculty"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 4. Get Student Marks
**GET** `/api/marks/student/:studentId`

Retrieve marks for a specific student.

**Headers:**
- `Authorization: Bearer <token>` (Required)

**Parameters:**
- `studentId`: Student ID (MongoDB ObjectId)

**Query Parameters:**
- `academicYear`: Filter by academic year (optional)
- `semester`: Filter by semester (optional)
- `courseId`: Filter by course (optional)

**Access Control:**
- Students can only view their own marks
- Faculty and Admin can view any student's marks

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
    "marks": [
      {
        "id": "marks_id",
        "courseId": {
          "title": "Advanced Mathematics",
          "code": "MATH301"
        },
        "subject": "Mathematics",
        "academicYear": "2024-2025",
        "semester": 1,
        "test1": 20,
        "test2": 18,
        "assignment": 15,
        "presentation": 12,
        "attendanceMarks": 14,
        "total": 79,
        "grade": "B+",
        "percentage": "79.00",
        "isPassed": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "totalSubjects": 5,
      "averageMarks": "76.40",
      "highestMarks": 85,
      "lowestMarks": 65,
      "passedSubjects": 5,
      "failedSubjects": 0
    }
  }
}
```

### 5. Get Course Marks
**GET** `/api/marks/course/:courseId`

Retrieve marks for all students in a course.

**Headers:**
- `Authorization: Bearer <token>` (Required)

**Parameters:**
- `courseId`: Course ID (MongoDB ObjectId)

**Query Parameters:**
- `academicYear`: Filter by academic year (optional)
- `semester`: Filter by semester (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (1-100, default: 50)

**Access Control:**
- Faculty can only view marks for courses they teach
- Admin can view marks for any course

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
    "marks": [
      {
        "id": "marks_id",
        "studentId": {
          "firstName": "John",
          "lastName": "Doe",
          "rollNumber": "CS2024001",
          "year": 2
        },
        "subject": "Mathematics",
        "academicYear": "2024-2025",
        "semester": 1,
        "test1": 20,
        "test2": 18,
        "assignment": 15,
        "presentation": 12,
        "attendanceMarks": 14,
        "total": 79,
        "grade": "B+",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "statistics": {
      "totalStudents": 45,
      "averageMarks": "72.50",
      "highestMarks": 95,
      "lowestMarks": 35,
      "passedStudents": 42,
      "failedStudents": 3,
      "passPercentage": "93.33",
      "gradeDistribution": {
        "A+": 5,
        "A": 8,
        "B+": 12,
        "B": 10,
        "C+": 5,
        "C": 2,
        "D": 0,
        "F": 3
      }
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

### 6. Update Marks
**PUT** `/api/marks/:id`

Update existing marks record.

**Headers:**
- `Authorization: Bearer <token>` (Required - Faculty/Admin only)
- `Content-Type: application/json`

**Parameters:**
- `id`: Marks record ID (MongoDB ObjectId)

**Body:** (All fields optional)
```json
{
  "test1": 22,
  "test2": 20,
  "assignment": 18,
  "presentation": 14,
  "attendanceMarks": 15,
  "remarks": "Improved performance"
}
```

**Access Control:**
- Faculty can only edit marks for courses they teach
- Admin can edit any marks

**Response:**
```json
{
  "success": true,
  "message": "Marks updated successfully",
  "data": {
    "marks": {
      // Updated marks object
    }
  }
}
```

### 7. Delete Marks
**DELETE** `/api/marks/:id`

Soft delete marks record (sets isActive to false).

**Headers:**
- `Authorization: Bearer <token>` (Required - Faculty/Admin only)

**Parameters:**
- `id`: Marks record ID (MongoDB ObjectId)

**Access Control:**
- Faculty can only delete marks for courses they teach
- Admin can delete any marks

**Response:**
```json
{
  "success": true,
  "message": "Marks deleted successfully"
}
```

### 8. Get Marks Statistics
**GET** `/api/marks/statistics`

Get detailed statistics for a course.

**Headers:**
- `Authorization: Bearer <token>` (Required - Faculty/Admin only)

**Query Parameters:**
- `courseId`: Course ID (required)
- `academicYear`: Academic year (required)
- `semester`: Semester (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalStudents": 45,
      "averageMarks": "72.50",
      "highestMarks": 95,
      "lowestMarks": 35,
      "passedStudents": 42,
      "failedStudents": 3,
      "passPercentage": "93.33",
      "gradeDistribution": {
        "A+": 5,
        "A": 8,
        "B+": 12,
        "B": 10,
        "C+": 5,
        "C": 2,
        "D": 0,
        "F": 3
      }
    }
  }
}
```

### 9. Get My Marks (Student Convenience Endpoint)
**GET** `/api/marks/my-marks`

Get marks for the currently logged-in student.

**Headers:**
- `Authorization: Bearer <token>` (Required - Students only)

**Query Parameters:**
- `academicYear`: Filter by academic year (optional)
- `semester`: Filter by semester (optional)
- `courseId`: Filter by course (optional)

**Response:**
Same as "Get Student Marks" endpoint but for the current user.

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "test1",
      "message": "Test 1 marks must be between 0 and 25"
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
  "message": "Access denied. You can only edit marks for courses you teach.",
  "code": "COURSE_INSTRUCTOR_REQUIRED"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Marks record not found"
}
```

### Duplicate Entry (400)
```json
{
  "success": false,
  "message": "Marks already exist for this student in this course/semester"
}
```

## Usage Examples

### 1. Create Marks Manually
```bash
curl -X POST http://localhost:5000/api/marks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "507f1f77bcf86cd799439011",
    "courseId": "507f1f77bcf86cd799439012",
    "subject": "Mathematics",
    "academicYear": "2024-2025",
    "semester": 1,
    "test1": 20,
    "test2": 18,
    "assignment": 15,
    "presentation": 12,
    "attendanceMarks": 14
  }'
```

### 2. Upload Excel File
```bash
curl -X POST http://localhost:5000/api/marks/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "excelFile=@marks_data.xlsx"
```

### 3. Get Student Marks
```bash
curl -X GET "http://localhost:5000/api/marks/student/507f1f77bcf86cd799439011?academicYear=2024-2025&semester=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Get Course Statistics
```bash
curl -X GET "http://localhost:5000/api/marks/statistics?courseId=507f1f77bcf86cd799439012&academicYear=2024-2025&semester=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Update Marks
```bash
curl -X PUT http://localhost:5000/api/marks/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "test1": 22,
    "test2": 20,
    "remarks": "Improved performance"
  }'
```

## Excel Upload Guidelines

### Required Columns
1. **studentId**: Valid MongoDB ObjectId of the student
2. **courseId**: Valid MongoDB ObjectId of the course
3. **subject**: Subject name (2-100 characters)
4. **academicYear**: Format YYYY-YYYY (e.g., "2024-2025")
5. **semester**: Integer between 1-8

### Optional Columns
- **test1**: Marks out of 25 (0-25)
- **test2**: Marks out of 25 (0-25)
- **assignment**: Marks out of 20 (0-20)
- **presentation**: Marks out of 15 (0-15)
- **attendanceMarks**: Marks out of 15 (0-15)
- **remarks**: Text up to 500 characters

### Excel Upload Process
1. Download template using `/api/marks/template`
2. Fill in student and course data
3. Ensure all required fields are present
4. Upload using `/api/marks/upload`
5. Review the response for any errors or duplicates

### Error Handling
- **Validation Errors**: Invalid data types or out-of-range values
- **Missing References**: Student or Course IDs that don't exist
- **Duplicates**: Marks already exist for student/course/semester combination
- **File Errors**: Invalid Excel format or empty file

## Features

### Role-Based Access Control
- **Admin**: Full access to all marks operations
- **Faculty**: Can manage marks for courses they teach
- **Students**: Can only view their own marks

### Automatic Calculations
- **Total Marks**: Sum of all assessment components
- **Grade**: Calculated based on total marks using standard grading scale
- **Percentage**: Calculated as (total/100) * 100
- **Pass/Fail Status**: Based on 40% passing threshold

### Bulk Operations
- **Excel Upload**: Process multiple marks records at once
- **Batch Tracking**: UUID-based tracking for bulk uploads
- **Error Reporting**: Detailed error reporting for failed records
- **Duplicate Detection**: Prevents duplicate entries

### Statistics and Analytics
- **Class Performance**: Average, highest, lowest marks
- **Grade Distribution**: Count of students in each grade category
- **Pass/Fail Analysis**: Pass percentage and failure analysis
- **Individual Progress**: Student-specific performance tracking

### Data Integrity
- **Validation**: Comprehensive input validation
- **Constraints**: Database-level constraints and indexes
- **Soft Delete**: Marks are deactivated rather than permanently deleted
- **Audit Trail**: Track who created/modified marks and when

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role Authorization**: Granular permission control
- **Input Sanitization**: Protection against injection attacks
- **File Upload Security**: Secure file handling and validation