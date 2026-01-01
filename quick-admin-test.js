// Quick test to check admin functionality
const http = require('http');

// Test admin login
const testAdminLogin = () => {
    const postData = JSON.stringify({
        email: 'admin@cukashmir.ac.in',
        password: 'admin123'
    });

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res.headers)}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Response:', data);
            try {
                const parsed = JSON.parse(data);
                console.log('Parsed Response:', JSON.stringify(parsed, null, 2));
            } catch (e) {
                console.log('Could not parse JSON response');
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.write(postData);
    req.end();
};

console.log('Testing admin login...');
testAdminLogin();