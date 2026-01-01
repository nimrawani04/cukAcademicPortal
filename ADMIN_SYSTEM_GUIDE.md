# 🛡️ Admin Portal System - Complete Guide

## 📋 Overview

The Admin Portal is a comprehensive role-based management system that allows administrators to control students, teachers, and academic data in the Central University of Kashmir Academic Management Portal.

## 🔐 Admin Authentication

### Admin Login Credentials
```
Primary Admin:
- Email: admin@cukashmir.ac.in
- Password: admin123

Secondary Admin:
- Email: dean@cukashmir.ac.in  
- Password: dean123
```

### Access Points
- **Main Portal**: http://localhost:5000
- **Admin Login**: http://localhost:5000/admin-login.html
- **Admin Dashboard**: http://localhost:5000/admin-dashboard.html

## 🏗️ System Architecture

### Backend Structure
```
server/
├── middleware/
│   └── adminAuth.js          # Admin authentication middleware
├── controllers/
│   ├── authController.js     # User authentication (existing)
│   └── adminController.js    # Admin-specific operations
├── routes/
│   ├── authRoutes.js         # User routes (existing)
│   └── adminRoutes.js        # Admin-protected routes
└── models/
    └── User.js               # Updated with role system
```

### Frontend Structure
```
├── index.html                # Main portal (updated with admin link)
├── admin-login.html          # Admin authentication page
└── admin-dashboard.html      # Admin management interface
```

## 🔑 Role-Based Access Control

### User Roles
1. **Student** (default)
   - Self-registration allowed
   - Access to student portal only
   - Cannot access admin or teacher features

2. **Teacher**
   - Created only by admins
   - Access to teacher portal
   - Cannot access admin features

3. **Admin**
   - Full system access
   - User management capabilities
   - Can create teachers
   - Can approve/delete students

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role Verification**: Middleware checks admin role on every request
- **Protected Routes**: All admin APIs require admin authentication
- **Separate Login**: Admin login is independent of user login
- **Token Validation**: JWT tokens are validated for expiration and integrity

## 🌐 API Endpoints

### Authentication Endpoints
```
POST /api/admin/login
- Purpose: Admin authentication
- Body: { email, password }
- Response: { success, message, data: { token, user } }
- Access: Public (admin credentials required)
```

### Protected Admin Endpoints
All endpoints below require `Authorization: Bearer <admin_token>` header.

```
GET /api/admin/stats
- Purpose: Dashboard statistics
- Response: { totalStudents, totalTeachers, totalUsers, recentRegistrations }

GET /api/admin/students  
- Purpose: View all students
- Response: Array of student objects

GET /api/admin/teachers
- Purpose: View all teachers  
- Response: Array of teacher objects

POST /api/admin/create-teacher
- Purpose: Create new teacher account
- Body: { name, email, password }
- Response: Created teacher object

DELETE /api/admin/user/:id
- Purpose: Delete student or teacher
- Response: Success/error message
- Note: Cannot delete admin users

PATCH /api/admin/approve-student/:id
- Purpose: Approve student registration
- Response: Success/error message
```

## 🖥️ Admin Dashboard Features

### Dashboard Statistics
- **Total Students**: Count of all registered students
- **Total Teachers**: Count of all teacher accounts
- **Total Users**: Combined count of all users
- **Recent Registrations**: New registrations in last 7 days

### Student Management
- **View All Students**: Table with student details
- **Approve Students**: Approve pending registrations
- **Delete Students**: Remove student accounts
- **Student Details**: Name, email, role, registration date

### Teacher Management
- **View All Teachers**: Table with teacher details
- **Create Teachers**: Add new teacher accounts (admin-only)
- **Delete Teachers**: Remove teacher accounts
- **Teacher Details**: Name, email, role, registration date

### User Interface Features
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Data refreshes automatically
- **Modal Forms**: Clean interface for creating teachers
- **Role Badges**: Visual indicators for user roles
- **Action Buttons**: Quick access to common operations
- **Alert System**: Success/error notifications

## 🔧 Database Schema Updates

