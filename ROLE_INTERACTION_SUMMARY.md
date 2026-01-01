# 🎭 Role-Based System Interaction Guide

## 🏛️ System Overview

The Academic Management Portal now has a complete three-tier role-based system:

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN LEVEL                              │
│  🛡️ Full System Control & User Management                   │
│  • Create/Delete Teachers & Students                        │
│  • View All System Statistics                               │
│  • Approve Student Registrations                            │
│  • Access Admin Dashboard                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   TEACHER LEVEL                             │
│  👨‍🏫 Academic Management & Student Oversight                │
│  • Manage Student Grades & Attendance                       │
│  • Upload/Download Academic Data                            │
│  • View Student Information                                 │
│  • Generate Reports                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   STUDENT LEVEL                             │
│  👨‍🎓 Self-Service Academic Portal                           │
│  • View Personal Grades & Attendance                        │
│  • Register for Courses                                     │
│  • Download Academic Records                                │
│  • Update Personal Information                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Authentication Flow

### 1. Student Authentication
```
Student Registration → Admin Approval → Student Login → Student Dashboard
```
- **Registration**: Self-registration through main portal
- **Approval**: Admin reviews and approves new students
- **Access**: Student portal with limited academic functions

### 2. Teacher Authentication
```
Admin Creates Teacher → Teacher Login → Teacher Dashboard
```
- **Creation**: Only admins can create teacher accounts
- **Access**: Teacher portal with academic management functions
- **Restrictions**: Cannot access admin functions

### 3. Admin Authentication
```
Admin Login → Admin Dashboard → Full System Access
```
- **Access**: Separate admin login portal
- **Privileges**: Complete system control and user management
- **Security**: Highest level authentication required

## 🌐 Portal Access Points

### Main Portal (index.html)
- **URL**: http://localhost:5000
- **Purpose**: Entry point for all users
- **Features**:
  - Student registration form
  - Student/Teacher login buttons
  - Admin portal link in header
  - Role-based dashboard redirection

### Admin Portal (admin-login.html)
- **URL**: http://localhost:5000/admin-login.html
- **Purpose**: Administrator authentication
- **Features**:
  - Secure admin login form
  - Admin credential validation
  - Redirect to admin dashboard

### Admin Dashboard (admin-dashboard.html)
- **URL**: http://localhost:5000/admin-dashboard.html
- **Purpose**: Administrative control center
- **Features**:
  - System statistics overview
  - Student management interface
  - Teacher creation and management
  - User approval/deletion controls

## 🔑 Role Permissions Matrix

| Feature | Student | Teacher | Admin |
|---------|---------|---------|-------|
| **Authentication** |
| Self Registration | ✅ | ❌ | ❌ |
| Login Access | ✅ | ✅ | ✅ |
| **User Management** |
| View Own Profile | ✅ | ✅ | ✅ |
| View All Students | ❌ | ✅ | ✅ |
| View All Teachers | ❌ | ❌ | ✅ |
| Create Teachers | ❌ | ❌ | ✅ |
| Delete Users | ❌ | ❌ | ✅ |
| Approve Students | ❌ | ❌ | ✅ |
| **Academic Data** |
| View Own Grades | ✅ | ❌ | ✅ |
| Manage Student Grades | ❌ | ✅ | ✅ |
| View Attendance | ✅ | ✅ | ✅ |
| Manage Attendance | ❌ | ✅ | ✅ |
| **System Access** |
| Student Dashboard | ✅ | ❌ | ✅ |
| Teacher Dashboard | ❌ | ✅ | ✅ |
| Admin Dashboard | ❌ | ❌ | ✅ |
| System Statistics | ❌ | ❌ | ✅ |

## 🚀 User Journey Examples

### New Student Journey
1. **Registration**: Student visits main portal and registers
2. **Waiting**: Registration pending admin approval
3. **Approval**: Admin reviews and approves student
4. **Login**: Student can now login with credentials
5. **Access**: Student accesses their academic dashboard

