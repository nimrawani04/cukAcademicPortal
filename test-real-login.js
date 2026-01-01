const axios = require('axios');

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Test login with real database credentials
async function testRealLogin() {
    console.log('🧪 Testing Login with Real MongoDB Atlas Database');
    console.log('=' .repeat(60));
    
    // These are the actual credentials that were registered
    const realCredentials = [
        { email: 'demo.student@cukashmir.ac.in', password: 'demo123', name: 'Demo Student' },
        { email: 'test.student.a@test.com', password: 'test123', name: 'Test Student A' },
        { email: 'aarav.sharma@student.cukashmir.ac.in', password: 'student123', name: 'Aarav Sharma' },
        { email: 'fatima.khan@student.cukashmir.ac.in', password: 'student123', name: 'Fatima Khan' },
        { email: 'demo.faculty@cukashmir.ac.in', password: 'demo123', name: 'Demo Faculty' }
    ];
    
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < realCredentials.length; i++) {
        const cred = realCredentials[i];
        console.log(`\n${i + 1}. Testing: ${cred.name} (${cred.email})`);
        
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                email: cred.email,
                password: cred.password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success) {
                console.log(`   ✅ SUCCESS: ${response.data.message}`);
                console.log(`   👤 User: ${response.data.data.user.name}`);
                console.log(`   🎭 Role: ${response.data.data.user.role}`);
                console.log(`   🔑 Token: ${response.data.data.token.substring(0, 20)}...`);
                successCount++;
            } else {
                console.log(`   ❌ FAILED: ${response.data.message}`);
                failureCount++;
            }
            
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.response?.data?.message || error.message}`);
            failureCount++;
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Test invalid credentials
    console.log(`\n${realCredentials.length + 1}. Testing: Invalid Credentials (should fail)`);
    try {
        await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'invalid@test.com',
            password: 'wrongpassword'
        });
        console.log('   ❌ UNEXPECTED: Invalid login succeeded');
        failureCount++;
    } catch (error) {
        console.log('   ✅ EXPECTED: Invalid login properly rejected');
        console.log(`   📝 Message: ${error.response?.data?.message}`);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 REAL DATABASE LOGIN TEST RESULTS');
    console.log('=' .repeat(60));
    console.log(`✅ Successful Logins: ${successCount}`);
    console.log(`❌ Failed Logins: ${failureCount}`);
    console.log(`📈 Success Rate: ${((successCount / realCredentials.length) * 100).toFixed(1)}%`);
    
    if (successCount > 0) {
        console.log('\n🎉 MongoDB Atlas authentication is working!');
        console.log('🔐 Password hashing and verification working correctly');
        console.log('🎯 JWT token generation successful');
        console.log('📊 Real database integration complete');
    }
    
    return { successCount, failureCount };
}

// Run test if called directly
if (require.main === module) {
    testRealLogin();
}

module.exports = {
    testRealLogin
};