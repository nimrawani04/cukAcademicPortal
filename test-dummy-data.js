const axios = require('axios');

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Test data for registration
const testUsers = [
    {
        name: 'Alice Cooper',
        email: 'alice.cooper@test.com',
        password: 'password123'
    },
    {
        name: 'Bob Wilson',
        email: 'bob.wilson@test.com',
        password: 'password123'
    },
    {
        name: 'Charlie Brown',
        email: 'charlie.brown@test.com',
        password: 'password123'
    },
    {
        name: 'Diana Prince',
        email: 'diana.prince@test.com',
        password: 'password123'
    },
    {
        name: 'Edward Norton',
        email: 'edward.norton@test.com',
        password: 'password123'
    }
];

// Function to register a user
async function registerUser(userData) {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, userData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        return {
            success: true,
            data: response.data,
            user: userData.name
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            user: userData.name
        };
    }
}

// Function to test registration with dummy data
async function testDummyRegistrations() {
    console.log('🧪 Testing Registration with Dummy Data');
    console.log('=' .repeat(50));
    
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < testUsers.length; i++) {
        const user = testUsers[i];
        console.log(`\n${i + 1}. Testing registration for: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        
        const result = await registerUser(user);
        
        if (result.success) {
            console.log(`   ✅ SUCCESS: ${result.data.message}`);
            successCount++;
        } else {
            console.log(`   ❌ FAILED: ${result.error}`);
            failureCount++;
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('📊 REGISTRATION TEST SUMMARY');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📈 Success Rate: ${((successCount / testUsers.length) * 100).toFixed(1)}%`);
    
    if (successCount > 0) {
        console.log('\n🎉 Dummy data successfully added to database!');
        console.log('\n🔑 You can now test login with these credentials:');
        testUsers.slice(0, Math.min(3, successCount)).forEach((user, index) => {
            console.log(`${index + 1}. Email: ${user.email} | Password: ${user.password}`);
        });
    }
}

// Function to test duplicate registration
async function testDuplicateRegistration() {
    console.log('\n🔄 Testing Duplicate Registration Prevention');
    console.log('=' .repeat(50));
    
    const duplicateUser = testUsers[0]; // Use first user
    console.log(`Testing duplicate registration for: ${duplicateUser.name}`);
    
    const result = await registerUser(duplicateUser);
    
    if (!result.success && result.error.includes('already registered')) {
        console.log('✅ SUCCESS: Duplicate registration properly prevented');
        console.log(`   Message: ${result.error}`);
    } else if (result.success) {
        console.log('⚠️  WARNING: Duplicate registration was allowed (might be expected if user was deleted)');
    } else {
        console.log(`❌ UNEXPECTED ERROR: ${result.error}`);
    }
}

// Main test function
async function runTests() {
    try {
        console.log('🚀 Starting Dummy Data Tests...\n');
        
        // Test registrations
        await testDummyRegistrations();
        
        // Test duplicate prevention
        await testDuplicateRegistration();
        
        console.log('\n✅ All tests completed!');
        
    } catch (error) {
        console.error('\n❌ Test execution failed:', error.message);
    }
}

// Run tests if called directly
if (require.main === module) {
    runTests();
}

module.exports = {
    testUsers,
    registerUser,
    testDummyRegistrations,
    testDuplicateRegistration
};