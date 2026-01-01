const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./server/models/User');

// Test password verification
async function testPasswordVerification() {
    try {
        console.log('🔐 Testing Password Verification');
        console.log('=' .repeat(50));
        
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');
        
        // Test specific user
        const testEmail = 'demo.student@cukashmir.ac.in';
        const testPassword = 'demo123';
        
        console.log(`\n🧪 Testing user: ${testEmail}`);
        console.log(`🔑 Testing password: ${testPassword}`);
        
        // Find user
        const user = await User.findOne({ email: testEmail });
        
        if (!user) {
            console.log('❌ User not found');
            return;
        }
        
        console.log(`✅ User found: ${user.name}`);
        console.log(`🔐 Stored password hash: ${user.password.substring(0, 20)}...`);
        
        // Test password comparison
        const isValid = await bcrypt.compare(testPassword, user.password);
        
        if (isValid) {
            console.log('✅ Password verification SUCCESSFUL');
            console.log('🎉 bcrypt comparison working correctly');
        } else {
            console.log('❌ Password verification FAILED');
            console.log('🔍 bcrypt comparison not working');
            
            // Let's test if the password was hashed correctly during registration
            console.log('\n🔍 Testing password hashing:');
            const testHash = await bcrypt.hash(testPassword, 10);
            console.log(`🔐 New hash for "${testPassword}": ${testHash.substring(0, 20)}...`);
            
            const testComparison = await bcrypt.compare(testPassword, testHash);
            console.log(`✅ Test comparison result: ${testComparison}`);
        }
        
        // Test a few more users
        const otherUsers = [
            { email: 'test.student.a@test.com', password: 'test123' },
            { email: 'aarav.sharma@student.cukashmir.ac.in', password: 'student123' }
        ];
        
        for (const testUser of otherUsers) {
            console.log(`\n🧪 Testing: ${testUser.email}`);
            const user = await User.findOne({ email: testUser.email });
            
            if (user) {
                const isValid = await bcrypt.compare(testUser.password, user.password);
                console.log(`   ${isValid ? '✅' : '❌'} Password verification: ${isValid ? 'SUCCESS' : 'FAILED'}`);
            } else {
                console.log('   ❌ User not found');
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
    testPasswordVerification();
}

module.exports = {
    testPasswordVerification
};