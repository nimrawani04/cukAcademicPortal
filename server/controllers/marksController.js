const Marks = require('../models/Marks');
const Student = require('../models/Student');
const Course = require('../models/Course');
const { validationResult } = require('express-validator');
const xlsx = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

/**
 * Create marks manually
 * POST /api/marks
 */
const createMarks = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            studentId,
            courseId,
            subject,
            academicYear,
            semester,
            test1,
            test2,
            assignment,
            presentation,
            attendanceMarks,
            remarks
        } = req.body;

        // Check if marks already exist
        const existingMarks = await Marks.findOne({
            studentId,
            courseId,
            academicYear,
            semester
        });

        if (existingMarks) {
            return res.status(400).json({
                success: false,
                message: 'Marks already exist for this student in this course/semester'
            });
        }

        // Verify student and course exist
        const [student, course] = await Promise.all([
            Student.findById(studentId),
            Course.findById(courseId)
        ]);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Create marks
        const marks = new Marks({
            studentId,
            courseId,
            subject,
            academicYear,
            semester,
            test1: test1 || 0,
            test2: test2 || 0,
            assignment: assignment || 0,
            presentation: presentation || 0,
            attendanceMarks: attendanceMarks || 0,
            remarks,
            enteredBy: req.user.userId,
            uploadSource: 'manual'
        });

        await marks.save();

        // Populate the response
        await marks.populate([
            { path: 'studentId', select: 'firstName lastName rollNumber' },
            { path: 'courseId', select: 'title code credits' },
            { path: 'enteredBy', select: 'firstName lastName role' }
        ]);

        console.log(`✅ Marks created for student ${student.rollNumber} in ${course.code}`);

        res.status(201).json({
            success: true,
            message: 'Marks created successfully',
            data: { marks }
        });

    } catch (error) {
        console.error('Create marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating marks'
        });
    }
};

/**
 * Upload marks via Excel file
 * POST /api/marks/upload
 */
const uploadMarksExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Excel file is required'
            });
        }

        const filePath = req.file.path;
        const uploadBatch = uuidv4();

        try {
            // Read Excel file
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON
            const jsonData = xlsx.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Excel file is empty or has no valid data'
                });
            }

            // Validate required columns
            const requiredColumns = ['studentId', 'courseId', 'subject', 'academicYear', 'semester'];
            const firstRow = jsonData[0];
            const missingColumns = requiredColumns.filter(col => !(col in firstRow));

            if (missingColumns.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Missing required columns: ${missingColumns.join(', ')}`,
                    requiredColumns,
                    foundColumns: Object.keys(firstRow)
                });
            }

            // Validate data
            const { validData, errors: validationErrors } = Marks.validateExcelData(jsonData);

            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Data validation failed',
                    errors: validationErrors,
                    totalRows: jsonData.length,
                    validRows: validData.length
                });
            }

            // Verify students and courses exist
            const studentIds = [...new Set(validData.map(row => row.studentId))];
            const courseIds = [...new Set(validData.map(row => row.courseId))];

            const [students, courses] = await Promise.all([
                Student.find({ _id: { $in: studentIds } }).select('_id rollNumber'),
                Course.find({ _id: { $in: courseIds } }).select('_id code title')
            ]);

            const studentIdMap = new Map(students.map(s => [s._id.toString(), s]));
            const courseIdMap = new Map(courses.map(c => [c._id.toString(), c]));

            // Filter out invalid student/course IDs
            const finalValidData = validData.filter(row => {
                return studentIdMap.has(row.studentId) && courseIdMap.has(row.courseId);
            });

            const invalidData = validData.filter(row => {
                return !studentIdMap.has(row.studentId) || !courseIdMap.has(row.courseId);
            });

            if (finalValidData.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid student/course combinations found',
                    invalidData: invalidData.map(row => ({
                        studentId: row.studentId,
                        courseId: row.courseId,
                        issue: !studentIdMap.has(row.studentId) ? 'Student not found' : 'Course not found'
                    }))
                });
            }

            // Bulk insert marks
            const results = await Marks.bulkInsertMarks(finalValidData, req.user.userId, uploadBatch);

            // Clean up uploaded file
            fs.unlinkSync(filePath);

            console.log(`📊 Excel upload completed: ${results.success.length} records inserted, ${results.errors.length} errors, ${results.duplicates.length} duplicates`);

            res.json({
                success: true,
                message: 'Excel upload completed',
                data: {
                    uploadBatch,
                    totalProcessed: finalValidData.length,
                    successful: results.success.length,
                    errors: results.errors.length,
                    duplicates: results.duplicates.length,
                    results
                }
            });

        } catch (fileError) {
            // Clean up file on error
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            throw fileError;
        }

    } catch (error) {
        console.error('Excel upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during Excel upload',
            error: error.message
        });
    }
};

/**
 * Get marks by student
 * GET /api/marks/student/:studentId
 */
const getMarksByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { academicYear, semester, courseId } = req.query;

        // Verify student exists
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check access permissions
        const userRole = req.user.role;
        const userId = req.user.userId;

        if (userRole === 'student' && userId.toString() !== studentId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Students can only view their own marks.'
            });
        }

        const marks = await Marks.getMarksByStudent(studentId, {
            academicYear,
            semester,
            courseId
        });

        // Calculate summary statistics
        const summary = {
            totalSubjects: marks.length,
            averageMarks: marks.length > 0 ? (marks.reduce((sum, m) => sum + m.total, 0) / marks.length).toFixed(2) : 0,
            highestMarks: marks.length > 0 ? Math.max(...marks.map(m => m.total)) : 0,
            lowestMarks: marks.length > 0 ? Math.min(...marks.map(m => m.total)) : 0,
            passedSubjects: marks.filter(m => m.isPassed).length,
            failedSubjects: marks.filter(m => !m.isPassed).length
        };

        res.json({
            success: true,
            data: {
                student: {
                    id: student._id,
                    name: `${student.firstName} ${student.lastName}`,
                    rollNumber: student.rollNumber
                },
                marks,
                summary
            }
        });

    } catch (error) {
        console.error('Get marks by student error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching student marks'
        });
    }
};

/**
 * Get marks by course
 * GET /api/marks/course/:courseId
 */
const getMarksByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { academicYear, semester, page = 1, limit = 50 } = req.query;

        // Verify course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if faculty can access this course
        const userRole = req.user.role;
        const userId = req.user.userId;

        if (userRole === 'faculty' && course.instructor.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view marks for courses you teach.'
            });
        }

        const marks = await Marks.getMarksByCourse(courseId, {
            academicYear,
            semester
        });

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedMarks = marks.slice(startIndex, endIndex);

        // Get class statistics
        const statistics = await Marks.getClassStatistics(courseId, academicYear, semester);

        res.json({
            success: true,
            data: {
                course: {
                    id: course._id,
                    title: course.title,
                    code: course.code,
                    credits: course.credits
                },
                marks: paginatedMarks,
                statistics,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(marks.length / limit),
                    totalRecords: marks.length,
                    hasNext: endIndex < marks.length,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get marks by course error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching course marks'
        });
    }
};

/**
 * Update marks
 * PUT /api/marks/:id
 */
const updateMarks = async (req, res) => {
    try {
        const { id } = req.params;
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const marks = await Marks.findById(id);
        if (!marks) {
            return res.status(404).json({
                success: false,
                message: 'Marks record not found'
            });
        }

        // Check permissions
        const userRole = req.user.role;
        const userId = req.user.userId;

        if (userRole === 'faculty') {
            // Faculty can only edit marks for courses they teach
            const course = await Course.findById(marks.courseId);
            if (!course || course.instructor.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only edit marks for courses you teach.'
                });
            }
        } else if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only faculty and admin can edit marks.'
            });
        }

        // Update marks
        await marks.updateMarks(req.body, userId);

        // Populate the response
        await marks.populate([
            { path: 'studentId', select: 'firstName lastName rollNumber' },
            { path: 'courseId', select: 'title code credits' },
            { path: 'lastModifiedBy', select: 'firstName lastName role' }
        ]);

        console.log(`✅ Marks updated for student ${marks.studentId.rollNumber} by ${req.user.role} ${userId}`);

        res.json({
            success: true,
            message: 'Marks updated successfully',
            data: { marks }
        });

    } catch (error) {
        console.error('Update marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating marks'
        });
    }
};

/**
 * Delete marks
 * DELETE /api/marks/:id
 */
const deleteMarks = async (req, res) => {
    try {
        const { id } = req.params;

        const marks = await Marks.findById(id);
        if (!marks) {
            return res.status(404).json({
                success: false,
                message: 'Marks record not found'
            });
        }

        // Check permissions
        const userRole = req.user.role;
        const userId = req.user.userId;

        if (userRole === 'faculty') {
            // Faculty can only delete marks for courses they teach
            const course = await Course.findById(marks.courseId);
            if (!course || course.instructor.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only delete marks for courses you teach.'
                });
            }
        } else if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only faculty and admin can delete marks.'
            });
        }

        // Soft delete
        marks.isActive = false;
        marks.lastModifiedBy = userId;
        await marks.save();

        console.log(`🗑️ Marks deleted for student ${marks.studentId} by ${userRole} ${userId}`);

        res.json({
            success: true,
            message: 'Marks deleted successfully'
        });

    } catch (error) {
        console.error('Delete marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting marks'
        });
    }
};

/**
 * Get Excel template
 * GET /api/marks/template
 */
const getExcelTemplate = async (req, res) => {
    try {
        // Create sample data for template
        const templateData = [
            {
                studentId: '507f1f77bcf86cd799439011',
                courseId: '507f1f77bcf86cd799439012',
                subject: 'Mathematics',
                academicYear: '2024-2025',
                semester: 1,
                test1: 20,
                test2: 18,
                assignment: 15,
                presentation: 12,
                attendanceMarks: 14,
                remarks: 'Good performance'
            },
            {
                studentId: '507f1f77bcf86cd799439013',
                courseId: '507f1f77bcf86cd799439012',
                subject: 'Mathematics',
                academicYear: '2024-2025',
                semester: 1,
                test1: 22,
                test2: 20,
                assignment: 18,
                presentation: 14,
                attendanceMarks: 15,
                remarks: 'Excellent work'
            }
        ];

        // Create workbook and worksheet
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(templateData);

        // Add column widths
        worksheet['!cols'] = [
            { width: 25 }, // studentId
            { width: 25 }, // courseId
            { width: 20 }, // subject
            { width: 15 }, // academicYear
            { width: 10 }, // semester
            { width: 10 }, // test1
            { width: 10 }, // test2
            { width: 12 }, // assignment
            { width: 12 }, // presentation
            { width: 15 }, // attendanceMarks
            { width: 30 }  // remarks
        ];

        xlsx.utils.book_append_sheet(workbook, worksheet, 'Marks Template');

        // Generate buffer
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=marks_template.xlsx');
        res.send(buffer);

    } catch (error) {
        console.error('Get Excel template error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating template'
        });
    }
};

/**
 * Get marks statistics
 * GET /api/marks/statistics
 */
const getMarksStatistics = async (req, res) => {
    try {
        const { courseId, academicYear, semester } = req.query;

        if (!courseId || !academicYear || !semester) {
            return res.status(400).json({
                success: false,
                message: 'Course ID, academic year, and semester are required'
            });
        }

        // Check permissions
        const userRole = req.user.role;
        const userId = req.user.userId;

        if (userRole === 'faculty') {
            const course = await Course.findById(courseId);
            if (!course || course.instructor.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only view statistics for courses you teach.'
                });
            }
        }

        const statistics = await Marks.getClassStatistics(courseId, academicYear, semester);

        res.json({
            success: true,
            data: { statistics }
        });

    } catch (error) {
        console.error('Get marks statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching statistics'
        });
    }
};

module.exports = {
    createMarks,
    uploadMarksExcel,
    getMarksByStudent,
    getMarksByCourse,
    updateMarks,
    deleteMarks,
    getExcelTemplate,
    getMarksStatistics
};