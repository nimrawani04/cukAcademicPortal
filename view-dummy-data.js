const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./server/models/User');

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

// View all users in database
async function viewUsers() {
    try {
        console.log('👥 Fetching all users from database...\n');
        
        const users = await User.find({}).sort({ createdAt: -1 });
        
        if (users.length === 0) {
            console.log('📭 No users found in database');
            return;
        }
        
        console.log(`📊 Found ${users.length} users in database:`);
        console.log('=' .repeat(80));
        
        users.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.name}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   👤 Role: ${user.role}`);
            console.log(`   📅 Created: ${user.createdAt.toLocaleDateString()} ${user.createdAt.toLocaleTimeString()}`);
            console.log(`   🆔 ID: ${user._id}`);
        });
        
        // Summary by role
        const roleCount = users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {});
        
        console.log('\n' + '=' .repeat(80));
        console.log('📈 SUMMARY BY ROLE:');
        Object.entries(roleCount).forEach(([role, count]) => {
            const emoji = role === 'student' ? '👨‍🎓' : role === 'faculty' ? '👨‍🏫' : '👑';
            console.log(`${emoji} ${role.charAt(0).toUpperCase() + role.slice(1)}s: ${count}`);
        });
        
        // Recent registrations
        const recentUsers = users.slice(0, 5);
        console.log('\n🕒 RECENT REGISTRATIONS:');
        recentUsers.forEach((user, index) => {
            const timeAgo = getTimeAgo(user.createdAt);
            console.log(`${index + 1}. ${user.name} (${user.email}) - ${timeAgo}`);
        });
        
    } catch (error) {
        console.error('❌ Error fetching users:', error.message);
    }
}

// Helper function to calculate time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Search users by email or name
async function searchUsers(query) {
    try {
        console.log(`🔍 Searching for users matching: "${query}"`);
        
        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        });
        
        if (users.length === 0) {
            console.log('❌ No users found matching the search criteria');
            return;
        }
        
        console.log(`✅ Found ${users.length} matching user${users.length > 1 ? 's' : ''}:`);
        console.log('-'.repeat(50));
        
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email})`);
            console.log(`   Role: ${user.role} | Created: ${user.createdAt.toLocaleDateString()}`);
        });
        
    } catch (error) {
        console.error('❌ Error searching users:', error.message);
    }
}

// Display sample login credentials
function displaySampleCredentials() {
    console.log('\n🔑 SAMPLE LOGIN CREDENTIALS FOR TESTING');
    console.log('=' .repeat(80));
    
    const sampleCredentials = [
        { name: 'Demo Student', email: 'demo.student@cukashmir.ac.in', password: 'demo123' },
        { name: 'Test Student A', email: 'test.student.a@test.com', password: 'test123' },
        { name: 'Aarav Sharma', email: 'aarav.sharma@student.cukashmir.ac.in', password: 'student123' },
        { name: 'Priya Patel', email: 'priya.patel@student.cukashmir.ac.in', password: 'student123' },
        { name: 'Alice Cooper', email: 'alice.cooper@test.com', password: 'password123' }
    ];
    
    sampleCredentials.forEach((cred, index) => {
        console.log(`${index + 1}. ${cred.name}`);
        console.log(`   📧 Email: ${cred.email}`);
        console.log(`   🔐 Password: ${cred.password}`);
        console.log('');
    });
    
    console.log('💡 Use these credentials to test login functionality when implemented');
    console.log('=' .repeat(80));
}

// Main function
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const query = args[1];
    
    try {
        await connectDB();
        
        if (command === 'search' && query) {
            await searchUsers(query);
        } else if (command === 'credentials') {
            displaySampleCredentials();
        } else {
            await viewUsers();
            displaySampleCredentials();
        }
        
    } catch (error) {
        console.error('❌ Operation failed:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    viewUsers,
    searchUsers,
    displaySampleCredentials
};