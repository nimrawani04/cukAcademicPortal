// Test validation scenarios
const axios = require('axios');

const testCases = [
    {
        name: 'Valid registration',
        data: { name: 'Jane Doe', email: 'jane@example.com', password: 'password123' },
        expectSuccess: true
    },
    {
        name: 'Missing name',
        data: { email: 'test@example.com', password: 'password123' },
        expectSuccess: false
    },
    {
        name: 'Missing email',
        data: { name: 'Test User', password: 'password123' },
        expectSuccess: false
    },
    {
        name: 'Missing password',
        data: { name: 'Test User', email: 'test@example.com' },
        expectSuccess: false
    },
    {
        name: 'Short password',
        data: { name: 'Test User', email: 'test@example.com', password: '123' },
        expectSuccess: false
    }
];

const runTests = async () => {
    console.log('Running validation tests...\n');
    
    for (const testCase of testCases) {
        try {
            console.log(`Testing: ${testCase.name}`);
            
            const response = await axios.post('http://localhost:5000/api/auth/register', testCase.data);
            
            if (testCase.expectSuccess) {
                console.log('✅ PASS - Registration successful');
            } else {
                console.log('❌ FAIL - Expected failure but got success');
            }
            
        } catch (error) {
            if (!testCase.expectSuccess) {
                console.log('✅ PASS - Expected failure:', error.response.data.message);
            } else {
                console.log('❌ FAIL - Expected success but got error:', error.response.data.message);
            }
        }
        console.log('');
    }
};

runTests();