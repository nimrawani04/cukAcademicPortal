// Script to create admin account and enhance the role system
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./server/models/User');
const StudentProfile = require('./server/models/StudentProfile');
const FacultyProfile = require('./server/models/FacultyProfile');

async function createAdminAndEnhanceRoles() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Create admin account
        console.log('🔍 Creating admin account...');
        
        let adminUser = await User.findOne({ email: 'admin@cuk.com' });
        if (!adminUser) {
            adminUser = new User({
                name: 'System Administrator',
                email: 'admin@cuk.com',
                password: 'admin123',
                role: 'admin',
                status: 'approved'
            });
            await adminUser.save();
            console.log('✅ Admin account created');
        } else {
            adminUser.status = 'approved';
            await adminUser.save();
            console.log('✅ Admin account already exists, status updated');
        }

        // Create additional faculty with different designations
        console.log('🔍 Creating faculty with different designations...');
        
        // Professor
        let professor = await User.findOne({ email: 'professor@cuk.com' });
        if (!professor) {
            professor = new User({
                name: 'Dr. John Professor',
                email: 'professor@cuk.com',
                password: 'prof123',
                role: 'faculty',
                status: 'approved'
            });
            await professor.save();
            
            const professorProfile = new FacultyProfile({
                userId: professor._id,
                facultyId: 'PROF001',
                department: 'Computer Science and Engineering',
                designation: 'Professor',
                joiningDate: new Date('2015-01-01'),
                subjects: [
                    {
                        subjectName: 'Advanced Algorithms',
                        subjectCode: 'CS401',
                        semester: 7,
                        course: 'B.Tech Computer Science'
                    },
                    {
                        subjectName: 'Machine Learning',
                        subjectCode: 'CS402',
                        semester: 8,
                        course: 'B.Tech Computer Science'
                    }
                ],
                assignedStudents: []
            });
            await professorProfile.save();
            console.log('✅ Professor account created');
        }

        // Lecturer
        let lecturer = await User.findOne({ email: 'lecturer@cuk.com' });
        if (!lecturer) {
            lecturer = new User({
                name: 'Ms. Sarah Lecturer',
                email: 'lecturer@cuk.com',
                password: 'lect123',
                role: 'faculty',
                status: 'approved'
            });
            await lecturer.save();
            
            const lecturerProfile = new FacultyProfile({
                userId: lecturer._id,
                facultyId: 'LECT001',
                department: 'Mathematics',
                designation: 'Lecturer',
                joiningDate: new Date('2022-01-01'),
                subjects: [
                    {
                        subjectName: 'Calculus I',
                        subjectCode: 'MATH101',
                        semester: 1,
                        course: 'B.Tech Computer Science'
                    }
                ],
                assignedStudents: []
            });
            await lecturerProfile.save();
            console.log('✅ Lecturer account created');
        }

        // Guest Faculty
        let guestFaculty = await User.findOne({ email: 'guest@cuk.com' });
        if (!guestFaculty) {
            guestFaculty = new User({
                name: 'Mr. Mike Guest',
                email: 'guest@cuk.com',
                password: 'guest123',
                role: 'faculty',
                status: 'approved'
            });
            await guestFaculty.save();
            
            const guestProfile = new FacultyProfile({
                userId: guestFaculty._id,
                facultyId: 'GUEST001',
                department: 'Computer Science and Engineering',
                designation: 'Guest Faculty',
                joiningDate: new Date('2024-01-01'),
                subjects: [
                    {
                        subjectName: 'Web Development',
                        subjectCode: 'CS301',
                        semester: 5,
                        course: 'B.Tech Computer Science'
                    }
                ],
                assignedStudents: []
            });
            await guestProfile.save();
            console.log('✅ Guest Faculty account created');
        }

        // Create more students for better demonstration
        console.log('🔍 Creating additional students...');
        
        const studentData = [
            {
                name: 'Alice Johnson',
                email: 'alice@student.com',
                course: 'B.Tech Computer Science',
                semester: 3
            },
            {
                name: 'Bob Smith',
                email: 'bob@student.com',
                course: 'B.Tech Civil Engineering',
                semester: 2
            },
            {
                name: 'Carol Davis',
                email: 'carol@student.com',
                course: 'MBA',
                semester: 1
            }
        ];

        for (let i = 0; i < studentData.length; i++) {
            const data = studentData[i];
            let student = await User.findOne({ email: data.email });
            
            if (!student) {
                student = new User({
                    name: data.name,
                    email: data.email,
                    password: 'student123',
                    role: 'student',
                    status: 'approved'
                });
                await student.save();
                
                const count = await StudentProfile.countDocuments();
                const studentProfile = new StudentProfile({
                    userId: student._id,
                    rollNumber: `STU${String(count + 1).padStart(4, '0')}`,
                    course: data.course,
                    semester: data.semester,
                    department: data.course.includes('Computer Science') ? 'Computer Science and Engineering' : 
                               data.course.includes('Civil') ? 'Civil Engineering' : 'Management Studies',
                    enrollmentYear: 2024,
                    cgpa: Math.round((Math.random() * 3 + 6) * 10) / 10, // Random CGPA between 6.0-9.0
                    selectedCourses: []
                });
                await studentProfile.save();
                console.log(`✅ Student ${data.name} created`);
            }
        }

        console.log('\n🎉 Role system enhancement completed!');
        console.log('\n📋 Complete Account List:');
        console.log('\n👨‍💼 ADMIN:');
        console.log('- admin@cuk.com / admin123 (System Administrator)');
        
        console.log('\n👨‍🏫 FACULTY (by designation):');
        console.log('- professor@cuk.com / prof123 (Professor)');
        console.log('- demo@faculty.com / demo123 (Assistant Professor)');
        console.log('- lecturer@cuk.com / lect123 (Lecturer)');
        console.log('- guest@cuk.com / guest123 (Guest Faculty)');
        
        console.log('\n👨‍🎓 STUDENTS:');
        console.log('- demo@student.com / demo123 (Demo Student)');
        console.log('- test@student.com / test123 (Test Student)');
        console.log('- alice@student.com / student123 (Alice Johnson)');
        console.log('- bob@student.com / student123 (Bob Smith)');
        console.log('- carol@student.com / student123 (Carol Davis)');
        
        console.log('\n🎯 ROLE HIERARCHY DEMONSTRATION:');
        console.log('✅ Admin: Complete system control');
        console.log('✅ Faculty: Academic management (varies by designation)');
        console.log('✅ Students: Personal data access only');
        
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error enhancing role system:', error);
        process.exit(1);
    }
}

createAdminAndEnhanceRoles();