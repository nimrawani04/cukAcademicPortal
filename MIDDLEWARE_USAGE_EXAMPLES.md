# Role-Based Middleware Usage Examples

This document provides comprehensive examples of how to use the role-based middleware to protect routes in the Academic Portal system.

## 🔐 Available Middleware Functions

### Basic Role Middleware
- `roleMiddleware(['role1', 'role2'])` - Allow specific roles
- `facultyOnly` - Faculty only access
- `adminOnly` - Admin only access
- `studentOnly` - Student only access
- `facultyOrAdmin` - Faculty or Admin access

### Permission-Based Middleware
- `canUploadMarksAttendance` - Faculty can upload marks/attendance for their courses
- `canUploadNotices` - Faculty and Admin can upload notices
- `canApproveRegistrations` - Admin can approve registrations

### Data Protection Middleware
- `protectStudentData` - Students can only access their own data
- `verifyCourseEnrollment` - Students must be enrolled in course
- `verifyFacultyCourseOwnership` - Faculty must teach the course

### Resource Ownership Middleware
- `resourceOwnership(param, model, field)` - Check resource ownership

## 📝 Usage Examples

### 1. Faculty-Only Routes (Marks & Attendance Upload)

```javascript
// Only faculty can upload marks for their courses
router.post('/marks/upload', 
    authMiddleware,                    // ✅ Must be authenticated
    canUploadMarksAttendance,         // ✅ Must be faculty teaching the course
    uploadMarksValidation,
    marksController.uploadMarks
);

// Only faculty can upload attendance for their courses
router.post('/attendance/upload', 
    authMiddleware,                    // ✅ Must be authenticated
    canUploadMarksAttendance,         // ✅ Must be faculty teaching the course
    uploadAttendanceValidation,
    attendanceController.uploadAttendance
);
```

### 2. Student Data Protection

```javascript
// Students can only view their own marks
router.get('/marks/student/:studentId',
    authMiddleware,                    // ✅ Must be authenticated
    protectStudentData,               // ✅ Students can only access own data
    marksController.getStudentMarks
);

// Students can only view their own attendance
router.get('/attendance/student/:studentId',
    authMiddleware,                    // ✅ Must be authenticated
    protectStudentData,               // ✅ Students can only access own data
    attendanceController.getStudentAttendance
);
```

### 3. Course Enrollment Verification

```javascript
// Students must be enrolled in course to view course data
router.get('/courses/:courseId/materials',
    authMiddleware,                    // ✅ Must be authenticated
    verifyCourseEnrollment,           // ✅ Must be enrolled in course
    courseController.getCourseMaterials
);

// Students can only submit assignments for enrolled courses
router.post('/assignments/:assignmentId/submit',
    authMiddleware,                    // ✅ Must be authenticated
    verifyCourseEnrollment,           // ✅ Must be enrolled in course
    assignmentController.submitAssignment
);
```

### 4. Admin-Only Registration Approval

```javascript
// Only admin can approve registrations
router.post('/admin/registrations/:userId/approve',
    authMiddleware,                    // ✅ Must be authenticated
    canApproveRegistrations,          // ✅ Must be admin
    adminController.approveRegistration
);

// Only admin can reject registrations
router.post('/admin/registrations/:userId/reject',
    authMiddleware,                    // ✅ Must be authenticated
    canApproveRegistrations,          // ✅ Must be admin
    adminController.rejectRegistration
);
```

### 5. Notice Upload Permissions

```javascript
// Faculty and admin can create notices
router.post('/notices',
    authMiddleware,                    // ✅ Must be authenticated
    canUploadNotices,                 // ✅ Must be faculty or admin
    noticeController.createNotice
);
```

### 6. Faculty Course Ownership

