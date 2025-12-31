// Simple test for registration endpoint
const axios = require('axios');

const testRegistration = async () => {
    try {
        console.log('Testing registration endpoint...');
        
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123'
        });
        
        console.log('✅ Registration successful:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('❌ Registration failed:', error.response.data);
        } else {
            console.log('❌ Error:', error.message);
        }
    }
};

testRegistration();