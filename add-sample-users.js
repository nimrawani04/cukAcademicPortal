const axios = require('axios');

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Comprehensive sample users
const sampleUsers = [
    // Students - Computer Science
    {
        name: 'Aarav Sharma',
        email: 'aarav.sharma@student.cukashmir.ac.in',
        password: 'student123',
        type: 'student',
        course: 'B.Tech Computer Science',
        year: 2
    },
    {
        name: 'Priya Patel',
        email: 'priya.patel@student.cukashmir.ac.in',
        password: 'student123',
        type: 'student',
        course: 'B.Tech Computer Science',
        year: 3
    },
    {
        name: 'Rohit Kumar',
        email: 'rohit.kumar@student.cukashmir.ac.in',
        password: 'student123',
        type: 'student',
        course: 'M.Tech Computer Science',
        year: 1
    },
    
    // Students - Other Courses
    {
        name: 'Sneha Gupta',
        email: 'sneha.gupta@student.cukashmir.ac.in',
        password: 'student123',
        type: 'student',
        course: 'MBA',
        year: 2
    },
    {
        name: 'Arjun Singh',
        email: 'arjun.singh@student.cukashmir.ac.in',
        password: 'student123',
        type: 'student',
        course: 'B.Tech Civil Engineering',
        year: 3
    },
    {
        name: 'Kavya Reddy',
        email: 'kavya.reddy@student.cukashmir.ac.in',
        password: 'student123',
        type: 'student',
        course: 'BBA',
        year: 1
    },
    
    // International Students
    {
        name: 'Ahmed Hassan',
        email: 'ahmed.hassan@student.cukashmir.ac.in',
        password: 'student123',
        type: 'student',
        course: 'B.Tech Computer Science',
        year: 2
    },
    {
        name: 'Maria Garcia',
        email: 'maria.garcia@student.cukashmir.ac.in',
        password: 'student123',
        type: 'student',
        course: 'MBA',
        year: 1
    },
    
    // Test Users with Different Scenarios
    {
        name: 'Test Student A',
        email: 'test.student.a@test.com',
        password: 'test123',
        type: 'student',
        course: 'B.Tech Computer Science',
        year: 1
    },
    {
        name: 'Test Student B',
        email: 'test.student.b@test.com',
        password: 'test123',
        type: 'student',
        course: 'MBA',
        year: 2
    },
    
    // Demo Users for Presentation
    {
        name: 'Demo Student',
        email: 'demo.student@cukashmir.ac.in',
        password: 'demo123',
        type: 'student',
        course: 'B.Tech Computer Science',
        year: 2
    },
    {
        name: 'Sample User',
        email: 'sample.user@cukashmir.ac.in',
        password: 'sample123',
        type: 'student',
        course: 'MBA',
        year: 1
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

// Function to add all sample users
async function addSampleUsers() {
    console.log('🎓 Adding Sample Users to Academic Portal');
    console.log('=' .repeat(60));
    
    let successCount = 0;
    let failureCount = 0;
    let duplicateCount = 0;
    
    const results = {
        students: [],
        failed: [],
        duplicates: []
    };
    
    for (let i = 0; i < sampleUsers.length; i++) {
        const user = sampleUsers[i];
        console.log(`\n${i + 1}. Adding: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Course: ${user.course} (Year ${user.year})`);
        
        const result = await registerUser(user);
        
        if (result.success) {
            console.log(`   ✅ SUCCESS: ${result.data.message}`);
            results.students.push(user);
            successCount++;
        } else if (result.error.includes('already registered')) {
            console.log(`   🔄 DUPLICATE: User already exists`);
            results.duplicates.push(user);
            duplicateCount++;
        } else {
            console.log(`   ❌ FAILED: ${result.error}`);
            results.failed.push(user);
            failureCount++;
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Display summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 SAMPLE DATA ADDITION SUMMARY');
    console.log('=' .repeat(60));
    console.log(`✅ Successfully Added: ${successCount}`);
    console.log(`🔄 Already Existed: ${duplicateCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📈 Success Rate: ${((successCount / sampleUsers.length) * 100).toFixed(1)}%`);
    
    // Display login credentials
    if (successCount > 0 || duplicateCount > 0) {
        displayLoginCredentials(results);
    }
    
    return results;
}

// Function to display login credentials
function displayLoginCredentials(results) {
    console.log('\n🔑 SAMPLE LOGIN CREDENTIALS');
    console.log('=' .repeat(60));
    
    // Show successful registrations first
    if (results.students.length > 0) {
        console.log('\n👨‍🎓 NEWLY REGISTERED STUDENTS:');
        results.students.slice(0, 5).forEach((user, index) => {
            console.log(`${index + 1}. ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${user.password}`);
            console.log(`   Course: ${user.course} (Year ${user.year})`);
            console.log('');
        });
        
        if (results.students.length > 5) {
            console.log(`   ... and ${results.students.length - 5} more students`);
        }
    }
    
    // Show some existing users for reference
    if (results.duplicates.length > 0) {
        console.log('\n🔄 EXISTING USERS (Available for Login):');
        results.duplicates.slice(0, 3).forEach((user, index) => {
            console.log(`${index + 1}. ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${user.password}`);
            console.log('');
        });
    }
    
    // Quick test credentials
    console.log('\n🚀 QUICK TEST CREDENTIALS:');
    console.log('For immediate testing, use any of these:');
    console.log('• Email: demo.student@cukashmir.ac.in | Password: demo123');
    console.log('• Email: test.student.a@test.com | Password: test123');
    console.log('• Email: aarav.sharma@student.cukashmir.ac.in | Password: student123');
    
    console.log('\n' + '=' .repeat(60));
}

// Function to test login with sample credentials
async function testSampleLogin() {
    console.log('\n🧪 Testing Sample Login (Note: Login endpoint not implemented yet)');
    console.log('=' .repeat(60));
    
    const testCredentials = [
        { email: 'demo.student@cukashmir.ac.in', password: 'demo123' },
        { email: 'test.student.a@test.com', password: 'test123' }
    ];
    
    for (const cred of testCredentials) {
        console.log(`\nTesting login for: ${cred.email}`);
        
        try {
            // This will fail since login endpoint isn't implemented yet
            const response = await axios.post(`${API_BASE_URL}/auth/login`, cred);
            console.log('✅ Login successful');
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('ℹ️  Login endpoint not implemented yet (expected)');
            } else {
                console.log(`❌ Login failed: ${error.response?.data?.message || error.message}`);
            }
        }
    }
}

// Main function
async function main() {
    try {
        console.log('🚀 Starting Sample Data Addition Process...\n');
        
        // Add sample users
        const results = await addSampleUsers();
        
        // Test login (will show that login needs to be implemented)
        await testSampleLogin();
        
        console.log('\n✅ Sample data addition completed!');
        console.log('\n💡 Next Steps:');
        console.log('1. Implement login functionality');
        console.log('2. Create student/faculty dashboards');
        console.log('3. Add course management features');
        console.log('4. Test with the sample credentials above');
        
    } catch (error) {
        console.error('\n❌ Process failed:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    sampleUsers,
    addSampleUsers,
    registerUser
};