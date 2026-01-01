const axios = require('axios');

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Test login function
async function testLogin(email, password) {
    try {
        console.log(`🧪 Testing login for: ${email}`);
        
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: email,
            password: password
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Login successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        return response.data;
        
    } catch (error) {
        console.log('❌ Login failed!');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Network Error:', error.message);
        }
        return null;
    }
}

// Test multiple login scenarios
async function runLoginTests() {
    console.log('🚀 Testing Login Functionality');
    console.log('=' .repeat(50));
    
    const testCredentials = [
        { email: 'demo.student@cukashmir.ac.in', password: 'demo123' },
        { email: 'test.student.a@test.com', password: 'test123' },
        { email: 'aarav.sharma@student.cukashmir.ac.in', password: 'student123' },
        { email: 'invalid@test.com', password: 'wrongpassword' }, // Should fail
        { email: 'demo.student@cukashmir.ac.in', password: 'wrongpassword' } // Should fail
    ];
    
    for (let i = 0; i < testCredentials.length; i++) {
        const cred = testCredentials[i];
        console.log(`\n${i + 1}. Testing: ${cred.email}`);
        
        await testLogin(cred.email, cred.password);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n✅ Login tests completed!');
}

// Run tests if called directly
if (require.main === module) {
    runLoginTests();
}

module.exports = {
    testLogin,
    runLoginTests
};