### New Teacher Journey
1. **Creation**: Admin creates teacher account through admin dashboard
2. **Notification**: Teacher receives login credentials
3. **Login**: Teacher logs in through main portal
4. **Access**: Teacher accesses academic management tools

### Admin Management Journey
1. **Login**: Admin accesses admin portal
2. **Overview**: Views system statistics and user counts
3. **Management**: Manages students and teachers
4. **Creation**: Creates new teacher accounts as needed
5. **Monitoring**: Monitors system usage and user activity

## 🔒 Security Implementation

### JWT Token System
```javascript
// Token Structure
{
  userId: "user_database_id",
  email: "user@example.com", 
  role: "student|teacher|admin",
  iat: issued_at_timestamp,
  exp: expiration_timestamp
}
```

### Middleware Protection
```javascript
// Admin routes protected by adminAuth middleware
app.use('/api/admin', adminAuth, adminRoutes);

// adminAuth checks:
// 1. Valid JWT token
// 2. Role === 'admin'
// 3. Token not expired
```

### Role Enforcement
- **Database Level**: Role field in User schema
- **API Level**: Middleware validates role on each request
- **Frontend Level**: UI elements shown/hidden based on role
- **Route Level**: Protected routes require specific roles

## 📊 Database Role Structure

### User Collection Schema
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['student', 'teacher', 'admin']),
  createdAt: Date,
  // Additional fields based on role...
}
```

### Role Assignment Rules
- **Default Role**: New registrations get 'student' role
- **Teacher Role**: Only assigned by admin through dashboard
- **Admin Role**: Only created through database script or manual insertion
- **Role Changes**: Not allowed through API (security measure)

## 🧪 Testing Role Interactions

### Test Scenarios

1. **Cross-Role Access Test**
   - Student tries to access teacher dashboard → Blocked
   - Teacher tries to access admin dashboard → Blocked
   - Admin accesses all dashboards → Allowed

2. **API Permission Test**
   - Student calls admin API → 403 Forbidden
   - Teacher calls admin API → 403 Forbidden
   - Admin calls admin API → Success

3. **User Management Test**
   - Student tries to create teacher → Not possible
   - Teacher tries to delete student → Not possible
   - Admin creates/deletes users → Success

### Test Credentials
```
Students:
- demo@student.com / demo123
- test@student.com / test123

Teachers:
- (Created by admin through dashboard)

Admins:
- admin@cukashmir.ac.in / admin123
- dean@cukashmir.ac.in / dean123
```

## 🔄 System Workflow

### Daily Operations
1. **Morning**: Admin checks new student registrations
2. **Approval**: Admin approves legitimate students
3. **Teaching**: Teachers manage grades and attendance
4. **Learning**: Students access their academic data
5. **Management**: Admin monitors system usage

### Periodic Tasks
- **Weekly**: Review user activity and system statistics
- **Monthly**: Clean up inactive accounts
- **Semester**: Bulk operations for new academic periods
- **Yearly**: System maintenance and user role reviews

## 📈 System Benefits

### For Students
- **Self-Service**: Register and manage own academic data
- **Transparency**: Clear view of grades and attendance
- **Accessibility**: 24/7 access to academic information

### For Teachers
- **Efficiency**: Streamlined grade and attendance management
- **Organization**: Centralized student data management
- **Reporting**: Easy generation of academic reports

### For Administrators
- **Control**: Complete system oversight and user management
- **Security**: Role-based access ensures data protection
- **Scalability**: Easy addition of new users and features
- **Monitoring**: Real-time system statistics and user activity

## 🎯 Conclusion

The role-based system provides:
- **Security**: Proper access control and data protection
- **Scalability**: Easy to add new roles and permissions
- **Usability**: Intuitive interfaces for each user type
- **Maintainability**: Clean separation of concerns
- **Flexibility**: Adaptable to changing academic requirements

This system is production-ready and provides a solid foundation for a comprehensive university academic management portal.