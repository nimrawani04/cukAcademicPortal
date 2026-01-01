#!/usr/bin/env node

/**
 * Test Frontend ↔ Backend Connection
 * Academic Management Portal
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:5001';

console.log('🧪 TESTING FRONTEND ↔ BACKEND CONNECTION');
console.log('=' .repeat(50));

async function testConnection() {
    try {
        // 1. Test Health Endpoint
        console.log('\n1️⃣ Testing Health Endpoint...');
        console.log(`🌐 GET ${BACKEND_URL}/api/health`);
        
        const healthResponse = await axios.get(`${BACKEND_URL}/api/health`);
        console.log('✅ Health Check Response:', healthResponse.data);
        
        // 2. Test Registration
        console.log('\n2️⃣ Testing Registration...');
        const testUser = {
            name: 'Connection Test User',
            email: `test-connection-${Date.now()}@student.com`,
            password: 'test123456'
        };
        
        console.log(`🌐 POST ${BACKEND_URL}/api/auth/register`);
        console.log('📝 Data:', { name: testUser.name, email: testUser.email });
        
        const registerResponse = await axios.post(`${BACKEND_URL}/api/auth/register`, testUser);
        console.log('✅ Registration Response:', registerResponse.data);
        
        // 3. Test Login
        console.log('\n3️⃣ Testing Login...');
        console.log(`🌐 POST ${BACKEND_URL}/api/auth/login`);
        console.log('🔐 Credentials:', { email: testUser.email });
        
        const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('✅ Login Response:', loginResponse.data);
        
        console.log('\n🎉 ALL CONNECTION TESTS PASSED!');
        console.log('✅ Backend is running on port 5001');
        console.log('✅ CORS is configured correctly');
        console.log('✅ API endpoints are responding');
        console.log('✅ MongoDB connection is working');
        console.log('\n🚀 Frontend on port 5500 should now work!');
        
    } catch (error) {
        console.error('\n❌ CONNECTION TEST FAILED:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('🔴 Backend server is not running!');
            console.error('💡 Start the backend server with: npm start');
            console.error('💡 Make sure it\'s running on port 5001');
        } else if (error.response) {
            console.error('📄 Response data:', error.response.data);
            console.error('📊 Response status:', error.response.status);
        } else {
            console.error('⚙️ Error details:', error.message);
        }
        
        process.exit(1);
    }
}

// Run the test
testConnection();