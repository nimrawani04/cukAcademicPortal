/**
 * Script to create sample personalized data for testing
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./server/models/User');
const Student = require('./server/models/Student');
const Attendance = require('./server/models/Attendance');
const Marks = require('./server/models/Marks');

// Connect to database
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        return false;
    }
};

// Create sample data
const createSampleData = async () => {
    try {
        console.log('🔍 === CREATING SAMPLE PERSONALIZED DATA ===');
        
        // Find existing users
        const students = await User.find({ role: 'student' });
        console.log(`Found ${students.length} student users`);
        
        if (students.length === 0) {
            console.log('⚠️  No student users found. Creating sample students...');
            
            // Create sample student users
            const sampleStudents = [
                {
                    name: 'Aarav Sharma',
                    email: 'aarav.sharma@student.cukashmir.ac.in',
                    password: 'student123',
                    role: 'student'
                },
                {
                    name: 'Priya Patel',
                    email: 'priya.patel@student.cukashmir.ac.in',
                    password: 'student123',
                    role: 'student'
                },
                {
                    name: 'Rahul Kumar',
                    email: 'rahul.kumar@student.cukashmir.ac.in',
                    password: 'student123',
                    role: 'student'
                }
            ];
            
            for (const studentData of sampleStudents) {
                const user = new User(studentData);
                await user.save();
                console.log(`✅ Created student user: ${user.email}`);
            }
        }
        
        // Get all student users
        const allStudents = await User.find({ role: 'student' });
        
        // Create student profiles
        for (let i = 0; i < allStudents.length; i++) {
            const user = allStudents[i];
            
            // Check if student profile already exists
            const existingStudent = await Student.findOne({ userId: user._id });
            if (existingStudent) {
                console.log(`⚠️  Student profile already exists for: ${user.email}`);
                continue;
            }
            
            // Create student profile
            const student = new Student({
                userId: user._id,
                rollNumber: `CUK${2024}${String(i + 1).padStart(3, '0')}`,
                course: ['Computer Science', 'Mathematics', 'Physics', 'Chemistry'][i % 4],
                semester: Math.floor(Math.random() * 8) + 1,
                year: new Date().getFullYear(),
                department: ['Computer Science', 'Mathematics', 'Physics', 'Chemistry'][i % 4]
            });
            
            await student.save();
            console.log(`✅ Created student profile: ${student.rollNumber} - ${user.name}`);
            
            // Create attendance records
            const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English'];
            
            for (const subject of subjects) {
                const totalClasses = Math.floor(Math.random() * 50) + 30; // 30-80 classes
                const attendedClasses = Math.floor(Math.random() * totalClasses); // Random attendance
                
                const attendance = new Attendance({
                    studentId: student._id,
                    subject: subject,
                    totalClasses: totalClasses,
                    attendedClasses: attendedClasses
                });
                
                await attendance.save();
                console.log(`✅ Created attendance for ${user.name} - ${subject}: ${attendedClasses}/${totalClasses}`);
            }
            
            // Create marks records
            const examTypes = ['midterm', 'final', 'assignment', 'quiz'];
            
            for (const subject of subjects) {
                for (const examType of examTypes) {
                    const totalMarks = examType === 'final' ? 100 : examType === 'midterm' ? 50 : 25;
                    const marksObtained = Math.floor(Math.random() * totalMarks * 0.8) + totalMarks * 0.2; // 20-100% marks
                    
                    const marks = new Marks({
                        studentId: student._id,
                        subject: subject,
                        examType: examType,
                        marksObtained: Math.round(marksObtained),
                        totalMarks: totalMarks
                    });
                    
                    await marks.save();
                    console.log(`✅ Created marks for ${user.name} - ${subject} ${examType}: ${marks.marksObtained}/${totalMarks} (${marks.grade})`);
                }
            }
        }
        
        console.log('🔍 === SAMPLE DATA CREATION COMPLETE ===');
        
        // Show summary
        const totalStudents = await Student.countDocuments();
        const totalAttendance = await Attendance.countDocuments();
        const totalMarks = await Marks.countDocuments();
        
        console.log('📊 === DATA SUMMARY ===');
        console.log(`👨‍🎓 Total Students: ${totalStudents}`);
        console.log(`📅 Total Attendance Records: ${totalAttendance}`);
        console.log(`📝 Total Marks Records: ${totalMarks}`);
        
    } catch (error) {
        console.error('❌ Error creating sample data:', error.message);
    }
};

// Main function
const main = async () => {
    console.log('🚀 Starting sample data creation...');
    
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
        console.log('❌ Cannot create sample data without database connection');
        process.exit(1);
    }
    
    // Create sample data
    await createSampleData();
    
    // Close database connection
    await mongoose.connection.close();
    console.log('🔍 === SAMPLE DATA CREATION SCRIPT COMPLETE ===');
    process.exit(0);
};

// Run the script
main().catch(error => {
    console.error('❌ Script error:', error);
    process.exit(1);
});