const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./server/models/User');

// Comprehensive sample data for database
const sampleUsers = [
    // University Students - Computer Science
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
        name: 'Rohit Kumar',
        email: 'rohit.kumar@student.cukashmir.ac.in',
        password: 'student123',
        role: 'student'
    },
    {
        name: 'Sneha Gupta',
        email: 'sneha.gupta@student.cukashmir.ac.in',
        password: 'student123',
        role: 'student'
    },
    {
        name: 'Arjun Singh',
        email: 'arjun.singh@student.cukashmir.ac.in',
        password: 'student123',
        role: 'student'
    },
    {
        name: 'Kavya Reddy',
        email: 'kavya.reddy@student.cukashmir.ac.in',
        password: 'student123',
        role: 'student'
    },
    {
        name: 'Ahmed Hassan',
        email: 'ahmed.hassan@student.cukashmir.ac.in',
        password: 'student123',
        role: 'student'
    },
    {
        name: 'Maria Garcia',
        email: 'maria.garcia@student.cukashmir.ac.in',
        password: 'student123',
        role: 'student'
    },
    
    // Test Users
    {
        name: 'Demo Student',
        email: 'demo.student@cukashmir.ac.in',
        password: 'demo123',
        role: 'student'
    },
    {
        name: 'Test Student A',
        email: 'test.student.a@test.com',
        password: 'test123',
        role: 'student'
    },
    {
        name: 'Test Student B',
        email: 'test.student.b@test.com',
        password: 'test123',
        role: 'student'
    },
    {
        name: 'Sample User',
        email: 'sample.user@cukashmir.ac.in',
        password: 'sample123',
        role: 'student'
    },
    
    // Additional Test Users
    {
        name: 'Alice Cooper',
        email: 'alice.cooper@test.com',
        password: 'password123',
        role: 'student'
    },
    {
        name: 'Bob Wilson',
        email: 'bob.wilson@test.com',
        password: 'password123',
        role: 'student'
    },
    {
        name: 'Charlie Brown',
        email: 'charlie.brown@test.com',
        password: 'password123',
        role: 'student'
    },
    
    // Faculty Users (for future use)
    {
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@cukashmir.ac.in',
        password: 'faculty123',
        role: 'faculty'
    },
    {
        name: 'Dr. Priya Sharma',
        email: 'priya.sharma@cukashmir.ac.in',
        password: 'faculty123',
        role: 'faculty'
    },
    
    // Admin User
    {
        name: 'System Admin',
        email: 'admin@cukashmir.ac.in',
        password: 'admin123',
        role: 'admin'
    }
];

// Connect to MongoDB
async function connectToDatabase() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }
        
        if (mongoUri.includes('localhost')) {
            console.log('⚠️  Using local MongoDB connection');
        } else {
            console.log('☁️  Using MongoDB Atlas connection');
        }
        
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000, // 10 second timeout
        });
        
        console.log('✅ Successfully connected to MongoDB');
        console.log(`📍 Database: ${mongoose.connection.name}`);
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        throw error;
    }
}

// Hash all passwords
async function hashPasswords(users) {
    console.log('🔐 Hashing passwords...');
    
    const saltRounds = 10;
    
    for (let user of users) {
        user.password = await bcrypt.hash(user.password, saltRounds);
    }
    
    console.log('✅ All passwords hashed successfully');
}

