// Script to create demo users for testing the database-driven frontend
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./server/models/User');
const StudentProfile = require('./server/models/StudentProfile');
const FacultyProfile = require('./server/models/FacultyProfile');

async function createDemoUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Create demo student
        console.log('🔍 Creating demo student...');
        
        // Check if demo student already exists
        let demoStudent = await User.findOne({ email: 'demo@student.com' });
        if (!demoStudent) {
            demoStudent = new User({
                name: 'Demo Student',
                email: 'demo@student.com',
                password: 'demo123',
                role: 'student',
                status: 'approved'
            });
            await demoStudent.save();
            console.log('✅ Demo student created');
            
            // Create student profile
            const studentProfile = new StudentProfile({
                userId: demoStudent._id,
                rollNumber: 'STU001',
                course: 'B.Tech Computer Science',
                semester: 3,
                department: 'Computer Science and Engineering',
                enrollmentYear: 2023,
                cgpa: 8.5,
                selectedCourses: []
            });
            await studentProfile.save();
            console.log('✅ Student profile created');
        } else {
            // Update status to approved if it exists
            demoStudent.status = 'approved';
            await demoStudent.save();
            console.log('✅ Demo student already exists, status updated to approved');
        }

        // Create demo faculty
        console.log('🔍 Creating demo faculty...');
        
        let demoFaculty = await User.findOne({ email: 'demo@faculty.com' });
        if (!demoFaculty) {
            demoFaculty = new User({
                name: 'Demo Faculty',
                email: 'demo@faculty.com',
                password: 'demo123',
                role: 'faculty',
                status: 'approved'
            });
            await demoFaculty.save();
            console.log('✅ Demo faculty created');
            
            // Create faculty profile
            const facultyProfile = new FacultyProfile({
                userId: demoFaculty._id,
                facultyId: 'FAC001',
                department: 'Computer Science and Engineering',
                designation: 'Assistant Professor',
                joiningDate: new Date('2020-01-01'),
                subjects: [
                    {
                        subjectName: 'Mathematics',
                        subjectCode: 'MATH101',
                        semester: 1,
                        course: 'B.Tech Computer Science'
                    },
                    {
                        subjectName: 'Data Structures',
                        subjectCode: 'CS201',
                        semester: 3,
                        course: 'B.Tech Computer Science'
                    }
                ],
                assignedStudents: []
            });
            await facultyProfile.save();
            console.log('✅ Faculty profile created');
        } else {
            // Update status to approved if it exists
            demoFaculty.status = 'approved';
            await demoFaculty.save();
            console.log('✅ Demo faculty already exists, status updated to approved');
        }

        // Create additional test student
        console.log('🔍 Creating test student...');
        
        let testStudent = await User.findOne({ email: 'test@student.com' });
        if (!testStudent) {
            testStudent = new User({
                name: 'Test Student',
                email: 'test@student.com',
                password: 'test123',
                role: 'student',
                status: 'approved'
            });
            await testStudent.save();
            console.log('✅ Test student created');
            
            // Create student profile
            const studentProfile = new StudentProfile({
                userId: testStudent._id,
                rollNumber: 'STU002',
                course: 'B.Tech Civil Engineering',
                semester: 2,
                department: 'Civil Engineering',
                enrollmentYear: 2024,
                cgpa: 7.8,
                selectedCourses: []
            });
            await studentProfile.save();
            console.log('✅ Test student profile created');
        } else {
            testStudent.status = 'approved';
            await testStudent.save();
            console.log('✅ Test student already exists, status updated to approved');
        }

        console.log('\n🎉 All demo users created successfully!');
        console.log('\n📋 Demo Credentials:');
        console.log('Student: demo@student.com / demo123');
        console.log('Faculty: demo@faculty.com / demo123');
        console.log('Test Student: test@student.com / test123');
        
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error creating demo users:', error);
        process.exit(1);
    }
}

createDemoUsers();