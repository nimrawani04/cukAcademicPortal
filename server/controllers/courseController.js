// Course Controller - Handles course-related operations
const Course = require('../models/Course');
const User = require('../models/User');
const { validationResult } = require('express-validator');

/**
 * Get all courses with pagination and filtering
 * GET /api/courses
 */
const getAllCourses = async (req, res) => {
    try {
        const { page = 1, limit = 10, department, search } = req.query;
        
        // Build query object
        let query = { isActive: true };
        
        // Add department filter if provided
        if (department) {
            query.department = department;
        }
        
        // Add search functionality
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Execute query with pagination
        const courses = await Course.find(query)
            .populate('instructor', 'firstName lastName email')
            .populate('enrolledStudents.student', 'firstName lastName studentId')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        // Get total count for pagination
        const total = await Course.countDocuments(query);

        res.json({
            success: true,
            data: {
                courses,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalCourses: total,
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching courses'
        });
    }
};

/**
 * Get single course by ID
 * GET /api/courses/:id
 */
const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'firstName lastName email phone')
            .populate('enrolledStudents.student', 'firstName lastName studentId email');

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.json({
            success: true,
            data: { course }
        });

    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching course'
        });
    }
};

/**
 * Create new course (Admin/Teacher only)
 * POST /api/courses
 */
const createCourse = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            title,
            code,
            description,
            credits,
            department,
            instructor,
            schedule,
            startDate,
            endDate,
            maxEnrollment
        } = req.body;

        // Verify instructor exists and is a teacher
        const instructorUser = await User.findById(instructor);
        if (!instructorUser || instructorUser.role !== 'teacher') {
            return res.status(400).json({
                success: false,
                message: 'Invalid instructor. Must be a teacher.'
            });
        }

        // Create new course
        const course = new Course({
            title,
            code: code.toUpperCase(),
            description,
            credits,
            department,
            instructor,
            schedule,
            startDate,
            endDate,
            maxEnrollment
        });

        await course.save();

        // Populate instructor details for response
        await course.populate('instructor', 'firstName lastName email');

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: { course }
        });

    } catch (error) {
        console.error('Create course error:', error);
        
        // Handle duplicate course code error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Course code already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while creating course'
        });
    }
};

/**
 * Update course (Admin/Instructor only)
 * PUT /api/courses/:id
 */
const updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if user is authorized to update this course
        const user = await User.findById(req.user.userId);
        if (user.role !== 'admin' && course.instructor.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this course'
            });
        }

        // Update course fields
        const allowedUpdates = [
            'title', 'description', 'credits', 'department', 
            'schedule', 'startDate', 'endDate', 'maxEnrollment'
        ];
        
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                course[field] = req.body[field];
            }
        });

        await course.save();
        await course.populate('instructor', 'firstName lastName email');

        res.json({
            success: true,
            message: 'Course updated successfully',
            data: { course }
        });

    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating course'
        });
    }
};

/**
 * Enroll student in course
 * POST /api/courses/:id/enroll
 */
const enrollStudent = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if course is full
        if (course.isFull) {
            return res.status(400).json({
                success: false,
                message: 'Course is full'
            });
        }

        // Check if student is already enrolled
        const isAlreadyEnrolled = course.enrolledStudents.some(
            enrollment => enrollment.student.toString() === req.user.userId
        );

        if (isAlreadyEnrolled) {
            return res.status(400).json({
                success: false,
                message: 'Already enrolled in this course'
            });
        }

        // Add student to course
        course.enrolledStudents.push({
            student: req.user.userId,
            enrollmentDate: new Date(),
            status: 'active'
        });

        await course.save();

        res.json({
            success: true,
            message: 'Successfully enrolled in course'
        });

    } catch (error) {
        console.error('Enroll student error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while enrolling in course'
        });
    }
};

module.exports = {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    enrollStudent
};