// Clear existing data (optional)
async function clearExistingData(confirm = false) {
    if (!confirm) {
        console.log('ℹ️  Skipping data clearing (keeping existing users)');
        return;
    }
    
    try {
        const deleteResult = await User.deleteMany({});
        console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing users`);
    } catch (error) {
        console.error('❌ Error clearing existing data:', error.message);
        throw error;
    }
}

// Insert users into database
async function insertUsers(users) {
    try {
        console.log('👥 Inserting users into database...');
        
        let successCount = 0;
        let duplicateCount = 0;
        let errorCount = 0;
        
        for (let userData of users) {
            try {
                // Check if user already exists
                const existingUser = await User.findOne({ email: userData.email });
                
                if (existingUser) {
                    console.log(`🔄 User already exists: ${userData.name} (${userData.email})`);
                    duplicateCount++;
                    continue;
                }
                
                // Create new user
                const newUser = new User(userData);
                await newUser.save();
                
                console.log(`✅ Added: ${userData.name} (${userData.email})`);
                successCount++;
                
            } catch (error) {
                console.error(`❌ Failed to add ${userData.name}: ${error.message}`);
                errorCount++;
            }
        }
        
        return { successCount, duplicateCount, errorCount };
        
    } catch (error) {
        console.error('❌ Error inserting users:', error.message);
        throw error;
    }
}

// Display results
function displayResults(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DATABASE SEEDING RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Successfully Added: ${results.successCount}`);
    console.log(`🔄 Already Existed: ${results.duplicateCount}`);
    console.log(`❌ Failed: ${results.errorCount}`);
    console.log(`📈 Total Processed: ${results.successCount + results.duplicateCount + results.errorCount}`);
    
    if (results.successCount > 0) {
        console.log('\n🎉 New users successfully added to database!');
    }
    
    if (results.duplicateCount > 0) {
        console.log('ℹ️  Some users already existed (this is normal)');
    }
}

// Display sample credentials
function displayCredentials() {
    console.log('\n🔑 SAMPLE LOGIN CREDENTIALS');
    console.log('='.repeat(60));
    
    const quickTestCredentials = [
        { name: 'Demo Student', email: 'demo.student@cukashmir.ac.in', password: 'demo123', role: 'Student' },
        { name: 'Test Student A', email: 'test.student.a@test.com', password: 'test123', role: 'Student' },
        { name: 'Aarav Sharma', email: 'aarav.sharma@student.cukashmir.ac.in', password: 'student123', role: 'Student' },
        { name: 'Dr. Rajesh Kumar', email: 'rajesh.kumar@cukashmir.ac.in', password: 'faculty123', role: 'Faculty' },
        { name: 'System Admin', email: 'admin@cukashmir.ac.in', password: 'admin123', role: 'Admin' }
    ];
    
    console.log('\n🚀 QUICK TEST ACCOUNTS:');
    quickTestCredentials.forEach((cred, index) => {
        console.log(`${index + 1}. ${cred.name} (${cred.role})`);
        console.log(`   📧 Email: ${cred.email}`);
        console.log(`   🔐 Password: ${cred.password}`);
        console.log('');
    });
    
    console.log('💡 Use these credentials to test login functionality');
    console.log('='.repeat(60));
}

// Verify database contents
async function verifyDatabase() {
    try {
        const totalUsers = await User.countDocuments();
        const students = await User.countDocuments({ role: 'student' });
        const faculty = await User.countDocuments({ role: 'faculty' });
        const admins = await User.countDocuments({ role: 'admin' });
        
        console.log('\n📊 DATABASE VERIFICATION');
        console.log('='.repeat(40));
        console.log(`👥 Total Users: ${totalUsers}`);
        console.log(`👨‍🎓 Students: ${students}`);
        console.log(`👨‍🏫 Faculty: ${faculty}`);
        console.log(`👑 Admins: ${admins}`);
        
        // Show recent users
        const recentUsers = await User.find({}).sort({ createdAt: -1 }).limit(5);
        console.log('\n🕒 RECENT USERS:');
        recentUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
        });
        
    } catch (error) {
        console.error('❌ Error verifying database:', error.message);
    }
}

// Main seeding function
async function seedDatabase() {
    console.log('🌱 STARTING DATABASE SEEDING');
    console.log('='.repeat(60));
    
    try {
        // Connect to database
        await connectToDatabase();
        
        // Hash passwords
        await hashPasswords(sampleUsers);
        
        // Clear existing data (set to true if you want to start fresh)
        await clearExistingData(false);
        
        // Insert users
        const results = await insertUsers(sampleUsers);
        
        // Display results
        displayResults(results);
        
        // Verify database
        await verifyDatabase();
        
        // Display credentials
        displayCredentials();
        
        console.log('\n✅ Database seeding completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Database seeding failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        // Close database connection
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run if called directly
if (require.main === module) {
    seedDatabase();
}

module.exports = {
    seedDatabase,
    sampleUsers,
    connectToDatabase,
    insertUsers
};