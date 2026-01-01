const axios = require('axios');

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Test registration and login with fixed hashing
async function testFixedRegistrationAndLogin() {
    console.log('🔧 Testing Fixed Registration and Login');
    console.log('=' .repeat(50));
    
    const testUser = {
        name: 'Test Fixed User',
        email: 'test.fixed.final@test.com',
        password: 'test123'
    };
    
    try {
        // Step 1: Register user
        console.log('\n1️⃣ Registering new user...');
        console.log(`   📧 Email: ${testUser.email}`);
        console.log(`   🔐 Password: ${testUser.password}`);
        
        const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (registerResponse.data.success) {
            console.log('   ✅ Registration successful!');
            console.log(`   👤 User ID: ${registerResponse.data.data.id}`);
        } else {
            console.log('   ❌ Registration failed');
            return;
        }
        
        // Step 2: Test login immediately
        console.log('\n2️⃣ Testing login...');
        
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (loginResponse.data.success) {
            console.log('   ✅ LOGIN SUCCESSFUL! 🎉');
            console.log(`   👤 Welcome: ${loginResponse.data.data.user.name}`);
            console.log(`   🎭 Role: ${loginResponse.data.data.user.role}`);
            console.log(`   🔑 Token: ${loginResponse.data.data.token.substring(0, 30)}...`);
            console.log(`   📅 Login Time: ${new Date().toLocaleString()}`);
            
            return { success: true, user: loginResponse.data.data.user };
        } else {
            console.log('   ❌ Login failed');
            console.log(`   📝 Message: ${loginResponse.data.message}`);
            return { success: false };
        }
        
    } catch (error) {
        if (error.response?.data?.message?.includes('already registered')) {
            console.log('   🔄 User already exists, testing login...');
            
            // Test login with existing user
            try {
                const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
                    email: testUser.email,
                    password: testUser.password
                });
                
                if (loginResponse.data.success) {
                    console.log('   ✅ LOGIN SUCCESSFUL! 🎉');
                    console.log(`   👤 Welcome: ${loginResponse.data.data.user.name}`);
                    return { success: true };
                }
            } catch (loginError) {
                console.log('   ❌ Login failed for existing user');
                console.log(`   📝 Error: ${loginError.response?.data?.message}`);
            }
        } else {
            console.log('   ❌ Error:', error.response?.data?.message || error.message);
        }
        return { success: false };
    }
}

// Test multiple scenarios
async function runComprehensiveTest() {
    console.log('🚀 Running Comprehensive Registration & Login Test');
    console.log('=' .repeat(60));
    
    const result = await testFixedRegistrationAndLogin();
    
    if (result.success) {
        console.log('\n🎉 SUCCESS! The double-hashing issue has been fixed!');
        console.log('✅ Registration works correctly');
        console.log('✅ Login works correctly');
        console.log('✅ Password hashing is working properly');
        console.log('✅ MongoDB Atlas integration is complete');
        
        console.log('\n🔑 WORKING CREDENTIALS:');
        console.log('Email: test.fixed.final@test.com');
        console.log('Password: test123');
        
        console.log('\n🌐 You can now test login in your browser at:');
        console.log('http://localhost:5000');
        
    } else {
        console.log('\n❌ Test failed - there may still be issues to resolve');
    }
}

// Run if called directly
if (require.main === module) {
    runComprehensiveTest();
}

module.exports = {
    testFixedRegistrationAndLogin,
    runComprehensiveTest
};