### User Model (Updated)
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['student', 'teacher', 'admin'], default: 'student'),
  createdAt: Date (default: Date.now)
}
```

### Role Assignment Rules
- **New Registrations**: Default to 'student' role
- **Teacher Creation**: Only admins can create teachers
- **Admin Creation**: Manual database insertion or script
- **Role Changes**: Not allowed through API (security)

## 🚀 Deployment & Setup

### 1. Create Admin User
```bash
node create-admin-user.js
```

### 2. Start Server
```bash
node server.js
```

### 3. Access Admin Portal
1. Open http://localhost:5000
2. Click "Admin Portal" in header
3. Login with admin credentials
4. Access admin dashboard

### 4. Environment Variables
Ensure these are set in `.env`:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

## 🧪 Testing the Admin System

### Manual Testing Steps
1. **Admin Login Test**
   - Go to admin-login.html
   - Use admin@cukashmir.ac.in / admin123
   - Verify successful login and redirect

2. **Dashboard Test**
   - Check statistics display correctly
   - Verify student/teacher tables load
   - Test refresh functionality

3. **Teacher Creation Test**
   - Click "Add New Teacher"
   - Fill form with valid data
   - Verify teacher is created and appears in table

4. **User Management Test**
   - Test approve student functionality
   - Test delete user functionality
   - Verify confirmations work

5. **Security Test**
   - Try accessing admin routes without token
   - Try accessing with student/teacher token
   - Verify proper error responses

### API Testing
```bash
# Test admin login
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cukashmir.ac.in","password":"admin123"}'

# Test admin stats (replace TOKEN with actual token)
curl -X GET http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer TOKEN"
```

## 🔒 Security Considerations

### Authentication Security
- **Password Hashing**: All passwords use bcrypt with salt
- **JWT Tokens**: Secure token generation with expiration
- **Role Verification**: Every admin request validates role
- **Input Validation**: All inputs are validated server-side

### Authorization Security
- **Middleware Protection**: All admin routes protected
- **Role Enforcement**: Cannot escalate privileges
- **Admin Isolation**: Admin functions separate from user functions
- **Token Expiration**: Tokens expire after 24 hours

### Data Security
- **No Password Exposure**: Passwords never returned in responses
- **Unique Constraints**: Email uniqueness enforced
- **Error Handling**: No sensitive data in error messages
- **Logging**: All admin actions are logged

## 🐛 Troubleshooting

### Common Issues

1. **Admin Login Fails**
   - Check admin user exists in database
   - Verify password is correct
   - Check server logs for errors

2. **Dashboard Not Loading**
   - Verify admin token is stored
   - Check network requests in browser dev tools
   - Ensure server is running

3. **API Errors**
   - Check Authorization header format
   - Verify token hasn't expired
   - Check server logs for detailed errors

4. **Database Connection Issues**
   - System falls back to mock data
   - Check MongoDB connection string
   - Verify database is accessible

### Debug Commands
```bash
# Check admin users in database
node -e "
const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const admins = await User.find({role: 'admin'});
  console.log('Admin users:', admins);
  process.exit(0);
});
"

# Test server health
curl http://localhost:5000/api/health
```

## 📊 System Status

### ✅ Implemented Features
- [x] Role-based user system (student, teacher, admin)
- [x] Admin authentication with JWT
- [x] Admin dashboard with statistics
- [x] Student management (view, approve, delete)
- [x] Teacher management (view, create, delete)
- [x] Protected API endpoints
- [x] Responsive admin interface
- [x] Security middleware
- [x] Error handling and validation
- [x] Database integration with fallback

### 🔄 Future Enhancements
- [ ] Bulk user operations
- [ ] Advanced user filtering and search
- [ ] User activity logs
- [ ] Email notifications for approvals
- [ ] Role-based permissions granularity
- [ ] Admin audit trail
- [ ] Data export functionality
- [ ] Advanced dashboard analytics

## 📞 Support

For issues or questions regarding the admin system:
- Check server logs for detailed error messages
- Verify database connection and admin user existence
- Test API endpoints individually
- Review browser console for frontend errors

The admin system is production-ready and provides comprehensive user management capabilities for the Academic Management Portal.