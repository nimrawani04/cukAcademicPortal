#!/usr/bin/env node

/**
 * Complete System Test - Academic Portal
 * Tests registration and login end-to-end
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000';

// Test data
const testUser = {
    name: 'Test User Complete',
    email: `test-${Date.now()}@student.com`,
    password: 'test123456'
};

console.log('🧪 COMPLETE SYSTEM TEST - Academic Portal');
console.log('=' .repeat(50));

async function testCompleteSystem() {
    try {
        // 1. Test Health Endpoint
        console.log('\n1️⃣ Testing Health Endpoint...');
        const healthResponse = await axios.get(`${API_BASE}/api/health`);
        console.log('✅ Health Check:', healthResponse.data);
        
        // 2. Test Registration
        console.log('\n2️⃣ Testing Registration...');
        console.log('📝 Registering user:', { name: testUser.name, email: testUser.email });
        
        const registerResponse = await axios.post(`${API_BASE}/api/auth/register`, testUser);
        console.log('✅ Registration successful:', registerResponse.data);
        
        // 3. Test Login
        console.log('\n3️⃣ Testing Login...');
        console.log('🔐 Logging in with:', { email: testUser.email });
        
        const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('✅ Login successful:', loginResponse.data);
        
        // 4. Test with Demo Credentials
        console.log('\n4️⃣ Testing Demo Login...');
        const demoLoginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
            email: 'demo@student.com',
            password: 'demo123'
        });
        console.log('✅ Demo login successful:', demoLoginResponse.data);
        
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('✅ Registration works end-to-end');
        console.log('✅ Login works end-to-end');
        console.log('✅ Database connection working');
        console.log('✅ API endpoints responding correctly');
        
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        
        if (error.response) {
            console.error('📄 Response data:', error.response.data);
            console.error('📊 Response status:', error.response.status);
        } else if (error.request) {
            console.error('🌐 No response received - is server running?');
            console.error('💡 Start server with: npm start');
        } else {
            console.error('⚙️ Request setup error:', error.message);
        }
        
        process.exit(1);
    }
}

// Run the test
testCompleteSystem();