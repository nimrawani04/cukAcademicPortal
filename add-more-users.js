const axios = require('axios');

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Additional diverse users
const additionalUsers = [
    // More diverse students
    {
        name: 'Fatima Khan',
        email: 'fatima.khan@student.cukashmir.ac.in',
        password: 'student123'
    },
    {
        name: 'Vikram Singh',
        email: 'vikram.singh@student.cukashmir.ac.in',
        password: 'student123'
    },
    {
        name: 'Ananya Iyer',
        email: 'ananya.iyer@student.cukashmir.ac.in',
        password: 'student123'
    },
    {
        name: 'Rajesh Gupta',
        email: 'rajesh.gupta@student.cukashmir.ac.in',
        password: 'student123'
    },
    {
        name: 'Meera Sharma',
        email: 'meera.sharma@student.cukashmir.ac.in',
        password: 'student123'
    },
    
    // International students
    {
        name: 'John Smith',
        email: 'john.smith@student.cukashmir.ac.in',
        password: 'student123'
    },
    {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@student.cukashmir.ac.in',
        password: 'student123'
    },
    {
        name: 'Li Wei',
        email: 'li.wei@student.cukashmir.ac.in',
        password: 'student123'
    },
    
    // More test users
    {
        name: 'Test User Alpha',
        email: 'alpha@test.com',
        password: 'test123'
    },
    {
        name: 'Test User Beta',
        email: 'beta@test.com',
        password: 'test123'
    },
    {
        name: 'Test User Gamma',
        email: 'gamma@test.com',
        password: 'test123'
    },
    
    // Demo users for presentations
    {
        name: 'Demo Faculty',
        email: 'demo.faculty@cukashmir.ac.in',
        password: 'demo123'
    },
    {
        name: 'Demo Admin',
        email: 'demo.admin@cukashmir.ac.in',
        password: 'demo123'
    }
];

// Function to register a user
async function registerUser(userData) {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
            name: userData.name,
            email: userData.email,
            password: userData.password
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        return {
            success: true,
            data: response.data,
            user: userData
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            user: userData
        };
    }
}

// Add additional users
async function addMoreUsers() {
    console.log('➕ Adding More Diverse Users');
    console.log('=' .repeat(50));
    
    let successCount = 0;
    let duplicateCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < additionalUsers.length; i++) {
        const user = additionalUsers[i];
        console.log(`\n${i + 1}. Adding: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        
        const result = await registerUser(user);
        
        if (result.success) {
            console.log(`   ✅ SUCCESS: ${result.data.message}`);
            successCount++;
        } else if (result.error.includes('already registered')) {
            console.log(`   🔄 DUPLICATE: User already exists`);
            duplicateCount++;
        } else {
            console.log(`   ❌ FAILED: ${result.error}`);
            failureCount++;
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('📊 ADDITIONAL USERS SUMMARY');
    console.log(`✅ Successfully Added: ${successCount}`);
    console.log(`🔄 Already Existed: ${duplicateCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📈 Success Rate: ${((successCount / additionalUsers.length) * 100).toFixed(1)}%`);
    
    return { successCount, duplicateCount, failureCount };
}

// Main function
async function main() {
    try {
        console.log('🚀 Adding More Diverse Users to Database...\n');
        
        const results = await addMoreUsers();
        
        if (results.successCount > 0) {
            console.log('\n🎉 Additional users successfully added!');
            console.log('\n🔑 NEW CREDENTIALS AVAILABLE:');
            console.log('• Email: fatima.khan@student.cukashmir.ac.in | Password: student123');
            console.log('• Email: john.smith@student.cukashmir.ac.in | Password: student123');
            console.log('• Email: demo.faculty@cukashmir.ac.in | Password: demo123');
            console.log('• Email: alpha@test.com | Password: test123');
        }
        
        console.log('\n✅ Process completed!');
        
    } catch (error) {
        console.error('\n❌ Process failed:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    additionalUsers,
    addMoreUsers
};