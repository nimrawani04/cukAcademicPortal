
# Academic Portal

A full-stack academic portal built with Node.js, Express, and MongoDB using MVC architecture. This system allows students, teachers, and administrators to manage courses, assignments, and academic activities.

## 🚀 Features

### For Students
- User registration and authentication
- Course enrollment
- View assignments and submit work
- Track grades and academic progress
- Dashboard with overview of courses and assignments

### For Teachers
- Create and manage courses
- Create and grade assignments
- View enrolled students
- Send notifications to students

### For Administrators
- Manage all users and courses
- System-wide oversight
- User role management

## 🏗️ Project Structure

```
academic-portal/
├── server/                 # Backend application
│   ├── config/            # Configuration files
│   │   ├── database.js    # Database connection setup
│   │   └── multer.js      # File upload configuration
│   ├── controllers/       # Route handlers (business logic)
│   │   ├── authController.js      # Authentication logic
│   │   ├── courseController.js    # Course management
│   │   └── studentController.js   # Student operations
│   ├── models/            # Database models (schemas)
│   │   ├── User.js        # User model
│   │   ├── Course.js      # Course model
│   │   └── Assignment.js  # Assignment model
│   ├── routes/            # API route definitions
│   │   ├── authRoutes.js      # Authentication routes
│   │   ├── courseRoutes.js    # Course routes
│   │   └── studentRoutes.js   # Student routes
│   ├── middleware/        # Custom middleware functions
│   │   ├── auth.js            # Authentication middleware
│   │   ├── roleMiddleware.js  # Role-based authorization
│   │   ├── errorHandler.js    # Global error handling
│   │   └── logger.js          # Request logging
│   ├── utils/             # Utility functions
│   │   ├── emailService.js    # Email notifications
│   │   ├── validation.js      # Input validation helpers
│   │   └── helpers.js         # Common utility functions
│   ├── uploads/           # File upload storage
│   └── logs/              # Application logs
├── .env                   # Environment variables
├── server.js              # Main application entry point
├── package.json           # Project dependencies
└── README.md              # Project documentation
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Step 1: Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd academic-portal

# Install dependencies
npm install
```

### Step 2: Environment Configuration
Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/academic_portal

# JWT Secret (use a secure random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx
```

### Step 3: Database Setup
Make sure MongoDB is running on your system:

```bash
# For local MongoDB
mongod

