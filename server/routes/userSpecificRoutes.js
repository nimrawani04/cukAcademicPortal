/**
 * USER-SPECIFIC API ROUTES
 * Enforces critical API rules with proper middleware
 */

const express = require('express');
const router = express.Router();

// Import middleware
const { authenticateToken } = require('../middleware/auth');
const {
    verifyResourceOwnership,
    verifyFacultyStudentAccess,
    verifyAdminAccess,
    verifyStudentSelfAccess,
    logApiAccess,
    validateMongoOperation
} = require('../middleware/apiRules');

// Import controllers
const {
    // Admin controllers
    getAllUsers,
    approveUser,
    deleteUser,
    
    // Faculty controllers
    getFacultyStudents,
    addStudentAttendance,
    addStudentMarks,
    getFacultyStudentAttendance,
    createNotice,
    
    // Student controllers
    getStudentOwnProfile,
    getStudentOwnAttendance,
    getStudentOwnMarks,
    applyForLeave,
    getStudentOwnLeaves
} = require('../controllers/userSpecificController');

// Apply common middleware to all routes
router.use(authenticateToken);
router.use(logApiAccess);
router.use(validateMongoOperation);

/**
 * ADMIN ROUTES - Can access everything
 */

// Get all users (Admin only)
router.get('/admin/users', 
    verifyAdminAccess,
    getAllUsers
);

// Approve user (Admin only) - Updates MongoDB
router.patch('/admin/users/:userId/approve', 
    verifyAdminAccess,
    approveUser
);

// Delete user (Admin only) - Updates MongoDB
router.delete('/admin/users/:userId', 
    verifyAdminAccess,
    deleteUser
);

/**
 * FACULTY ROUTES - Only assigned students
 */

// Get faculty's assigned students only
router.get('/faculty/students', 
    verifyResourceOwnership,
    getFacultyStudents
);

// Add attendance for assigned student only - Updates MongoDB
router.post('/faculty/students/:studentId/attendance', 
    verifyResourceOwnership,
    verifyFacultyStudentAccess,
    addStudentAttendance
);

// Add marks for assigned student only - Updates MongoDB
router.post('/faculty/students/:studentId/marks', 
    verifyResourceOwnership,
    verifyFacultyStudentAccess,
    addStudentMarks
);

// Get attendance for assigned student only
router.get('/faculty/students/:studentId/attendance', 
    verifyResourceOwnership,
    verifyFacultyStudentAccess,
    getFacultyStudentAttendance
);

// Create notice - Updates MongoDB
router.post('/faculty/notices', 
    verifyResourceOwnership,
    createNotice
);

/**
 * STUDENT ROUTES - Only own data
 */

// Get student's own profile only
router.get('/student/profile', 
    verifyResourceOwnership,
    verifyStudentSelfAccess,
    getStudentOwnProfile
);

// Get student's own attendance only
router.get('/student/attendance', 
    verifyResourceOwnership,
    verifyStudentSelfAccess,
    getStudentOwnAttendance
);

// Get student's own marks only
router.get('/student/marks', 
    verifyResourceOwnership,
    verifyStudentSelfAccess,
    getStudentOwnMarks
);

// Apply for leave - Updates MongoDB
router.post('/student/leave', 
    verifyResourceOwnership,
    verifyStudentSelfAccess,
    applyForLeave
);

// Get student's own leave applications only
router.get('/student/leaves', 
    verifyResourceOwnership,
    verifyStudentSelfAccess,
    getStudentOwnLeaves
);

/**
 * CROSS-ROLE ROUTES WITH SPECIFIC ACCESS CONTROLS
 */

// Review leave application (Faculty/Admin only) - Updates MongoDB
router.patch('/leave/:leaveId/review', 
    authenticateToken,
    async (req, res) => {
        try {
            const { role } = req.user;
            const { leaveId } = req.params;
            const { status, reviewComments } = req.body;
            
            // Only faculty and admin can review leaves
            if (!['faculty', 'admin'].includes(role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied - faculty or admin required'
                });
            }
            
            console.log(`🔍 ${role} reviewing leave:`, leaveId);
            
            // Update leave status in MongoDB
            const leave = await Leave.findByIdAndUpdate(
                leaveId,
                {
                    status,
                    reviewComments,
                    reviewDate: new Date(),
                    reviewedBy: req.user.userId
                },
                { new: true }
            );
            
            if (!leave) {
                return res.status(404).json({
                    success: false,
                    message: 'Leave application not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Leave application reviewed successfully',
                data: leave
            });
            
        } catch (error) {
            console.error('Review leave error:', error);
            res.status(500).json({
                success: false,
                message: 'Error reviewing leave application'
            });
        }
    }
);

// Edit marks (Faculty/Admin only) - Updates MongoDB
router.put('/marks/:markId', 
    authenticateToken,
    async (req, res) => {
        try {
            const { role } = req.user;
            const { markId } = req.params;
            const { totalMarks, maxMarks } = req.body;
            
            // Only faculty and admin can edit marks
            if (!['faculty', 'admin'].includes(role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied - faculty or admin required'
                });
            }
            
            console.log(`🔍 ${role} editing marks:`, markId);
            
            // Calculate new percentage and grade
            const percentage = (totalMarks / maxMarks) * 100;
            const grade = calculateGrade(percentage);
            
            // Update marks in MongoDB
            const marks = await Marks.findByIdAndUpdate(
                markId,
                {
                    totalMarks,
                    maxMarks,
                    percentage,
                    grade,
                    lastModified: new Date(),
                    modifiedBy: req.user.userId
                },
                { new: true }
            );
            
            if (!marks) {
                return res.status(404).json({
                    success: false,
                    message: 'Marks record not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Marks updated successfully',
                data: marks
            });
            
        } catch (error) {
            console.error('Edit marks error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating marks'
            });
        }
    }
);

// Delete marks (Admin only) - Updates MongoDB
router.delete('/marks/:markId', 
    verifyAdminAccess,
    async (req, res) => {
        try {
            const { markId } = req.params;
            
            console.log('🔍 Admin deleting marks:', markId);
            
            // Delete marks from MongoDB
            const marks = await Marks.findByIdAndDelete(markId);
            
            if (!marks) {
                return res.status(404).json({
                    success: false,
                    message: 'Marks record not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Marks deleted successfully'
            });
            
        } catch (error) {
            console.error('Delete marks error:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting marks'
            });
        }
    }
);

/**
 * UTILITY FUNCTIONS
 */
function calculateGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 35) return 'D';
    return 'F';
}

module.exports = router;