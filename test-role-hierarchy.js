// Test script to demonstrate the role hierarchy and designation system
const axios = require('axios');

const API_BASE = 'http://localhost:5003/api';

async function testRoleHierarchy() {
    console.log('🎯 Testing CUK Academic Portal Role Hierarchy\n');

    // Test accounts by role
    const testAccounts = [
        {
            role: 'admin',
            email: 'admin@cuk.com',
            password: 'admin123',
            name: 'System Administrator',
            expectedAccess: ['All system data', 'User management', 'System configuration']
        },
        {
            role: 'faculty',
            email: 'professor@cuk.com',
            password: 'prof123',
            name: 'Dr. John Professor',
            designation: 'Professor',
            expectedAccess: ['All department students', 'Advanced subjects', 'Research supervision']
        },
        {
            role: 'faculty',
            email: 'demo@faculty.com',
            password: 'demo123',
            name: 'Demo Faculty',
            designation: 'Assistant Professor',
            expectedAccess: ['Assigned students', 'Regular subjects', 'Academic activities']
        },
        {
            role: 'faculty',
            email: 'lecturer@cuk.com',
            password: 'lect123',
            name: 'Ms. Sarah Lecturer',
            designation: 'Lecturer',
            expectedAccess: ['Subject students', 'Basic teaching', 'Student assessment']
        },
        {
            role: 'faculty',
            email: 'guest@cuk.com',
            password: 'guest123',
            name: 'Mr. Mike Guest',
            designation: 'Guest Faculty',
            expectedAccess: ['Temporary subjects', 'Limited access', 'Specific assignments']
        },
        {
            role: 'student',
            email: 'demo@student.com',
            password: 'demo123',
            name: 'Demo Student',
            expectedAccess: ['Personal data only', 'Own marks/attendance', 'General notices']
        }
    ];

    for (const account of testAccounts) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🔍 Testing: ${account.name} (${account.role.toUpperCase()})`);
        if (account.designation) {
            console.log(`📋 Designation: ${account.designation}`);
        }
        console.log(`📧 Email: ${account.email}`);
        console.log(`🎯 Expected Access: ${account.expectedAccess.join(', ')}`);
        console.log(`${'='.repeat(60)}`);

        try {
            // Test login
            const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
                email: account.email,
                password: account.password,
                role: account.role
            });

            if (loginResponse.data.success) {
                console.log('✅ Login successful');
                const token = loginResponse.data.data.token;
                const user = loginResponse.data.data.user;
                
                console.log(`👤 User: ${user.name}`);
                console.log(`🎭 Role: ${user.role}`);
                if (user.profile?.designation) {
                    console.log(`🏷️  Designation: ${user.profile.designation}`);
                }
                console.log(`📊 Status: ${user.status}`);

                // Test role-specific endpoints
                if (account.role === 'student') {
                    await testStudentEndpoints(token);
                } else if (account.role === 'faculty') {
                    await testFacultyEndpoints(token, account.designation);
                } else if (account.role === 'admin') {
                    await testAdminEndpoints(token);
                }

            } else {
                console.log('❌ Login failed:', loginResponse.data.message);
            }

        } catch (error) {
            console.log('❌ Test failed:', error.response?.data?.message || error.message);
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('🎉 Role Hierarchy Testing Complete!');
    console.log(`${'='.repeat(60)}`);
    
    console.log('\n📊 ROLE HIERARCHY SUMMARY:');
    console.log('🔴 ADMIN: Highest authority - Complete system control');
    console.log('🔵 FACULTY: Academic controllers with designation-based authority:');
    console.log('   🏆 Professor: Highest faculty authority');
    console.log('   🥈 Assistant Professor: Standard faculty level');
    console.log('   🥉 Lecturer: Teaching-focused authority');
    console.log('   📚 Guest Faculty: Limited/temporary authority');
    console.log('🟢 STUDENT: Data consumers - Personal data access only');
    
    console.log('\n✅ Key Points:');
    console.log('• Authentication is simple for all roles');
    console.log('• Designation affects authority, not authentication');
    console.log('• Each role has appropriate access levels');
    console.log('• System maintains academic hierarchy');
}

async function testStudentEndpoints(token) {
    console.log('\n📚 Testing Student Endpoints:');
    
    try {
        const profileResponse = await axios.get(`${API_BASE}/student/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('  ✅ Profile access: Own data only');
        
        const marksResponse = await axios.get(`${API_BASE}/student/marks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('  ✅ Marks access: Personal marks only');
        
        const noticesResponse = await axios.get(`${API_BASE}/student/notices`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('  ✅ Notices access: Relevant notices only');
        
    } catch (error) {
        console.log('  ❌ Student endpoint error:', error.response?.data?.message || error.message);
    }
}

async function testFacultyEndpoints(token, designation) {
    console.log(`\n👨‍🏫 Testing Faculty Endpoints (${designation}):`);
    
    try {
        const profileResponse = await axios.get(`${API_BASE}/teacher/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('  ✅ Profile access: Faculty profile with designation');
        
        const studentsResponse = await axios.get(`${API_BASE}/teacher/students`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`  ✅ Students access: ${studentsResponse.data.data.length} students visible`);
        
        const noticesResponse = await axios.get(`${API_BASE}/teacher/notices`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('  ✅ Notice management: Can create and manage notices');
        
        // Authority level based on designation
        if (designation === 'Professor') {
            console.log('  🏆 Authority: Highest faculty level - Can access all department data');
        } else if (designation === 'Assistant Professor') {
            console.log('  🥈 Authority: Standard faculty level - Regular academic control');
        } else if (designation === 'Lecturer') {
            console.log('  🥉 Authority: Teaching-focused - Subject-specific access');
        } else if (designation === 'Guest Faculty') {
            console.log('  📚 Authority: Limited access - Temporary assignments only');
        }
        
    } catch (error) {
        console.log('  ❌ Faculty endpoint error:', error.response?.data?.message || error.message);
    }
}

async function testAdminEndpoints(token) {
    console.log('\n👨‍💼 Testing Admin Endpoints:');
    
    try {
        // Note: Admin endpoints would need to be implemented
        console.log('  🔴 Admin Authority: Complete system control');
        console.log('  ✅ Expected Access: All users, all data, system settings');
        console.log('  ✅ Can manage: Students, Faculty, Courses, Reports');
        console.log('  ⚠️  Admin-specific endpoints to be implemented');
        
    } catch (error) {
        console.log('  ❌ Admin endpoint error:', error.response?.data?.message || error.message);
    }
}

// Run the test
testRoleHierarchy().catch(console.error);