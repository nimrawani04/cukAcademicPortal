const axios = require('axios');

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Demo users with correct passwords
const demoUsers = [
    {
        name: 'Demo Student',
        email: 'demo.student.fixed@cukashmir.ac.in',
        password: 'demo123'
    },
    {
        name: 'Test Student A',
        email: 'test.student.fixed@test.com',
        password: 'test123'
    },
    {
        name: 'Demo Faculty',
        email: 'demo.faculty.fixed@cukashmir.ac.in',
        password: 'demo123'
    },
    {
        name: 'Demo Admin',
        email: 'demo.admin.fixed@cukashmir.ac.in',
        password: 'demo123'
    },
    {
        name: 'Aarav Sharma Fixed',
        email: 'aarav.fixed@student.cukashmir.ac.in',
        password: 'student123'
    }
];

// Register demo users with correct passwords
async function fixDemoUsers() {
    console.log('🔧 Registering Demo Users with Correct Passwords');
    console.log('=' .repeat(60));
    
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < demoUsers.length; i++) {
        const user = demoUsers[i];
        console.log(`\n${i + 1}. Registering: ${user.name}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔐 Password: ${user.password}`);
        
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register`, {
                name: user.name,
                email: user.email,
                password: user.password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success) {
                console.log(`   ✅ SUCCESS: ${response.data.message}`);
                successCount++;
            } else {
                console.log(`   ❌ FAILED: ${response.data.message}`);
                failureCount++;
            }
            
        } catch (error) {
            if (error.response?.data?.message?.includes('already registered')) {
                console.log(`   🔄 DUPLICATE: User already exists`);
            } else {
                console.log(`   ❌ ERROR: ${error.response?.data?.message || error.message}`);
                failureCount++;
            }
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 DEMO USER REGISTRATION SUMMARY');
    console.log('=' .repeat(60));
    console.log(`✅ Successfully Registered: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    
    if (successCount > 0) {
        console.log('\n🎉 Demo users registered successfully!');
        console.log('\n🔑 TEST THESE CREDENTIALS:');
        demoUsers.forEach((user, index) => {
            if (index < successCount) {
                console.log(`${index + 1}. Email: ${user.email} | Password: ${user.password}`);
            }
        });
    }
    
    return { successCount, failureCount };
}

// Test login with fixed users
async function testFixedLogin() {
    console.log('\n🧪 Testing Login with Fixed Demo Users');
    console.log('=' .repeat(60));
    
    const testCredentials = demoUsers.slice(0, 3); // Test first 3
    
    for (const cred of testCredentials) {
        console.log(`\n🔐 Testing: ${cred.email}`);
        
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
                console.log(`   ✅ LOGIN SUCCESS: ${response.data.data.user.name}`);
                console.log(`   🎭 Role: ${response.data.data.user.role}`);
                console.log(`   🔑 Token: ${response.data.data.token.substring(0, 30)}...`);
            }
            
        } catch (error) {
            console.log(`   ❌ LOGIN FAILED: ${error.response?.data?.message || error.message}`);
        }
    }
}

// Main function
async function main() {
    try {
        // Register demo users
        await fixDemoUsers();
        
        // Test login
        await testFixedLogin();
        
        console.log('\n✅ Demo user fix completed!');
        
    } catch (error) {
        console.error('\n❌ Process failed:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    fixDemoUsers,
    testFixedLogin
};