const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./server/models/User');

// Connect and check users
async function checkDatabaseUsers() {
    try {
        console.log('🔍 Checking MongoDB Atlas Database Users');
        console.log('=' .repeat(50));
        
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');
        
        // Get all users
        const users = await User.find({}).sort({ createdAt: -1 });
        
        console.log(`\n📊 Found ${users.length} users in database:`);
        console.log('-' .repeat(50));
        
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   👤 Role: ${user.role}`);
            console.log(`   📅 Created: ${user.createdAt.toLocaleString()}`);
            console.log('');
        });
        
        // Check for specific demo users
        const demoUsers = [
            'demo.student@cukashmir.ac.in',
            'test.student.a@test.com',
            'demo.faculty@cukashmir.ac.in',
            'demo.admin@cukashmir.ac.in'
        ];
        
        console.log('🔍 Checking for demo users:');
        for (const email of demoUsers) {
            const user = await User.findOne({ email: email });
            if (user) {
                console.log(`✅ ${email} - EXISTS`);
            } else {
                console.log(`❌ ${email} - NOT FOUND`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run if called directly
if (require.main === module) {
    checkDatabaseUsers();
}

module.exports = {
    checkDatabaseUsers
};