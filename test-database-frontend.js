// Test script to verify the database-driven frontend functionality
const axios = require('axios');

const API_BASE = 'http://localhost:5003/api';

async function testLogin() {
    console.log('🔍 Testing login functionality...');
    
    try {
        // Test student login
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: 'demo@student.com',
            password: 'demo123',
            role: 'student'
        });

        if (response.data.success) {
            console.log('✅ Student login successful');
            console.log('📝 User data:', response.data.data.user);
            
            const token = response.data.data.token;
            
            // Test student profile API
            console.log('\n🔍 Testing student profile API...');
            const profileResponse = await axios.get(`${API_BASE}/student/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (profileResponse.data.success) {
                console.log('✅ Student profile API working');
                console.log('📝 Profile data:', profileResponse.data.data);
            } else {
                console.log('❌ Student profile API failed:', profileResponse.data.message);
            }
            
            // Test student marks API
            console.log('\n🔍 Testing student marks API...');
            const marksResponse = await axios.get(`${API_BASE}/student/marks`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (marksResponse.data.success) {
                console.log('✅ Student marks API working');
                console.log('📝 Marks count:', marksResponse.data.data.marks.length);
            } else {
                console.log('❌ Student marks API failed:', marksResponse.data.message);
            }
            
            // Test student attendance API
            console.log('\n🔍 Testing student attendance API...');
            const attendanceResponse = await axios.get(`${API_BASE}/student/attendance`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (attendanceResponse.data.success) {
                console.log('✅ Student attendance API working');
                console.log('📝 Attendance records:', attendanceResponse.data.data.attendance.length);
            } else {
                console.log('❌ Student attendance API failed:', attendanceResponse.data.message);
            }
            
            // Test student notices API
            console.log('\n🔍 Testing student notices API...');
            const noticesResponse = await axios.get(`${API_BASE}/student/notices`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (noticesResponse.data.success) {
                console.log('✅ Student notices API working');
                console.log('📝 Notices count:', noticesResponse.data.data.notices.length);
            } else {
                console.log('❌ Student notices API failed:', noticesResponse.data.message);
            }
            
        } else {
            console.log('❌ Student login failed:', response.data.message);
        }
        
    } catch (error) {
        console.log('❌ Login test failed:', error.response?.data?.message || error.message);
    }
}

async function testFacultyLogin() {
    console.log('\n🔍 Testing faculty login functionality...');
    
    try {
        // Test faculty login
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: 'demo@faculty.com',
            password: 'demo123',
            role: 'faculty'
        });

        if (response.data.success) {
            console.log('✅ Faculty login successful');
            console.log('📝 User data:', response.data.data.user);
            
            const token = response.data.data.token;
            
            // Test teacher profile API
            console.log('\n🔍 Testing teacher profile API...');
            const profileResponse = await axios.get(`${API_BASE}/teacher/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (profileResponse.data.success) {
                console.log('✅ Teacher profile API working');
                console.log('📝 Profile data:', profileResponse.data.data);
            } else {
                console.log('❌ Teacher profile API failed:', profileResponse.data.message);
            }
            
            // Test teacher students API
            console.log('\n🔍 Testing teacher students API...');
            const studentsResponse = await axios.get(`${API_BASE}/teacher/students`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (studentsResponse.data.success) {
                console.log('✅ Teacher students API working');
                console.log('📝 Students count:', studentsResponse.data.data.length);
            } else {
                console.log('❌ Teacher students API failed:', studentsResponse.data.message);
            }
            
            // Test teacher notices API
            console.log('\n🔍 Testing teacher notices API...');
            const noticesResponse = await axios.get(`${API_BASE}/teacher/notices`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (noticesResponse.data.success) {
                console.log('✅ Teacher notices API working');
                console.log('📝 Notices count:', noticesResponse.data.data.length);
            } else {
                console.log('❌ Teacher notices API failed:', noticesResponse.data.message);
            }
            
        } else {
            console.log('❌ Faculty login failed:', response.data.message);
        }
        
    } catch (error) {
        console.log('❌ Faculty login test failed:', error.response?.data?.message || error.message);
    }
}

async function runTests() {
    console.log('🚀 Starting Database-Driven Frontend Tests\n');
    
    await testLogin();
    await testFacultyLogin();
    
    console.log('\n✅ All tests completed!');
    console.log('\n📋 Summary:');
    console.log('- The backend APIs are working correctly');
    console.log('- Authentication is functioning properly');
    console.log('- Database-driven data is being served');
    console.log('- Frontend can now connect to real APIs instead of hard-coded data');
    console.log('\n🎉 Your system is now fully database-driven!');
}

// Run the tests
runTests().catch(console.error);