# Or use MongoDB Atlas (cloud) by updating MONGODB_URI in .env
```

### Step 4: Start the Application
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Course Endpoints
- `GET /api/courses` - Get all courses (protected)
- `GET /api/courses/:id` - Get course by ID (protected)
- `POST /api/courses` - Create new course (admin only)
- `PUT /api/courses/:id` - Update course (admin/instructor)
- `POST /api/courses/:id/enroll` - Enroll in course (student)

### Student Endpoints
- `GET /api/students/dashboard` - Student dashboard (student only)
- `GET /api/students/courses` - Get enrolled courses (student only)
- `GET /api/students/assignments` - Get assignments (student only)
- `POST /api/students/assignments/:id/submit` - Submit assignment (student only)
- `GET /api/students/grades` - Get grades (student only)

## 🔐 Authentication & Authorization

The system uses JWT (JSON Web Tokens) for authentication and role-based authorization:

### User Roles
- **Student**: Can enroll in courses, submit assignments, view grades
- **Teacher**: Can create courses, manage assignments, grade submissions
- **Admin**: Full system access, user management

### Protected Routes
All API endpoints (except registration and login) require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📁 File Upload

The system supports file uploads for:
- Profile pictures
- Assignment submissions
- Course materials

Supported file types: JPG, JPEG, PNG, PDF, DOC, DOCX
Maximum file size: 5MB (configurable)

## 🔧 Configuration

### Database Models

#### User Model
- Basic information (name, email, password)
- Role-based access (student, teacher, admin)
- Profile picture and contact details
- Account status and timestamps

#### Course Model
- Course details (title, code, description)
- Instructor assignment
- Student enrollment tracking
- Schedule and capacity management

#### Assignment Model
- Assignment information and instructions
- Due dates and grading criteria
- Student submissions and grades
- File attachments support

### Middleware

#### Authentication Middleware
- Verifies JWT tokens
- Attaches user information to requests
- Handles token expiration

#### Role Middleware
- Restricts access based on user roles
- Supports multiple role requirements
- Resource ownership validation

#### Error Handler
- Global error handling
- Standardized error responses
- Development vs production error details

## 🚦 Development

### Running in Development Mode
```bash
npm run dev
```

This starts the server with nodemon for automatic restarts on file changes.

### Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Logging
The application logs all requests and errors:
- Access logs: `server/logs/access-YYYY-MM-DD.log`
- Error logs: `server/logs/error-YYYY-MM-DD.log`
- Security logs: `server/logs/security-YYYY-MM-DD.log`

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- File upload restrictions
- Rate limiting (configurable)
- Security headers with Helmet
- Request logging for monitoring

## 📧 Email Notifications

The system can send email notifications for:
- Welcome emails for new users
- Assignment notifications
- Grade notifications
- Password reset emails

Configure email settings in the `.env` file to enable this feature.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the logs in the `server/logs/` directory
2. Ensure all environment variables are properly set
3. Verify MongoDB connection
4. Check that all dependencies are installed

For additional help, please create an issue in the repository.
=======
# CUK Academic Management Portal

A web-based Academic Management Portal for **Central University of Kashmir**.  
Developed by **Nimra Wani**.  

Live Demo: [CUK Academic Portal](https://nimrawani04.github.io/cukAcademicPortal/)

---

##  Features

###  Registration & Authentication
- **New User Registration** (Student/Faculty)
- Email confirmation & credentials (within 24–48 hrs)
- **Password Reset** with 24-hour expiry links
- **Demo Credentials**:
  - Faculty: `T001 / teacher123`
  - Student: `ST001 / student123`

---

###  Teacher Dashboard
- **Notice Management**
  - Create/manage notices with priority & expiry
  - Example: Mid-Term Exam Schedule, Library Hours Extension
- **Marks Management**
  - Upload/download Excel files (`.xlsx/.xls`, max 10MB)
  - Inline marks editing
- **Attendance**
  - Mark Present, Absent, Late, On Leave
- **Assignments**
  - Create assignments with due date & max marks
  - Example: *CPU Scheduling Algorithms* (Due Jan 20, 2024)
- **Resource Management**
  - Upload notes, presentations, video tutorials (max 50MB)
  - Set access level (All, Department, Class)
- **Leave Management**
  - Review student leave applications (Approve/Reject)

---

###  Student Dashboard
- **Notices**: Prioritized announcements with read/unread status
- **My Courses**: Enrolled courses with grades & attendance
- **My Marks**: Breakdown by CIA, Assignments, Attendance
- **Performance Analytics**
  - GPA trends, subject performance
  - Personalized recommendations
- **Study Goals**
  - Track goals (e.g., target GPA, assignment completion)
- **Resources**
  - Lecture Notes, Presentations, Videos, References
  - Bookmarking support
- **Assignments**
  - View due dates, submission status
- **Library Management**
  - Issued/returned books, overdue fees
  - Search & request books
- **Leave Applications**
  - Apply for leave & check status

---

##  Tech Info
- **Portal Type**: Academic Management
- **Access**: Web-based (hosted via GitHub Pages)
- **Role-based Dashboards**: Separate views for Teachers & Students

---

##  Contact
- **University**: Central University of Kashmir  
- **Location**: Ganderbal, Jammu & Kashmir, India  
- **Phone**: +91 70065 26348  
- **Email**: nimrawani04@cukashmir.edu.in  

---

##  Quick Links
- Academic Calendar  
- Student Handbook  
- Faculty Directory  
- Library Resources  
- Support Center  

---

##  License / Credits
- Developed by **Nimra Wani**
- © Central University of Kashmir  
- Includes: Privacy Policy, Terms of Service, Accessibility
>>>>>>> 1ddf350f2b5a9b0876ebb91118a321eb182dc91f

