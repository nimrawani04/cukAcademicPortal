# Registration Workflow Documentation

This document outlines the complete registration workflow implemented in the Academic Portal system.

## 🔄 Registration Workflow Overview

### 1. User Registration (Pending Status)
- New users register through `/api/auth/register`
- Account is created with `isActive: false` and `registrationStatus: 'pending'`
- User receives confirmation email about pending approval
- Admins are notified about new registration

### 2. Admin Review Process
- Admins can view pending registrations via `/api/admin/registrations/pending`
- Admins can approve or reject registrations
- Email notifications are sent to users upon approval/rejection

### 3. User Login Access
- Only approved users (`registrationStatus: 'approved'`) can log in
- Pending users receive specific error messages
- Rejected users are informed about their status

## 📋 Registration States

| Status | Description | Can Login | Email Verified | Account Active |
|--------|-------------|-----------|----------------|----------------|
| `pending` | Awaiting admin approval | ❌ No | ❌ No | ❌ No |
| `approved` | Admin approved registration | ✅ Yes | ✅ Yes | ✅ Yes |
| `rejected` | Admin rejected registration | ❌ No | ❌ No | ❌ No |

## 🚀 API Endpoints

### Registration Endpoints

#### 1. User Registration
```bash
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@university.edu",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "role": "student",
  "rollNumber": "CS2024001",
  "course": "Computer Science Engineering",
  "year": 2
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Registration submitted successfully. Your account is pending approval by an administrator.",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@university.edu",
      "role": "student",
      "registrationStatus": "pending",
      "isActive": false
    },
    "status": "pending",
    "nextSteps": [
      "Your registration has been submitted for review",
      "An administrator will review your application",
      "You will receive an email notification once your account is approved",
      "After approval, you can log in with your credentials"
    ]
  }
}
```

#### 2. Check Registration Status
```bash
POST /api/registration/check-status
Content-Type: application/json

{
  "email": "john.doe@university.edu"
}
```

**Response (Pending):**
```json
{
  "success": true,
  "data": {
    "email": "john.doe@university.edu",
    "name": "John Doe",
    "role": "student",
    "registrationDate": "2024-01-15T10:30:00.000Z",
    "status": "pending",
    "message": "Your registration is pending approval by an administrator",
    "canLogin": false,
    "nextSteps": [
      "Your registration is being reviewed",
      "You will receive an email notification once approved",
      "Please wait for administrator approval"
    ],
    "daysSinceRegistration": 3
  }
}
```

#### 3. Resend Confirmation Email
```bash
POST /api/registration/resend-confirmation
Content-Type: application/json

{
  "email": "john.doe@university.edu"
}
```

### Admin Endpoints

#### 1. View Pending Registrations
```bash
GET /api/admin/registrations/pending?page=1&limit=10&role=student
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "registrations": [
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "firstName": "John",
        "lastName": "Doe",
        "fullName": "John Doe",
        "email": "john.doe@university.edu",
        "phone": "+1234567890",
        "role": "student",
        "registrationStatus": "pending",
        "registrationDate": "2024-01-15T10:30:00.000Z",
        "daysSinceRegistration": 3,
        "rollNumber": "CS2024001",
        "course": "Computer Science Engineering",
        "year": 2
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalRegistrations": 1,
      "hasNext": false,
      "hasPrev": false
    },
    "summary": {
      "totalPending": 1,
      "byRole": [
        { "_id": "student", "count": 1 }
      ]
    }
  }
}
```

#### 2. Approve Registration
```bash
POST /api/admin/registrations/64f8a1b2c3d4e5f6a7b8c9d0/approve
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "comments": "Registration approved after verification of documents"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration approved successfully",
  "data": {
    "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userEmail": "john.doe@university.edu",
    "userRole": "student",
    "userName": "John Doe",
    "approvedAt": "2024-01-18T14:20:00.000Z",
    "approvedBy": "Admin User",
    "comments": "Registration approved after verification of documents"
  }
}
```

#### 3. Reject Registration
```bash
POST /api/admin/registrations/64f8a1b2c3d4e5f6a7b8c9d0/reject
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "reason": "Invalid roll number format. Please provide a valid roll number."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration rejected successfully",
  "data": {
    "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userEmail": "john.doe@university.edu",
    "userRole": "student",
    "userName": "John Doe",
    "rejectionReason": "Invalid roll number format. Please provide a valid roll number.",
    "rejectedAt": "2024-01-18T14:25:00.000Z",
    "rejectedBy": "Admin User"
  }
}
```

#### 4. Bulk Approve Registrations
```bash
POST /api/admin/registrations/bulk-approve
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "userIds": [
    "64f8a1b2c3d4e5f6a7b8c9d0",
    "64f8a1b2c3d4e5f6a7b8c9d1"
  ],
  "comments": "Bulk approval after document verification"
}
```