```javascript
// Faculty can only modify courses they teach
router.put('/courses/:courseId/update',
    authMiddleware,                    // ✅ Must be authenticated
    verifyFacultyCourseOwnership,     // ✅ Must teach this course
    courseController.updateCourse
);

// Faculty can only view detailed stats for their courses
router.get('/courses/:courseId/statistics',
    authMiddleware,                    // ✅ Must be authenticated
    verifyFacultyCourseOwnership,     // ✅ Must teach this course
    courseController.getCourseStatistics
);
```

### 7. Multiple Middleware Combinations

```javascript
// Complex example: Faculty updating marks for their course
router.put('/marks/course/:courseId/assignment/:assignmentId',
    authMiddleware,                    // ✅ Must be authenticated
    roleMiddleware(['faculty']),       // ✅ Must be faculty
    verifyFacultyCourseOwnership,     // ✅ Must teach this course
    validateMarkUpdate,               // ✅ Validate input data
    marksController.updateCourseMarks
);

// Student viewing their own course attendance
router.get('/attendance/my-courses/:courseId',
    authMiddleware,                    // ✅ Must be authenticated
    studentOnly,                      // ✅ Must be student
    verifyCourseEnrollment,           // ✅ Must be enrolled in course
    attendanceController.getMyAttendance
);
```

## 🎯 Real-World API Endpoint Examples

### Faculty Workflow
```bash
# 1. Faculty logs in
POST /api/auth/faculty/login
{
  "email": "faculty@university.edu",
  "password": "SecurePass123!"
}

# 2. Faculty uploads marks (protected by canUploadMarksAttendance)
POST /api/marks/upload
Authorization: Bearer <faculty-jwt-token>
{
  "courseId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "assignmentId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "marks": [
    {
      "studentId": "64f8a1b2c3d4e5f6a7b8c9d2",
      "grade": 85,
      "feedback": "Good work!"
    }
  ]
}

# 3. Faculty uploads attendance (protected by canUploadMarksAttendance)
POST /api/attendance/upload
Authorization: Bearer <faculty-jwt-token>
{
  "courseId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "date": "2024-01-15",
  "sessionType": "lecture",
  "attendance": [
    {
      "studentId": "64f8a1b2c3d4e5f6a7b8c9d2",
      "status": "present"
    }
  ]
}

# 4. Faculty creates notice (protected by canUploadNotices)
POST /api/notices
Authorization: Bearer <faculty-jwt-token>
{
  "title": "Assignment Due Reminder",
  "content": "Please submit your assignments by Friday.",
  "type": "academic",
  "priority": "medium"
}
```

### Student Workflow
```bash
# 1. Student logs in
POST /api/auth/student/login
{
  "email": "student@university.edu",
  "password": "SecurePass123!"
}

# 2. Student views their own marks (protected by protectStudentData)
GET /api/marks/student/64f8a1b2c3d4e5f6a7b8c9d2
Authorization: Bearer <student-jwt-token>

# 3. Student views course marks (protected by verifyCourseEnrollment)
GET /api/marks/course/64f8a1b2c3d4e5f6a7b8c9d0
Authorization: Bearer <student-jwt-token>

# 4. Student views their attendance (protected by protectStudentData)
GET /api/attendance/student/64f8a1b2c3d4e5f6a7b8c9d2
Authorization: Bearer <student-jwt-token>

# 5. Student views notices (automatically filtered by role)
GET /api/notices
Authorization: Bearer <student-jwt-token>
```

### Admin Workflow
```bash
# 1. Admin logs in
POST /api/auth/admin/login
{
  "email": "admin@university.edu",
  "password": "SecurePass123!"
}

# 2. Admin views pending registrations (protected by canApproveRegistrations)
GET /api/admin/registrations/pending
Authorization: Bearer <admin-jwt-token>

# 3. Admin approves registration (protected by canApproveRegistrations)
POST /api/admin/registrations/64f8a1b2c3d4e5f6a7b8c9d3/approve
Authorization: Bearer <admin-jwt-token>
{
  "comments": "Registration approved after verification"
}

# 4. Admin views all users (protected by adminOnly)
GET /api/admin/users
Authorization: Bearer <admin-jwt-token>

# 5. Admin deactivates user (protected by adminOnly)
POST /api/admin/users/64f8a1b2c3d4e5f6a7b8c9d4/deactivate
Authorization: Bearer <admin-jwt-token>
{
  "reason": "Policy violation"
}
```

