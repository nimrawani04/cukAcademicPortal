/**
 * Test script for admin login functionality
 */

// Check if node-fetch is available
try {
    const fetch = require('node-fetch');
    runFetchTests();
} catch (error) {
    console.log('⚠️  node-fetch not available, using basic test...');
    runBasicTest();
}

// Basic test without fetch
function runBasicTest() {
    console.log('🔍 === BASIC ADMIN TEST ===');
    console.log('📝 Admin Login Credentials:');
    console.log('   Email: admin@cukashmir.ac.in');
    console.log('   Password: admin123');
    console.log('   Email: dean@cukashmir.ac.in');
    console.log('   Password: dean123');
    console.log('📝 Test URLs:');
    console.log('   Main Portal: http://localhost:5000');
    console.log('   Admin Login: http://localhost:5000/admin-login.html');
    console.log('   Admin Dashboard: http://localhost:5000/admin-dashboard.html');
    console.log('📝 API Endpoints:');
    console.log('   POST /api/admin/login - Admin authentication');
    console.log('   GET /api/admin/stats - Dashboard statistics');
    console.log('   GET /api/admin/students - View all students');
    console.log('   GET /api/admin/teachers - View all teachers');
    console.log('   POST /api/admin/create-teacher - Create teacher account');
    console.log('   DELETE /api/admin/user/:id - Delete user');
    console.log('   PATCH /api/admin/approve-student/:id - Approve student');
    console.log('✅ Admin system is ready for testing!');
    console.log('\n🔍 === TESTING INSTRUCTIONS ===');
    console.log('1. Open http://localhost:5000 in your browser');
    console.log('2. Click "Admin Portal" button in the header');
    console.log('3. Login with admin@cukashmir.ac.in / admin123');
    console.log('4. Test the admin dashboard functionality');
}

// Test admin login with fetch
async function testAdminLogin() {
    try {
        console.log('🔍 === TESTING ADMIN LOGIN ===');
        
        const fetch = require('node-fetch');
        const response = await fetch('http://localhost:5000/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@cukashmir.ac.in',
                password: 'admin123'
            })
        });
        
        const data = await response.json();
        
        console.log('📝 Response Status:', response.status);
        console.log('📝 Response Data:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log('✅ Admin login successful!');
            console.log('📝 Admin Token:', data.data.token);
            console.log('📝 Admin User:', data.data.user);
            
            // Test admin stats API
            await testAdminStats(data.data.token);
            
        } else {
            console.log('❌ Admin login failed:', data.message);
        }
        
    } catch (error) {
        console.error('❌ Admin login test error:', error.message);
    }
}

// Test admin stats API
async function testAdminStats(token) {
    try {
        console.log('\n🔍 === TESTING ADMIN STATS ===');
        
        const fetch = require('node-fetch');
        const response = await fetch('http://localhost:5000/api/admin/stats', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        console.log('📝 Stats Response Status:', response.status);
        console.log('📝 Stats Response Data:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log('✅ Admin stats retrieved successfully!');
        } else {
            console.log('❌ Admin stats failed:', data.message);
        }
        
    } catch (error) {
        console.error('❌ Admin stats test error:', error.message);
    }
}

// Run tests with fetch
async function runFetchTests() {
    console.log('🚀 Starting admin API tests...\n');
    
    await testAdminLogin();
    
    console.log('\n🔍 === ALL TESTS COMPLETE ===');
}