### Login Behavior

#### 1. Pending User Login Attempt
```bash
POST /api/auth/student/login
Content-Type: application/json

{
  "email": "john.doe@university.edu",
  "password": "SecurePass123!"
}
```

**Response (Pending):**
```json
{
  "success": false,
  "message": "Your registration is still pending approval. Please wait for administrator approval.",
  "code": "REGISTRATION_PENDING"
}
```

#### 2. Rejected User Login Attempt
```bash
POST /api/auth/student/login
Content-Type: application/json

{
  "email": "rejected.user@university.edu",
  "password": "SecurePass123!"
}
```

**Response (Rejected):**
```json
{
  "success": false,
  "message": "Your registration has been rejected. Please contact administrator for more information.",
  "code": "REGISTRATION_REJECTED"
}
```

#### 3. Approved User Login
```bash
POST /api/auth/student/login
Content-Type: application/json

{
  "email": "approved.user@university.edu",
  "password": "SecurePass123!"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "firstName": "John",
      "lastName": "Doe",
      "email": "approved.user@university.edu",
      "role": "student",
      "registrationStatus": "approved",
      "isActive": true,
      "isEmailVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

## 📧 Email Notifications

### 1. Registration Confirmation Email
**Sent to:** User upon registration  
**Subject:** Registration Submitted - Pending Approval  
**Content:** Confirms registration submission and explains next steps

### 2. Admin Notification Email
**Sent to:** All active admins  
**Subject:** New [Role] Registration Pending Approval  
**Content:** Notifies about new registration requiring review

### 3. Approval Email
**Sent to:** User upon approval  
**Subject:** Registration Approved - Welcome to Academic Portal!  
**Content:** Welcomes user and provides login instructions

### 4. Rejection Email
**Sent to:** User upon rejection  
**Subject:** Registration Update - Academic Portal  
**Content:** Explains rejection reason and next steps

## 🔧 Database Schema Changes

### User Model Updates
```javascript
// New fields added to User schema
{
  isActive: { type: Boolean, default: false },  // Changed default to false
  registrationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  registrationDate: { type: Date, default: Date.now },
  approvalRequired: { type: Boolean, default: true },
  approvedBy: { type: ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  approvalComments: { type: String, maxlength: 500 },
  rejectedBy: { type: ObjectId, ref: 'User' },
  rejectedAt: { type: Date },
  rejectionReason: { type: String, maxlength: 500 }
}
```

## 🎯 Workflow Examples

### Complete Student Registration Flow

1. **Student Registers:**
   ```bash
   POST /api/auth/register
   # Creates pending registration
   ```

2. **Student Checks Status:**
   ```bash
   POST /api/registration/check-status
   # Returns "pending" status
   ```

3. **Student Tries to Login:**
   ```bash
   POST /api/auth/student/login
   # Returns "REGISTRATION_PENDING" error
   ```

4. **Admin Reviews Registration:**
   ```bash
   GET /api/admin/registrations/pending
   # Views pending registrations
   ```

5. **Admin Approves Registration:**
   ```bash
   POST /api/admin/registrations/{userId}/approve
   # Approves registration, sends email
   ```

6. **Student Can Now Login:**
   ```bash
   POST /api/auth/student/login
   # Successful login with tokens
   ```

### Admin Dashboard Statistics

```bash
GET /api/registration/statistics
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 150,
      "pending": 12,
      "approved": 130,
      "rejected": 8,
      "recent": 25,
      "approvalRate": "94.2"
    },
    "byRole": {
      "student": 120,
      "faculty": 25,
      "admin": 5
    },
    "byStatus": {
      "pending": 12,
      "approved": 130,
      "rejected": 8
    },
    "dailyTrend": [
      { "_id": "2024-01-15", "count": 5 },
      { "_id": "2024-01-16", "count": 8 },
      { "_id": "2024-01-17", "count": 3 }
    ]
  }
}
```

## 🛡️ Security Features

1. **Pending by Default:** All new registrations are inactive until approved
2. **Admin-Only Approval:** Only admins can approve/reject registrations
3. **Audit Trail:** All approval/rejection actions are logged with admin details
4. **Email Notifications:** Users and admins are notified of status changes
5. **Status Validation:** Login attempts validate registration status
6. **Bulk Operations:** Admins can efficiently process multiple registrations

## 🎨 Frontend Integration

### Registration Form
- Show clear messaging about approval process
- Provide status checking functionality
- Display next steps after registration

### Login Form
- Handle different error codes appropriately
- Show specific messages for pending/rejected users
- Provide links to status checking

### Admin Dashboard
- Display pending registrations count
- Provide bulk approval functionality
- Show registration statistics and trends
- Enable filtering by role and status

This workflow ensures that only approved users can access the system while providing a smooth experience for both users and administrators.