const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./server/models/User');

// Test the newly registered user's password
async function testNewUserPassword() {
    try {
        console.log('🔐 Testing Newly Registered User Password');
        console.log('=' .repeat(50));
        
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');
        
        // Test the newly registered user
        const testEmail = 'demo.student.fixed@cukashmir.ac.in';
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
        console.log(`📅 Created: ${user.createdAt}`);
        console.log(`🔐 Stored password hash: ${user.password}`);
        
        // Test password comparison with detailed logging
        console.log('\n🔍 Testing bcrypt comparison:');
        console.log(`Input password: "${testPassword}"`);
        console.log(`Stored hash: "${user.password}"`);
        
        const isValid = await bcrypt.compare(testPassword, user.password);
        console.log(`Comparison result: ${isValid}`);
        
        if (isValid) {
            console.log('✅ Password verification SUCCESSFUL');
            console.log('🎉 This user should be able to login');
        } else {
            console.log('❌ Password verification FAILED');
            
            // Let's manually test the hash
            console.log('\n🔧 Manual verification test:');
            const manualHash = await bcrypt.hash(testPassword, 10);
            console.log(`Manual hash: ${manualHash}`);
            
            const manualTest = await bcrypt.compare(testPassword, manualHash);
            console.log(`Manual test result: ${manualTest}`);
            
            // Check if the stored hash is valid
            console.log('\n🔍 Checking stored hash validity:');
            console.log(`Hash length: ${user.password.length}`);
            console.log(`Hash starts with $2a$ or $2b$: ${user.password.startsWith('$2a$') || user.password.startsWith('$2b$')}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run if called directly
if (require.main === module) {
    testNewUserPassword();
}

module.exports = {
    testNewUserPassword
};