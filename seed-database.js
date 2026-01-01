const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./server/models/User');

// Sample data
const sampleUsers = [
    // Students
    {
        name: 'John Smith',
        email: 'john.smith@student.cukashmir.ac.in',
        password: 'student123',
        role: 'student',
        rollNumber: 'ST001',
        course: 'B.Tech Computer Science',
        year: 2,
        semester: 4
    },
    {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@student.cukashmir.ac.in',
        password: 'student123',
        role: 'student',
        rollNumber: 'ST002',
        course: 'B.Tech Computer Science',
        year: 3,
        semester: 6
    },
    {
        name: 'Michael Brown',
        email: 'michael.brown@student.cukashmir.ac.in',
        password: 'student123',
        role: 'student',
        rollNumber: 'ST003',
        course: 'MBA',
        year: 1,
        semester: 2
    },
    {
        name: 'Emily Davis',
        email: 'emily.davis@student.cukashmir.ac.in',
        password: 'student123',
        role: 'student',
        rollNumber: 'ST004',
        course: 'B.Tech Civil Engineering',
        year: 2,
        semester: 4
    },
    {
        name: 'David Wilson',
        email: 'david.wilson@student.cukashmir.ac.in',
        password: 'student123',
        role: 'student',
        rollNumber: 'ST005',
        course: 'M.Tech Computer Science',
        year: 1,
        semester: 2
    },
    
    // Faculty
    {
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@cukashmir.ac.in',
        password: 'faculty123',
        role: 'faculty',
        employeeId: 'FAC001',
        department: 'Computer Science & Engineering',
        designation: 'Professor',
        specialization: 'Machine Learning, Data Science'
    },
    {
        name: 'Dr. Priya Sharma',
        email: 'priya.sharma@cukashmir.ac.in',
        password: 'faculty123',
        role: 'faculty',
        employeeId: 'FAC002',
        department: 'Computer Science & Engineering',
        designation: 'Associate Professor',
        specialization: 'Software Engineering, Web Development'
    },
    {
        name: 'Dr. Mohammed Ali',
        email: 'mohammed.ali@cukashmir.ac.in',
        password: 'faculty123',
        role: 'faculty',
        employeeId: 'FAC003',
        department: 'Civil Engineering',
        designation: 'Assistant Professor',
        specialization: 'Structural Engineering, Construction Management'
    },
    {
        name: 'Dr. Sunita Devi',
        email: 'sunita.devi@cukashmir.ac.in',
        password: 'faculty123',
        role: 'faculty',
        employeeId: 'FAC004',
        department: 'Management Studies',
        designation: 'Professor',
        specialization: 'Marketing, Business Strategy'
    },
    
    // Admin
    {
        name: 'Admin User',
        email: 'admin@cukashmir.ac.in',
        password: 'admin123',
        role: 'admin',
        employeeId: 'ADM001',
        department: 'Administration',
        designation: 'System Administrator'
    }
];

// Sample courses data
const sampleCourses = [
    {
        courseCode: 'CS101',
        courseName: 'Introduction to Programming',
        department: 'Computer Science & Engineering',
        credits: 4,
        semester: 1,
        year: 1,
        facultyId: null, // Will be set after faculty creation
        description: 'Basic programming concepts using C language'
    },
    {
        courseCode: 'CS201',
        courseName: 'Data Structures and Algorithms',
        department: 'Computer Science & Engineering',
        credits: 4,
        semester: 3,
        year: 2,
        facultyId: null,
        description: 'Fundamental data structures and algorithmic techniques'
    },
    {
        courseCode: 'CS301',
        courseName: 'Database Management Systems',
        department: 'Computer Science & Engineering',
        credits: 3,
        semester: 5,
        year: 3,
        facultyId: null,
        description: 'Design and implementation of database systems'
    },
    {
        courseCode: 'CE101',
        courseName: 'Engineering Mechanics',
        department: 'Civil Engineering',
        credits: 4,
        semester: 1,
        year: 1,
        facultyId: null,
        description: 'Fundamental principles of mechanics in engineering'
    },
    {
        courseCode: 'MBA101',
        courseName: 'Principles of Management',
        department: 'Management Studies',
        credits: 3,
        semester: 1,
        year: 1,
        facultyId: null,
        description: 'Basic concepts and principles of management'
    }
];

// Connect to database
async function connectDB() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }
        
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
}

// Hash passwords
async function hashPasswords(users) {
    console.log('🔐 Hashing passwords...');
    
    for (let user of users) {
        const saltRounds = 10;
        user.password = await bcrypt.hash(user.password, saltRounds);
    }
    
    console.log('✅ Passwords hashed successfully');
}

// Seed users
async function seedUsers() {
    try {
        console.log('👥 Seeding users...');
        
        // Clear existing users
        await User.deleteMany({});
        console.log('🗑️  Cleared existing users');
        
        // Hash passwords
        await hashPasswords(sampleUsers);
        
        // Insert users
        const insertedUsers = await User.insertMany(sampleUsers);
        console.log(`✅ Inserted ${insertedUsers.length} users`);
        
        // Log created users by role
        const students = insertedUsers.filter(u => u.role === 'student');
        const faculty = insertedUsers.filter(u => u.role === 'faculty');
        const admins = insertedUsers.filter(u => u.role === 'admin');
        
        console.log(`   📚 Students: ${students.length}`);
        console.log(`   👨‍🏫 Faculty: ${faculty.length}`);
        console.log(`   👑 Admins: ${admins.length}`);
        
        return insertedUsers;
        
    } catch (error) {
        console.error('❌ Error seeding users:', error.message);
        throw error;
    }
}

// Display sample credentials
function displayCredentials() {
    console.log('\n🔑 SAMPLE LOGIN CREDENTIALS');
    console.log('=' .repeat(50));
    
    console.log('\n👨‍🎓 STUDENTS:');
    console.log('Email: john.smith@student.cukashmir.ac.in');
    console.log('Password: student123');
    console.log('Roll Number: ST001');
    console.log('');
    console.log('Email: sarah.johnson@student.cukashmir.ac.in');
    console.log('Password: student123');
    console.log('Roll Number: ST002');
    
    console.log('\n👨‍🏫 FACULTY:');
    console.log('Email: rajesh.kumar@cukashmir.ac.in');
    console.log('Password: faculty123');
    console.log('Employee ID: FAC001');
    console.log('');
    console.log('Email: priya.sharma@cukashmir.ac.in');
    console.log('Password: faculty123');
    console.log('Employee ID: FAC002');
    
    console.log('\n👑 ADMIN:');
    console.log('Email: admin@cukashmir.ac.in');
    console.log('Password: admin123');
    console.log('Employee ID: ADM001');
    
    console.log('\n' + '=' .repeat(50));
}

// Main seeding function
async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');
        console.log('=' .repeat(50));
        
        // Connect to database
        await connectDB();
        
        // Seed users
        const users = await seedUsers();
        
        console.log('\n✅ Database seeding completed successfully!');
        console.log(`📊 Total records created: ${users.length}`);
        
        // Display credentials
        displayCredentials();
        
    } catch (error) {
        console.error('\n❌ Database seeding failed:', error.message);
        process.exit(1);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run if called directly
if (require.main === module) {
    seedDatabase();
}

module.exports = {
    seedDatabase,
    sampleUsers,
    sampleCourses
};