## 🚫 Access Denied Examples

### What Happens When Access is Denied

```bash
# Student trying to upload marks (DENIED - not faculty)
POST /api/marks/upload
Authorization: Bearer <student-jwt-token>
# Response: 403 Forbidden
{
  "success": false,
  "message": "Access denied. Only faculty can upload marks and attendance.",
  "code": "FACULTY_REQUIRED"
}

# Student trying to view another student's data (DENIED - not own data)
GET /api/marks/student/64f8a1b2c3d4e5f6a7b8c9d5
Authorization: Bearer <student-jwt-token> # Student ID: 64f8a1b2c3d4e5f6a7b8c9d2
# Response: 403 Forbidden
{
  "success": false,
  "message": "Access denied. Students can only access their own data.",
  "code": "DATA_ACCESS_VIOLATION"
}

# Faculty trying to approve registrations (DENIED - not admin)
POST /api/admin/registrations/64f8a1b2c3d4e5f6a7b8c9d3/approve
Authorization: Bearer <faculty-jwt-token>
# Response: 403 Forbidden
{
  "success": false,
  "message": "Access denied. Only administrators can approve registrations.",
  "code": "ADMIN_REQUIRED"
}

# Student trying to access course they're not enrolled in (DENIED - not enrolled)
GET /api/marks/course/64f8a1b2c3d4e5f6a7b8c9d6
Authorization: Bearer <student-jwt-token>
# Response: 403 Forbidden
{
  "success": false,
  "message": "Access denied. You must be enrolled in this course.",
  "code": "COURSE_ACCESS_DENIED"
}
```

## 🔧 Custom Middleware Implementation

### Creating Custom Role-Based Middleware

```javascript
// Custom middleware for department heads
const departmentHeadOnly = async (req, res, next) => {
    try {
        if (req.user.role !== 'faculty') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Faculty role required.',
                code: 'FACULTY_REQUIRED'
            });
        }

        const Faculty = require('../models/Faculty');
        const faculty = await Faculty.findById(req.user.userId);
        
        if (!faculty || faculty.designation !== 'Department Head') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Department Head privileges required.',
                code: 'DEPARTMENT_HEAD_REQUIRED'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during authorization check.',
            code: 'AUTH_SERVER_ERROR'
        });
    }
};

// Usage
router.get('/department/reports',
    authMiddleware,
    departmentHeadOnly,
    reportController.getDepartmentReports
);
```

## 📊 Security Logging

All middleware functions automatically log security events:

```javascript
// Successful access
console.log('✅ Faculty uploaded marks for course CS101');

// Access denied
securityLogger('UNAUTHORIZED_ACCESS_ATTEMPT', req, {
    userId: req.user.userId,
    userRole: 'student',
    requiredRoles: ['faculty'],
    endpoint: '/api/marks/upload',
    method: 'POST'
});
```

## 🎯 Best Practices

1. **Always use authMiddleware first** - Ensure user is authenticated
2. **Layer middleware logically** - Auth → Role → Ownership → Validation
3. **Use specific middleware** - Don't use generic role checks when specific ones exist
4. **Handle errors gracefully** - Provide clear error messages with codes
5. **Log security events** - Track unauthorized access attempts
6. **Test thoroughly** - Verify all permission combinations work correctly

This middleware system ensures that:
- ✅ **Faculty can only upload marks/attendance for their courses**
- ✅ **Students can only view their own data**
- ✅ **Admin can approve registrations**
- ✅ **All access is properly logged and secured**
- ✅ **Clear error messages guide users**