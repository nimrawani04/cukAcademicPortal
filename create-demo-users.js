const axios = require('axios');

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Create proper demo users with known passwords
const demoUsers = [
    {
        name: 'Demo Student',
        email: 'demo@student.com',
        password: 'demo123'
    },
    {
        name: 'Test Student',
        email: 'test@student.com', 
        password: 'test123'
    },
    {
        name: 'John Student',
        email: 'john@student.com',
        password: 'student123'
    }
];

async function createDemoUsers() {
    console.log('🎭 Creating Simple Demo Users');
    console.log('=' .repeat(40));
    
    for (const user of demoUsers) {
        try {
            console.log(`\n📝 Creating: ${user.name}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   🔐 Password: ${user.password}`);
            
            const response = await axios.post(`${API_BASE_URL}/auth/register`, user, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.data.success) {
                console.log('   ✅ Created successfully');
                
                // Test login immediately
                const loginTest = await axios.post(`${API_BASE_URL}/auth/login`, {
                    email: user.email,
                    password: user.password
                });
                
                if (loginTest.data.success) {
                    console.log('   ✅ Login test: SUCCESS');
                } else {
                    console.log('   ❌ Login test: FAILED');
                }
            }
            
        } catch (error) {
            if (error.response?.data?.message?.includes('already registered')) {
                console.log('   🔄 Already exists - testing login...');
                
                try {
                    const loginTest = await axios.post(`${API_BASE_URL}/auth/login`, {
                        email: user.email,
                        password: user.password
                    });
                    
                    if (loginTest.data.success) {
                        console.log('   ✅ Login test: SUCCESS');
                    } else {
                        console.log('   ❌ Login test: FAILED');
                    }
                } catch (loginError) {
                    console.log('   ❌ Login test: ERROR');
                }
            } else {
                console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n🎉 Demo users ready!');
    console.log('\n🔑 SIMPLE TEST CREDENTIALS:');
    demoUsers.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email} | Password: ${user.password}`);
    });
    
    console.log('\n🌐 Test these in your browser at: http://localhost:5000');
}

if (require.main === module) {
    createDemoUsers();
}

module.exports = { createDemoUsers, demoUsers };