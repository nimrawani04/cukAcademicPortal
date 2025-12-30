// Student Controller - Handles student-specific operations
const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');

/**
 * Get student dashboard data
 * GET /api/students/dashboard
 */
const getDashboard = async (req, res) => {
    try {
        const studentId = req.user.userId;

        // Get enrolled courses
        const enrolledCourses = await Course.find({
            'enrolledStudents.student': studentId,
            'enrolledStudents.status': 'active'
        })
        .populate('instructor', 'firstName lastName')
        .select('title code credits schedule');

        // Get upcoming assignments
        const upcomingAssignments = await Assignment.find({
            course: { $in: enrolledCourses.map(course => course._id) },
            dueDate: { $gte: new Date() },
            isPublished: true
        })
        .populate('course', 'title code')
        .sort({ dueDate: 1 })
        .limit(5);

        // Get recent grades (assignments with submissions by this student)
        const recentGrades = await Assignment.find({
            'submissions.student': studentId,
            'submissions.grade': { $exists: true }
        })
        .populate('course', 'title code')
        .sort({ 'submissions.gradedAt': -1 })
        .limit(5);

        // Calculate GPA (simplified - you might want a more complex calculation)
        const allGradedAssignments = await Assignment.find({
            'submissions.student': studentId,
            'submissions.grade': { $exists: true }
        });

        let totalPoints = 0;
        let earnedPoints = 0;

        allGradedAssignments.forEach(assignment => {
            const submission = assignment.submissions.find(
                sub => sub.student.toString() === studentId && sub.grade !== undefined
            );
            if (submission) {
                totalPoints += assignment.totalPoints;
                earnedPoints += submission.grade;
            }
        });

        const gpa = totalPoints > 0 ? ((earnedPoints / totalPoints) * 4.0).toFixed(2) : 0;

        res.json({
            success: true,
            data: {
                enrolledCourses,
                upcomingAssignments,
                recentGrades,
                stats: {
                    totalCourses: enrolledCourses.length,
                    upcomingAssignments: upcomingAssignments.length,
                    gpa: parseFloat(gpa)
                }
            }
        });

    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching dashboard data'
        });
    }
};

/**
 * Get student's enrolled courses
 * GET /api/students/courses
 */
const getEnrolledCourses = async (req, res) => {
    try {
        const studentId = req.user.userId;

        const courses = await Course.find({
            'enrolledStudents.student': studentId
        })
        .populate('instructor', 'firstName lastName email')
        .populate('enrolledStudents.student', 'firstName lastName studentId');

        // Filter to get only this student's enrollment info
        const coursesWithEnrollmentInfo = courses.map(course => {
            const enrollment = course.enrolledStudents.find(
                e => e.student._id.toString() === studentId
            );
            
            return {
                ...course.toObject(),
                enrollmentInfo: enrollment
            };
        });

        res.json({
            success: true,
            data: { courses: coursesWithEnrollmentInfo }
        });

    } catch (error) {
        console.error('Get enrolled courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching enrolled courses'
        });
    }
};

/**
 * Get assignments for student's courses
 * GET /api/students/assignments
 */
const getAssignments = async (req, res) => {
    try {
        const studentId = req.user.userId;
        const { status = 'all', courseId } = req.query;

        // Get student's enrolled courses
        let courseQuery = { 'enrolledStudents.student': studentId };
        if (courseId) {
            courseQuery._id = courseId;
        }

        const enrolledCourses = await Course.find(courseQuery);
        const courseIds = enrolledCourses.map(course => course._id);

        // Build assignment query
        let assignmentQuery = {
            course: { $in: courseIds },
            isPublished: true
        };

        // Filter by status
        if (status === 'pending') {
            assignmentQuery.dueDate = { $gte: new Date() };
        } else if (status === 'overdue') {
            assignmentQuery.dueDate = { $lt: new Date() };
        }

        const assignments = await Assignment.find(assignmentQuery)
            .populate('course', 'title code')
            .sort({ dueDate: 1 });

        // Add submission status for each assignment
        const assignmentsWithStatus = assignments.map(assignment => {
            const submission = assignment.submissions.find(
                sub => sub.student.toString() === studentId
            );

            return {
                ...assignment.toObject(),
                submissionStatus: submission ? {
                    submitted: true,
                    submissionDate: submission.submissionDate,
                    grade: submission.grade,
                    feedback: submission.feedback,
                    isLate: submission.isLate
                } : {
                    submitted: false,
                    isOverdue: assignment.isOverdue
                }
            };
        });

        res.json({
            success: true,
            data: { assignments: assignmentsWithStatus }
        });

    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching assignments'
        });
    }
};

/**
 * Submit assignment
 * POST /api/students/assignments/:id/submit
 */
const submitAssignment = async (req, res) => {
    try {
        const assignmentId = req.params.id;
        const studentId = req.user.userId;
        const { comments } = req.body;

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Check if student is enrolled in the course
        const course = await Course.findById(assignment.course);
        const isEnrolled = course.enrolledStudents.some(
            enrollment => enrollment.student.toString() === studentId && enrollment.status === 'active'
        );

        if (!isEnrolled) {
            return res.status(403).json({
                success: false,
                message: 'Not enrolled in this course'
            });
        }

        // Check if already submitted
        const existingSubmission = assignment.submissions.find(
            sub => sub.student.toString() === studentId
        );

        if (existingSubmission) {
            return res.status(400).json({
                success: false,
                message: 'Assignment already submitted'
            });
        }

        // Check if late submission is allowed
        const isLate = new Date() > assignment.dueDate;
        if (isLate && !assignment.allowLateSubmission) {
            return res.status(400).json({
                success: false,
                message: 'Late submissions are not allowed for this assignment'
            });
        }

        // Handle file uploads (if any)
        const files = req.files ? req.files.map(file => ({
            filename: file.originalname,
            filePath: file.path
        })) : [];

        // Create submission
        const submission = {
            student: studentId,
            submissionDate: new Date(),
            files,
            comments,
            isLate
        };

        assignment.submissions.push(submission);
        await assignment.save();

        res.json({
            success: true,
            message: 'Assignment submitted successfully',
            data: { submission }
        });

    } catch (error) {
        console.error('Submit assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while submitting assignment'
        });
    }
};

/**
 * Get student grades
 * GET /api/students/grades
 */
const getGrades = async (req, res) => {
    try {
        const studentId = req.user.userId;
        const { courseId } = req.query;

        // Build query for assignments with student submissions
        let query = {
            'submissions.student': studentId,
            'submissions.grade': { $exists: true }
        };

        if (courseId) {
            query.course = courseId;
        }

        const gradedAssignments = await Assignment.find(query)
            .populate('course', 'title code credits')
            .sort({ 'submissions.gradedAt': -1 });

        // Format grades data
        const grades = gradedAssignments.map(assignment => {
            const submission = assignment.submissions.find(
                sub => sub.student.toString() === studentId
            );

            return {
                assignment: {
                    id: assignment._id,
                    title: assignment.title,
                    type: assignment.type,
                    totalPoints: assignment.totalPoints,
                    dueDate: assignment.dueDate
                },
                course: assignment.course,
                grade: submission.grade,
                percentage: ((submission.grade / assignment.totalPoints) * 100).toFixed(1),
                feedback: submission.feedback,
                gradedAt: submission.gradedAt,
                isLate: submission.isLate
            };
        });

        res.json({
            success: true,
            data: { grades }
        });

    } catch (error) {
        console.error('Get grades error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching grades'
        });
    }
};

module.exports = {
    getDashboard,
    getEnrolledCourses,
    getAssignments,
    submitAssignment,
    getGrades
};