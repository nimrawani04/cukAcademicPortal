// Student Routes - Defines API endpoints for student-specific operations
const express = require('express');
const { param, query } = require('express-validator');
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleMiddleware');
const { assignmentUpload } = require('../config/multer');

const router = express.Router();

/**
 * Validation for MongoDB ObjectId parameters
 */
const mongoIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid ID format')
];

/**
 * Validation for query parameters
 */
const assignmentQueryValidation = [
    query('status')
        .optional()
        .isIn(['all', 'pending', 'overdue', 'submitted'])
        .withMessage('Status must be: all, pending, overdue, or submitted'),
    
    query('courseId')
        .optional()
        .isMongoId()
        .withMessage('Invalid course ID format')
];

// All routes require authentication and student role
router.use(authMiddleware);
router.use(roleMiddleware(['student']));

/**
 * GET /api/students/dashboard
 * Get student dashboard with overview data
 * Returns: enrolled courses, upcoming assignments, recent grades, stats
 */
router.get('/dashboard', studentController.getDashboard);

/**
 * GET /api/students/courses
 * Get all courses the student is enrolled in
 * Returns: list of enrolled courses with enrollment details
 */
router.get('/courses', studentController.getEnrolledCourses);

/**
 * GET /api/students/assignments
 * Get assignments for student's enrolled courses
 * Query parameters: status (all|pending|overdue|submitted), courseId
 */
router.get('/assignments', assignmentQueryValidation, studentController.getAssignments);

/**
 * POST /api/students/assignments/:id/submit
 * Submit an assignment with optional file uploads
 * Body: comments (optional)
 * Files: assignment files (optional, multiple allowed)
 */
router.post('/assignments/:id/submit', 
    mongoIdValidation,
    assignmentUpload.array('assignmentFiles', 5), // Allow up to 5 files
    studentController.submitAssignment
);

/**
 * GET /api/students/assignments/:id
 * Get detailed information about a specific assignment
 * Including submission status and feedback if available
 */
router.get('/assignments/:id', 
    mongoIdValidation,
    async (req, res) => {
        try {
            const Assignment = require('../models/Assignment');
            const Course = require('../models/Course');
            const studentId = req.user.userId;

            const assignment = await Assignment.findById(req.params.id)
                .populate('course', 'title code');

            if (!assignment) {
                return res.status(404).json({
                    success: false,
                    message: 'Assignment not found'
                });
            }

            // Check if student is enrolled in the course
            const course = await Course.findById(assignment.course._id);
            const isEnrolled = course.enrolledStudents.some(
                enrollment => enrollment.student.toString() === studentId
            );

            if (!isEnrolled) {
                return res.status(403).json({
                    success: false,
                    message: 'Not enrolled in this course'
                });
            }

            // Get student's submission if exists
            const submission = assignment.submissions.find(
                sub => sub.student.toString() === studentId
            );

            // Prepare response data
            const assignmentData = {
                ...assignment.toObject(),
                submissionStatus: submission ? {
                    submitted: true,
                    submissionDate: submission.submissionDate,
                    files: submission.files,
                    comments: submission.comments,
                    grade: submission.grade,
                    feedback: submission.feedback,
                    isLate: submission.isLate,
                    gradedAt: submission.gradedAt
                } : {
                    submitted: false,
                    canSubmit: assignment.isPublished && (assignment.allowLateSubmission || !assignment.isOverdue)
                }
            };

            // Remove other students' submissions for privacy
            delete assignmentData.submissions;

            res.json({
                success: true,
                data: { assignment: assignmentData }
            });

        } catch (error) {
            console.error('Get assignment details error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching assignment details'
            });
        }
    }
);

/**
 * GET /api/students/grades
 * Get all grades for the student
 * Query parameters: courseId (optional) - filter by specific course
 */
router.get('/grades', 
    [
        query('courseId')
            .optional()
            .isMongoId()
            .withMessage('Invalid course ID format')
    ],
    studentController.getGrades
);

/**
 * GET /api/students/transcript
 * Get student's academic transcript with GPA calculation
 */
router.get('/transcript', async (req, res) => {
    try {
        const studentId = req.user.userId;
        const Assignment = require('../models/Assignment');
        const Course = require('../models/Course');

        // Get all courses the student has been enrolled in
        const allCourses = await Course.find({
            'enrolledStudents.student': studentId
        }).populate('instructor', 'firstName lastName');

        // Get all graded assignments for the student
        const gradedAssignments = await Assignment.find({
            'submissions.student': studentId,
            'submissions.grade': { $exists: true }
        }).populate('course', 'title code credits');

        // Calculate grades by course
        const courseGrades = {};
        
        gradedAssignments.forEach(assignment => {
            const courseId = assignment.course._id.toString();
            const submission = assignment.submissions.find(
                sub => sub.student.toString() === studentId
            );

            if (!courseGrades[courseId]) {
                courseGrades[courseId] = {
                    course: assignment.course,
                    assignments: [],
                    totalPoints: 0,
                    earnedPoints: 0
                };
            }

            courseGrades[courseId].assignments.push({
                title: assignment.title,
                type: assignment.type,
                totalPoints: assignment.totalPoints,
                earnedPoints: submission.grade,
                percentage: ((submission.grade / assignment.totalPoints) * 100).toFixed(1)
            });

            courseGrades[courseId].totalPoints += assignment.totalPoints;
            courseGrades[courseId].earnedPoints += submission.grade;
        });

        // Calculate course GPAs and overall GPA
        let totalCredits = 0;
        let totalGradePoints = 0;

        const transcript = Object.values(courseGrades).map(courseData => {
            const percentage = courseData.totalPoints > 0 
                ? (courseData.earnedPoints / courseData.totalPoints) * 100 
                : 0;
            
            // Convert percentage to GPA (4.0 scale)
            let gradePoint = 0;
            let letterGrade = 'F';
            
            if (percentage >= 97) { gradePoint = 4.0; letterGrade = 'A+'; }
            else if (percentage >= 93) { gradePoint = 4.0; letterGrade = 'A'; }
            else if (percentage >= 90) { gradePoint = 3.7; letterGrade = 'A-'; }
            else if (percentage >= 87) { gradePoint = 3.3; letterGrade = 'B+'; }
            else if (percentage >= 83) { gradePoint = 3.0; letterGrade = 'B'; }
            else if (percentage >= 80) { gradePoint = 2.7; letterGrade = 'B-'; }
            else if (percentage >= 77) { gradePoint = 2.3; letterGrade = 'C+'; }
            else if (percentage >= 73) { gradePoint = 2.0; letterGrade = 'C'; }
            else if (percentage >= 70) { gradePoint = 1.7; letterGrade = 'C-'; }
            else if (percentage >= 67) { gradePoint = 1.3; letterGrade = 'D+'; }
            else if (percentage >= 65) { gradePoint = 1.0; letterGrade = 'D'; }

            const credits = courseData.course.credits;
            totalCredits += credits;
            totalGradePoints += gradePoint * credits;

            return {
                course: courseData.course,
                letterGrade,
                gradePoint,
                percentage: percentage.toFixed(1),
                assignments: courseData.assignments
            };
        });

        const overallGPA = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;

        res.json({
            success: true,
            data: {
                transcript,
                summary: {
                    totalCredits,
                    overallGPA: parseFloat(overallGPA),
                    totalCourses: transcript.length
                }
            }
        });

    } catch (error) {
        console.error('Get transcript error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating transcript'
        });
    }
});

module.exports = router;